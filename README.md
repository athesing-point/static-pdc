# static-pdc

This project deploys a static site to Cloudflare Workers using Wrangler. The `pdc-zip` directory contains the static assets, exported from Webflow.

## Prerequisites

- [Node.js](https://nodejs.org/) v16.17.0 or later
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Cloudflare account](https://dash.cloudflare.com/)

## Setup

1. **Install dependencies:**

   ```sh
   npm install
   ```

2. **Authenticate with Cloudflare:**
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

This will serve your Worker at [http://localhost:8787](http://localhost:8787).

## Deploying to Cloudflare

To deploy your Worker and static assets:

```sh
npx wrangler deploy
```

- The deployment will use the configuration in `wrangler.toml`.
- By default, assets in `pdc-zip` are served as the site bucket.
- For custom domains, ensure your domain is configured in the Cloudflare dashboard and update the `route` in `wrangler.toml` if needed.

## Project Structure

- `worker.js` – Cloudflare Worker script for serving static assets and handling requests.
- `wrangler.toml` – Wrangler configuration file.
- `pdc-zip/` – **Contains the static site export from Webflow.**

## References

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Workers Sites (Static Assets)](https://developers.cloudflare.com/workers/platform/sites/)
