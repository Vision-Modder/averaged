import { DurableObject } from "cloudflare:workers";

export class NumberObject extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
  }

  async getNumber() {
    let totalSum = (await this.ctx.storage.get("totalSum")) || 0;
    let totalCount = (await this.ctx.storage.get("totalCount")) || 0;
    return totalCount === 0 ? 0 : totalSum / totalCount;
  }

  async addChange(change) {
    let totalSum = (await this.ctx.storage.get("totalSum")) || 0;
    let totalCount = (await this.ctx.storage.get("totalCount")) || 0;
    totalSum = totalSum + change;
    totalCount = totalCount + 1;
    await this.ctx.storage.put("totalSum", totalSum);
    await this.ctx.storage.put("totalCount", totalCount);
    return totalCount === 0 ? 0 : totalSum / totalCount;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/number" && request.method === "GET") {
      const id = env.NUMBER_DO.idFromName("global");
      const stub = env.NUMBER_DO.get(id);
      const number = await stub.getNumber();
      return Response.json({ number: number });
    }

    if (url.pathname === "/number" && request.method === "POST") {
      const body = await request.json();
      const id = env.NUMBER_DO.idFromName("global");
      const stub = env.NUMBER_DO.get(id);
      const number = await stub.addChange(body.change);
      return Response.json({ number: number });
    }

    return env.ASSETS.fetch(request);
  }
};
