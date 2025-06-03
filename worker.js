/**
 * Cloudflare Worker for serving static assets from the pdc-zip directory (Webflow export).
 *
 * - Handles requests for static files using @cloudflare/kv-asset-handler.
 * - Injects a <meta name="robots" content="noindex, nofollow"> tag into HTML responses if not present.
 * - Serves a restrictive robots.txt to block all crawlers.
 * - Falls back to index.html for SPA routes, or returns 404 if not found.
 */
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

/**
 * The content of /robots.txt, disallowing all crawlers (including major bots and AI scrapers).
 */
const ROBOTS_TXT = `User-agent: *\nDisallow: /\n\nUser-agent: Googlebot\nDisallow: /\n\nUser-agent: Bingbot\nDisallow: /\n\nUser-agent: Slurp\nDisallow: /\n\nUser-agent: DuckDuckBot\nDisallow: /\n\nUser-agent: Baiduspider\nDisallow: /\n\nUser-agent: Yandex\nDisallow: /\n\nUser-agent: Sogou\nDisallow: /\n\nUser-agent: Exabot\nDisallow: /\n\nUser-agent: facebot\nDisallow: /\n\nUser-agent: facebookexternalhit\nDisallow: /\n\nUser-agent: ia_archiver\nDisallow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: ChatGPT-User\nDisallow: /\n\nUser-agent: CCBot\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n\nUser-agent: anthropic-ai\nDisallow: /\n\nUser-agent: Bytespider\nDisallow: /\n\nUser-agent: Amazonbot\nDisallow: /\n\nUser-agent: Applebot\nDisallow: /\n\nUser-agent: SemrushBot\nDisallow: /\n\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n\nUser-agent: DotBot\nDisallow: /\n\nUser-agent: PetalBot\nDisallow: /\n\nUser-agent: SEOkicks-Robot\nDisallow: /\n\nUser-agent: magpie-crawler\nDisallow: /\n\nUser-agent: SentiBot\nDisallow: /\n\nUser-agent: Scrapy\nDisallow: /\n\nUser-agent: python-requests\nDisallow: /\n\nUser-agent: wget\nDisallow: /\n\nUser-agent: curl\nDisallow: /\n`;

// Listen for all fetch events and handle them with handleEvent
addEventListener("fetch", (event) => {
  event.respondWith(handleEvent(event));
});

/**
 * Main request handler for the Worker.
 *
 * - Serves /robots.txt with a restrictive policy.
 * - Serves static assets from KV.
 * - Injects <meta name="robots"> into HTML if missing.
 * - Falls back to index.html for SPA routes.
 *
 * @param {FetchEvent} event - The fetch event from Cloudflare.
 * @returns {Promise<Response>} The HTTP response.
 */
async function handleEvent(event) {
  const url = new URL(event.request.url);

  // Serve a restrictive robots.txt for all bots
  if (url.pathname === "/robots.txt") {
    return new Response(ROBOTS_TXT, {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  try {
    // Try to serve the requested asset from KV
    let response = await getAssetFromKV(event);

    // Only process HTML responses for meta tag injection
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      let text = await response.text();
      // If no <meta name="robots"> tag is present, inject one to prevent indexing
      if (!/< *meta\s+name\s*=\s*['"]robots['"][^>]*>/i.test(text)) {
        const headMatch = text.match(/<head(\s[^>]*)?>/i);
        if (headMatch) {
          // Inject meta tag inside <head>
          text = text.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n    <meta name="robots" content="noindex, nofollow">`);
        } else {
          // If <head> is missing, inject a <head> with the meta tag after <html> or at the top
          text = text.replace(/<html(\s[^>]*)?>/i, (match) => `${match}\n  <head>\n    <meta name="robots" content="noindex, nofollow">\n  </head>`) || `<head>\n  <meta name="robots" content="noindex, nofollow">\n</head>\n${text}`;
        }
      }
      // Return the modified HTML response
      response = new Response(text, response);
      response.headers.set("content-type", "text/html; charset=utf-8");
    }
    return response;
  } catch (e) {
    // If asset not found, fallback to index.html for SPA routes (GET only)
    if (event.request.method === "GET") {
      try {
        return await getAssetFromKV(event, { mapRequestToAsset: (req) => new Request(`${new URL(req.url).origin}/index.html`, req) });
      } catch (e2) {
        // If index.html is also not found, return 404
        return new Response("Not found", { status: 404 });
      }
    }
    // For non-GET requests or other errors, return 404
    return new Response("Not found", { status: 404 });
  }
}
