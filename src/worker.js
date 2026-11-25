import { DurableObject } from "cloudflare:workers";

export class NumberObject extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sockets = new Set();
  }

  broadcastNumber(number) {
    const payload = JSON.stringify({ number });
    for (const ws of this.sockets) {
      try {
        ws.send(payload);
      } catch {
        this.sockets.delete(ws);
      }
    }
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      this.sockets.add(server);
      server.addEventListener("close", () => this.sockets.delete(server));
      server.addEventListener("error", () => this.sockets.delete(server));
      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Not found", { status: 404 });
  }

  async getNumber() {
    let totalSum = (await this.ctx.storage.get("totalSum")) ?? 0;
    let totalCount = (await this.ctx.storage.get("totalCount")) ?? 0;
    let lastTick = (await this.ctx.storage.get("lastTick")) ?? Date.now();

    const now = Date.now();
    if (now - lastTick >= 2000) {
      const stepsElapsed = Math.min(Math.floor((now - lastTick) / 2000), 10);
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
    this.broadcastNumber(rounded);
    return rounded;
  }

  async addChange(change) {
    const safeChange = Number(change) || 0;
    let totalSum = (await this.ctx.storage.get("totalSum")) ?? 0;
    let totalCount = (await this.ctx.storage.get("totalCount")) ?? 0;

    totalSum += safeChange;
    totalCount += 1;

    await this.ctx.storage.put("totalSum", totalSum);
    await this.ctx.storage.put("totalCount", totalCount);

    const avg = totalCount === 0 ? 0 : totalSum / totalCount;
    const rounded = Number(avg.toFixed(5));
    this.broadcastNumber(rounded);
    return rounded;
  }
}

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
      const body = await request.json();
      const id = env.NUMBER_DO.idFromName("global");
      const stub = env.NUMBER_DO.get(id);
      const number = await stub.addChange(body.change);
      return Response.json({ number });
    }

    return env.ASSETS.fetch(request);
  }
};