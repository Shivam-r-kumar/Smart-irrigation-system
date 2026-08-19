async function fetchAsset(request, env) {
  if (!env?.ASSETS?.fetch) return new Response("Static asset binding unavailable", { status: 503 });
  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request, env) {
    const response = await fetchAsset(request, env);
    if (response.status !== 404 || request.method !== "GET") return response;

    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    if (!acceptsHtml) return response;

    const indexUrl = new URL("/index.html", request.url);
    return fetchAsset(new Request(indexUrl, { headers: request.headers }), env);
  },
};
