import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

addEventListener("fetch", (event) => {
  event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
  try {
    // Try to serve the static asset
    return await getAssetFromKV(event);
  } catch (e) {
    // If not found, fallback to index.html for SPA, or 404
    if (event.request.method === "GET") {
      try {
        return await getAssetFromKV(event, { mapRequestToAsset: (req) => new Request(`${new URL(req.url).origin}/index.html`, req) });
      } catch (e2) {
        return new Response("Not found", { status: 404 });
      }
    }
    return new Response("Not found", { status: 404 });
  }
}
