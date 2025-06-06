/**
 * Cloudflare Worker for serving static assets from the pdc-zip directory (Webflow export).
 *
 * - Handles requests for static files using @cloudflare/kv-asset-handler.
 * - If ENABLE_BACKUP_MODE is true, allows all crawlers and page indexing, and serves us.point.com.
 * - If ENABLE_BACKUP_MODE is false, blocks all crawlers and page indexing, and redirects us.point.com to point.com.
 * - Falls back to index.html for SPA routes, or returns 404 if not found.
 */
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

const ENABLE_BACKUP_MODE = true; // Set to true to allow all crawlers and indexing, and serve us.point.com. Set to false to block indexing and redirect us.point.com to point.com.

const ROBOTS_TXT = ENABLE_BACKUP_MODE
  ? `User-agent: *\nAllow: /\n`
  : `User-agent: *\nDisallow: /\n\nUser-agent: Googlebot\nDisallow: /\n\nUser-agent: Bingbot\nDisallow: /\n\nUser-agent: Slurp\nDisallow: /\n\nUser-agent: DuckDuckBot\nDisallow: /\n\nUser-agent: Baiduspider\nDisallow: /\n\nUser-agent: Yandex\nDisallow: /\n\nUser-agent: Sogou\nDisallow: /\n\nUser-agent: Exabot\nDisallow: /\n\nUser-agent: facebot\nDisallow: /\n\nUser-agent: facebookexternalhit\nDisallow: /\n\nUser-agent: ia_archiver\nDisallow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: ChatGPT-User\nDisallow: /\n\nUser-agent: CCBot\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n\nUser-agent: anthropic-ai\nDisallow: /\n\nUser-agent: Bytespider\nDisallow: /\n\nUser-agent: Amazonbot\nDisallow: /\n\nUser-agent: Applebot\nDisallow: /\n\nUser-agent: SemrushBot\nDisallow: /\n\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n\nUser-agent: DotBot\nDisallow: /\n\nUser-agent: PetalBot\nDisallow: /\n\nUser-agent: SEOkicks-Robot\nDisallow: /\n\nUser-agent: magpie-crawler\nDisallow: /\n\nUser-agent: SentiBot\nDisallow: /\n\nUser-agent: Scrapy\nDisallow: /\n\nUser-agent: python-requests\nDisallow: /\n\nUser-agent: wget\nDisallow: /\n\nUser-agent: curl\nDisallow: /\n`;

// Listen for all fetch events and handle them with handleEvent
addEventListener("fetch", (event) => {
  event.respondWith(handleEvent(event));
});

/**
 * Maps a request to a static asset.
 * - Appends index.html to directory requests (e.g., /about/ -> /about/index.html).
 * - Appends .html to extensionless paths (e.g., /about -> /about.html).
 * @param {Request} request The original request.
 * @returns {Request} A new request with the rewritten path.
 */
const mapRequestToAsset = (request) => {
  const parsedUrl = new URL(request.url);
  let pathname = parsedUrl.pathname;

  if (pathname.endsWith("/")) {
    pathname += "index.html";
  } else {
    const lastSegment = pathname.substring(pathname.lastIndexOf("/") + 1);
    if (lastSegment && !lastSegment.includes(".")) {
      pathname += ".html";
    }
  }

  parsedUrl.pathname = pathname;
  return new Request(parsedUrl.toString(), request);
};

/**
 * Main request handler for the Worker.
 *
 * - Serves /robots.txt with a restrictive or permissive policy based on ENABLE_BACKUP_MODE.
 * - Serves static assets from KV.
 * - Injects <meta name="robots"> into HTML if missing and ENABLE_BACKUP_MODE is false.
 * - Falls back to index.html for SPA routes.
 *
 * @param {FetchEvent} event - The fetch event from Cloudflare.
 * @returns {Promise<Response>} The HTTP response.
 */
