// Routing Worker: serves /static/audio/* from R2, everything else from the
// Quartz static build. Audio never enters git — see the pipeline architecture
// doc for why (chapter audio can exceed Workers' 25 MiB static-asset limit).
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/static/audio/")) {
      const key = url.pathname.replace("/static/audio/", "");
      const object = await env.AUDIO.get(key);

      if (!object) {
        return new Response("Not found", { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("cache-control", "public, max-age=31536000, immutable");
      if (!headers.has("content-type")) {
        headers.set("content-type", "audio/mpeg");
      }

      return new Response(object.body, { headers });
    }

    return env.ASSETS.fetch(request);
  },
};
