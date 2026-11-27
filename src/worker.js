import { neon } from "@neondatabase/serverless";
import { DurableObject } from "cloudflare:workers";

const HOUR_MS = 60 * 60 * 1000;
const BOT_TICK_MS = 2000;

function getDb(env) {
  if (!env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL binding");
  }
  return neon(env.DATABASE_URL);
}

function toSafeNumber(val, fallback = 0) {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

// --- Neon Database Helpers ---

export async function loadCurrentNumber(env) {
  const sql = getDb(env);
  const rows = await sql`
    SELECT value FROM current_number WHERE id = 1
  `;
  return toSafeNumber(rows[0]?.value, 0);
}

export async function saveCurrentNumber(env, value) {
  const sql = getDb(env);
  const safeValue = toSafeNumber(value, 0);
  await sql`
    UPDATE current_number
    SET value = ${safeValue}, updated_at = NOW()
    WHERE id = 1
  `;
}

export async function recordNumberSnapshot(env, value) {
  const sql = getDb(env);
  const safeValue = toSafeNumber(value, 0);
  await sql`
    INSERT INTO number_history (recorded_value)
    VALUES (${safeValue})
  `;
}

export async function getRecentHistory(env, limit = 100) {
  const sql = getDb(env);
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  return sql`
    SELECT id, recorded_value, recorded_at
    FROM number_history
    ORDER BY id DESC
    LIMIT ${safeLimit}
  `;
}

export async function getTeams(env) {
  const sql = getDb(env);
  return sql`
    SELECT id, name, clicks, trophies, accent_color
    FROM teams
    ORDER BY id ASC
  `;
}

export async function upsertUser(env, { discordId = null, googleId = null, displayName, username = null }) {
  const sql = getDb(env);
  const cleanDisplayName = String(displayName || "Player").trim().slice(0, 40);
  const cleanUsername = username ? String(username).trim().slice(0, 32) : null;

  if (discordId) {
    const rows = await sql`
      INSERT INTO users (discord_id, display_name, username)
      VALUES (${discordId}, ${cleanDisplayName}, ${cleanUsername})
      ON CONFLICT (discord_id) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            username = COALESCE(EXCLUDED.username, users.username)
      RETURNING *
    `;
    return rows[0];
  }

  if (googleId) {
    const rows = await sql`
      INSERT INTO users (google_id, display_name, username)
      VALUES (${googleId}, ${cleanDisplayName}, ${cleanUsername})
      ON CONFLICT (google_id) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            username = COALESCE(EXCLUDED.username, users.username)
      RETURNING *
    `;
    return rows[0];
  }

  const rows = await sql`
    INSERT INTO users (display_name, username)
    VALUES (${cleanDisplayName}, ${cleanUsername})
    RETURNING *
  `;
  return rows[0];
}

// --- Durable Object: Real-Time Number State ---

export class NumberObject extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.sockets = new Set();
    this.latestNumber = 0;
    this.lastHourlySave = 0;

    this.ctx.blockConcurrencyWhile(async () => {
      const existingCount = await this.ctx.storage.get("totalCount");
      const savedLastSave = await this.ctx.storage.get("lastHourlySave");
      this.lastHourlySave = toSafeNumber(savedLastSave, Date.now());

      if (existingCount === undefined) {
        const savedValue = await loadCurrentNumber(this.env);
        await this.ctx.storage.put("totalSum", savedValue);
        await this.ctx.storage.put("totalCount", savedValue === 0 ? 0 : 1);
        await this.ctx.storage.put("lastHourlySave", this.lastHourlySave);
        this.latestNumber = savedValue;
      } else {
        const totalSum = toSafeNumber(await this.ctx.storage.get("totalSum"), 0);
        const countNum = toSafeNumber(existingCount, 0);
        this.latestNumber = countNum === 0 ? 0 : Number((totalSum / countNum).toFixed(5));
      }

      // Ensure an hourly alarm is scheduled so Neon stays updated even during quiet periods
      const currentAlarm = await this.ctx.storage.getAlarm();
      if (!currentAlarm) {
        await this.ctx.storage.setAlarm(Date.now() + HOUR_MS);
      }
    });

    this.startBotLoop();
  }

  startBotLoop() {
    if (this.botTimer) return;
    this.botTimer = setInterval(async () => {
      if (!this.sockets || this.sockets.size === 0) return;

      let totalSum = toSafeNumber(await this.ctx.storage.get("totalSum"), 0);
      let totalCount = toSafeNumber(await this.ctx.storage.get("totalCount"), 1);
      const currentAvg = totalCount === 0 ? 0 : totalSum / totalCount;

      // 4 ticks/sec * up to ±12.5 per tick = up to ±50 swing in 1 second
      const desiredShift = Math.random() * 25 - 12.5;
      const targetAvg = currentAvg + desiredShift;

      // Scale the added value by totalCount so the true average actually moves by desiredShift
      const weightedEntry = targetAvg * (totalCount + 1) - totalSum;

      totalSum += weightedEntry;
      totalCount += 1;

      await this.ctx.storage.put("totalSum", totalSum);
      await this.ctx.storage.put("totalCount", totalCount);

      const rounded = Number((totalSum / totalCount).toFixed(5));
      this.latestNumber = rounded;
      this.broadcastNumber(rounded);
      this.maybeSaveHourly(rounded, { snapshotHistory: true });
    }, 250);
  }

  broadcastNumber(number) {
    const payload = JSON.stringify({ type: "number", number });
    for (const ws of this.sockets) {
      try {
        ws.send(payload);
      } catch {
        this.sockets.delete(ws);
      }
    }
  }

  // Only writes to Neon once every hour; live state & WebSockets stay instant
  maybeSaveHourly(rounded, { snapshotHistory = false } = {}) {
    const now = Date.now();
    if (now - this.lastHourlySave < HOUR_MS) return;

    this.lastHourlySave = now;
    this.ctx.waitUntil(
      (async () => {
        await this.ctx.storage.put("lastHourlySave", now);
        await saveCurrentNumber(this.env, rounded);
        if (snapshotHistory) {
          await recordNumberSnapshot(this.env, rounded);
        }
      })().catch((err) => console.error("Hourly Neon sync failed:", err))
    );
  }

  async alarm() {
    // Runs roughly once an hour to persist current_number + history snapshot
    await this.ctx.storage.setAlarm(Date.now() + HOUR_MS);
    this.lastHourlySave = Date.now();
    await this.ctx.storage.put("lastHourlySave", this.lastHourlySave);
    await saveCurrentNumber(this.env, this.latestNumber);
    await recordNumberSnapshot(this.env, this.latestNumber);
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      this.sockets.add(server);

      // Send current number immediately on connect
      server.send(JSON.stringify({ type: "number", number: this.latestNumber }));

      server.addEventListener("close", () => this.sockets.delete(server));
      server.addEventListener("error", () => this.sockets.delete(server));
      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Not found", { status: 404 });
  }

  async getNumber() {
    let totalSum = toSafeNumber(await this.ctx.storage.get("totalSum"), 0);
    let totalCount = toSafeNumber(await this.ctx.storage.get("totalCount"), 0);
    let lastTick = toSafeNumber(await this.ctx.storage.get("lastTick"), Date.now());

    const now = Date.now();
    if (now - lastTick >= BOT_TICK_MS) {
      const stepsElapsed = Math.min(Math.floor((now - lastTick) / BOT_TICK_MS), 10);
      for (let i = 0; i < stepsElapsed; i++) {
        const fakeDelta = (Math.floor(Math.random() * 1000001) - 500000) / 10000;
        totalSum += fakeDelta;
        totalCount += 1;
      }
      lastTick = now;
      await this.ctx.storage.put("totalSum", totalSum);
      await this.ctx.storage.put("totalCount", totalCount);
      await this.ctx.storage.put("lastTick", lastTick);
    }

    const avg = totalCount === 0 ? 0 : totalSum / totalCount;
    const rounded = Number(avg.toFixed(5));
    this.latestNumber = rounded;
    this.broadcastNumber(rounded);
    this.maybeSaveHourly(rounded, { snapshotHistory: true });
    return rounded;
  }

  async addChange(change) {
    const safeChange = toSafeNumber(change, 0);
    let totalSum = toSafeNumber(await this.ctx.storage.get("totalSum"), 0);
    let totalCount = toSafeNumber(await this.ctx.storage.get("totalCount"), 0);

    totalSum += safeChange;
    totalCount += 1;

    await this.ctx.storage.put("totalSum", totalSum);
    await this.ctx.storage.put("totalCount", totalCount);

    const avg = totalCount === 0 ? 0 : totalSum / totalCount;
    const rounded = Number(avg.toFixed(5));
    this.latestNumber = rounded;

    // Instant live broadcast to connected players
    this.broadcastNumber(rounded);

    // Persists to Neon at most once per hour
    this.maybeSaveHourly(rounded, { snapshotHistory: true });

    return rounded;
  }
}

// --- Main Worker Router ---

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      const id = env.NUMBER_DO.idFromName("global");
      const stub = env.NUMBER_DO.get(id);
      return stub.fetch(request);
    }

    if (url.pathname === "/number" && request.method === "GET") {
      const id = env.NUMBER_DO.idFromName("global");
      const stub = env.NUMBER_DO.get(id);
      const number = await stub.getNumber();
      return Response.json({ number });
    }

    if (url.pathname === "/number" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
      }

      const change = Number(body?.change);
      if (!Number.isFinite(change)) {
        return Response.json({ error: "change must be a finite number" }, { status: 400 });
      }

      const id = env.NUMBER_DO.idFromName("global");
      const stub = env.NUMBER_DO.get(id);
      const number = await stub.addChange(change);
      return Response.json({ number });
    }

    if (url.pathname === "/history" && request.method === "GET") {
      const limit = url.searchParams.get("limit") || 100;
      const rows = await getRecentHistory(env, limit);
      return Response.json({ history: rows });
    }

    if (url.pathname === "/teams" && request.method === "GET") {
      const teams = await getTeams(env);
      return Response.json({ teams });
    }

    return env.ASSETS.fetch(request);
  },
};