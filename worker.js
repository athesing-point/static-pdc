import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

const ROBOTS_TXT = `User-agent: *\nDisallow: /\n\nUser-agent: Googlebot\nDisallow: /\n\nUser-agent: Bingbot\nDisallow: /\n\nUser-agent: Slurp\nDisallow: /\n\nUser-agent: DuckDuckBot\nDisallow: /\n\nUser-agent: Baiduspider\nDisallow: /\n\nUser-agent: Yandex\nDisallow: /\n\nUser-agent: Sogou\nDisallow: /\n\nUser-agent: Exabot\nDisallow: /\n\nUser-agent: facebot\nDisallow: /\n\nUser-agent: facebookexternalhit\nDisallow: /\n\nUser-agent: ia_archiver\nDisallow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: ChatGPT-User\nDisallow: /\n\nUser-agent: CCBot\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n\nUser-agent: anthropic-ai\nDisallow: /\n\nUser-agent: Bytespider\nDisallow: /\n\nUser-agent: Amazonbot\nDisallow: /\n\nUser-agent: Applebot\nDisallow: /\n\nUser-agent: SemrushBot\nDisallow: /\n\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n\nUser-agent: DotBot\nDisallow: /\n\nUser-agent: PetalBot\nDisallow: /\n\nUser-agent: SEOkicks-Robot\nDisallow: /\n\nUser-agent: magpie-crawler\nDisallow: /\n\nUser-agent: SentiBot\nDisallow: /\n\nUser-agent: Scrapy\nDisallow: /\n\nUser-agent: python-requests\nDisallow: /\n\nUser-agent: wget\nDisallow: /\n\nUser-agent: curl\nDisallow: /\n`;

addEventListener("fetch", (event) => {
  event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
  const url = new URL(event.request.url);
  if (url.pathname === "/robots.txt") {
    return new Response(ROBOTS_TXT, {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  try {
    let response = await getAssetFromKV(event);
    // Only inject for HTML responses
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      let text = await response.text();
      // Inject <meta name="robots" ...> if not present
      if (!text.includes('<meta name="robots"')) {
        text = text.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n    <meta name="robots" content="noindex, nofollow">`);
      }
      response = new Response(text, response);
      response.headers.set("content-type", "text/html; charset=utf-8");
    }
    return response;
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
