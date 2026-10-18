let number = 0;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/number" && request.method === "GET") {
      return Response.json({ number: number });
    }

    if (url.pathname === "/number" && request.method === "POST") {
      const body = await request.json();
      number = number + body.change;
      return Response.json({ number: number });
    }

    return env.ASSETS.fetch(request);
  }
};