async function handleEvent(event) {
  const url = new URL(event.request.url);
  let pathname = url.pathname;

  // --- CUSTOM REDIRECTS FOR MISSING CMS CONTENT ---
  // Redirect all /blog, /blog/, /blog/*, /blog/category, /blog/category/, /blog/category/*, /home-equity, /home-equity/, /home-equity/*, /partner, /partner/, /partner/*, /media-room, /media-room/, /media-room/* to "/"
  if (
    /^\/blog(\/.*)?$/.test(pathname) ||
    pathname === "/blog" ||
    pathname === "/blog/" ||
    /^\/blog\/category(\/.*)?$/.test(pathname) ||
    pathname === "/blog/category" ||
    pathname === "/blog/category/" ||
    /^\/home-equity(\/.*)?$/.test(pathname) ||
    pathname === "/home-equity" ||
    pathname === "/home-equity/" ||
    /^\/partner(\/.*)?$/.test(pathname) ||
    pathname === "/partner" ||
    pathname === "/partner/" ||
    /^\/media-room(\/.*)?$/.test(pathname) ||
    pathname === "/media-room" ||
    pathname === "/media-room/"
  ) {
    return Response.redirect(`${url.origin}/`, 302);
  }
  // Redirect all /or, /or/, /or/*, /vs, /vs/, /vs/*, /start, /start/, /start/* to "/start"
  if (
    /^\/or(\/.*)?$/.test(pathname) ||
    pathname === "/or" ||
    pathname === "/or/" ||
    /^\/vs(\/.*)?$/.test(pathname) ||
    pathname === "/vs" ||
    pathname === "/vs/" ||
    /^\/start(\/.+)$/.test(pathname) // Only subpaths of /start, not /start itself
  ) {
    return Response.redirect(`${url.origin}/start`, 302);
  }

  // --- REDIRECTS FOR CLEAN URLS ---
  // Redirect /index or /index.html to /
  if (pathname === "/index" || pathname === "/index.html") {
    return Response.redirect(`${url.origin}/`, 301);
  }
  // Redirect any path ending with /index or /index.html to the parent directory
  if (pathname.match(/\/(index|index\.html)$/)) {
    const parent = pathname.replace(/\/(index|index\.html)$/, "/");
    return Response.redirect(`${url.origin}${parent}`, 301);
  }
  // Redirect any .html path to extensionless
  if (pathname.endsWith(".html")) {
    const clean = pathname.replace(/\.html$/, "");
    return Response.redirect(`${url.origin}${clean}${url.search}`, 301);
  }
  // --- END REDIRECTS ---

  // Redirect all traffic from us.point.com to point.com if backup mode is disabled
  if (!ENABLE_BACKUP_MODE && url.hostname === "us.point.com") {
    const dest = `https://point.com${url.pathname}${url.search}`;
    return Response.redirect(dest, 302);
  }

  // Serve robots.txt
  if (url.pathname === "/robots.txt") {
    return new Response(ROBOTS_TXT, {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  try {
    // Try to serve the requested asset from KV, with URL rewriting
    let response = await getAssetFromKV(event, { mapRequestToAsset });

    // Only process HTML responses for meta tag injection if backup mode is disabled
    const contentType = response.headers.get("content-type") || "";
    if (!ENABLE_BACKUP_MODE && contentType.includes("text/html")) {
      let text = await response.text();
      // If no <meta name="robots"> tag is present, inject one to prevent indexing
      if (!/< *meta\s+name\s*=\s*['\"]robots['\"][^>]*>/i.test(text)) {
        const headMatch = text.match(/<head(\s[^>]*)?>/i);
        if (headMatch) {
          // Inject meta tag inside <head>
          text = text.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n    <meta name=\"robots\" content=\"noindex, nofollow\">`);
        } else {
          // If <head> is missing, inject a <head> with the meta tag after <html> or at the top
          text = text.replace(/<html(\s[^>]*)?>/i, (match) => `${match}\n  <head>\n    <meta name=\"robots\" content=\"noindex, nofollow\">\n  </head>`) || `<head>\n  <meta name=\"robots\" content=\"noindex, nofollow\">\n</head>\n${text}`;
        }
      }
      // Return the modified HTML response
      response = new Response(text, response);
      response.headers.set("content-type", "text/html; charset=utf-8");
    }
    return response;
  } catch (e) {
    // For any route that does not exist, redirect to home page
    return Response.redirect(`${url.origin}/`, 302);
  }
}
