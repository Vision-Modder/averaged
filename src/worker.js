import { DurableObject } from "cloudflare:workers";

export class NumberObject extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
  }

  async getNumber() {
    let totalSum = (await this.ctx.storage.get("totalSum")) ?? 0;
    let totalCount = (await this.ctx.storage.get("totalCount")) ?? 0;
    let lastTick = (await this.ctx.storage.get("lastTick")) ?? Date.now();

    const now = Date.now();
    // Advance once every 2 seconds for everyone equally
    if (now - lastTick >= 2000) {
      const stepsElapsed = Math.min(Math.floor((now - lastTick) / 2000), 10);
      for (let i = 0; i < stepsElapsed; i++) {
        // Fake shared delta matching your -50 to +50 scale
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
    return Number(avg.toFixed(5));
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
    return Number(avg.toFixed(5));
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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