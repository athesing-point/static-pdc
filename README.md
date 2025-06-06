# static-pdc

This project deploys a static site to Cloudflare Workers using Wrangler. The `pdc-zip` directory contains the static assets, originally exported from Webflow.

## Prerequisites

- [Node.js](https://nodejs.org/) v16.17.0 or later
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Cloudflare account](https://dash.cloudflare.com/)

## Setup

1.  **Install dependencies:**

    ```sh
    npm install
    ```

2.  **Authenticate with Cloudflare:**
    If you haven't already, log in to your Cloudflare account:
    ```sh
    npx wrangler login
    ```
    This will open a browser window for authentication.

## Local Development

To preview your Worker locally:

```sh
npx wrangler dev
```

This will serve your Worker at `http://localhost:8787`.

## Deploying to Cloudflare

To deploy your Worker and static assets:

```sh
npx wrangler deploy
```

- The deployment uses the configuration in `wrangler.toml`.
- Assets in `pdc-zip/` are served as the site's content.
- For custom domains, ensure your domain is configured in the Cloudflare dashboard. This project is configured for `us.point.com`.

## Project Structure

- `worker.js` – Cloudflare Worker script that handles request routing, redirects, and injects headers.
- `wrangler.toml` – Wrangler configuration file.
- `pdc-zip/` – Contains the static site assets.
- `package.json` – Project dependencies.

## Features

The `worker.js` script provides several key features:

### Backup Mode Toggle

A global constant `ENABLE_BACKUP_MODE` in `worker.js` controls the site's behavior:

- **`ENABLE_BACKUP_MODE = true` (Live Backup Mode):**

  - The backup site `us.point.com` is **live and active**.
  - Serves content directly from `us.point.com`.
  - Allows all crawlers and search engine indexing (`robots.txt` is permissive).
  - This is the standard production mode when `us.point.com` should be operating as the primary site.

- **`ENABLE_BACKUP_MODE = false` (Disabled/Redirect Mode):**
  - The backup site `us.point.com` is **inactive**.
  - Redirects all traffic from `us.point.com` to `https://point.com`.
  - Blocks all crawlers and bots via a restrictive `robots.txt`.
  - Injects a `<meta name="robots" content="noindex, nofollow">` tag into all HTML pages to prevent indexing.
  - This is the standard mode when `point.com` is operating normally.

### Custom Redirects

The worker handles several types of redirects:

- **Clean URLs:** Redirects `page.html` to `/page` and `/about/index.html` to `/about/`.
- **Content Migration:** Redirects legacy paths (e.g., `/blog/*`, `/home-equity/*`) to the homepage or other relevant sections to avoid 404 errors for old content.
- **404 Fallback:** Any request for a non-existent resource is redirected to the homepage (`/`).

### URL Rewriting

The worker automatically rewrites extensionless URLs to their corresponding HTML files (e.g., a request to `/about` serves `/about.html`). This allows for cleaner URLs without requiring file extensions.

### Observability

Observability is enabled in `wrangler.toml`, allowing for detailed logging and monitoring of the Worker's performance in the Cloudflare dashboard.

## References

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Workers Sites (Static Assets)](https://developers.cloudflare.com/workers/platform/sites/)
