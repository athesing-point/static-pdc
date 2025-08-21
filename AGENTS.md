# Agent Guidelines for static-pdc

## Build & Development Commands
- `npm install` - Install dependencies
- `npm start` or `npx wrangler dev` - Local development server (http://localhost:8787)
- `npm run deploy` or `npx wrangler deploy` - Deploy to Cloudflare Workers
- No test suite configured - manual testing via local dev server

## Code Style & Conventions
- **Language**: JavaScript (ES6+) for worker.js, no TypeScript
- **Imports**: Use ES6 module imports (e.g., `import { getAssetFromKV } from "@cloudflare/kv-asset-handler"`)
- **Functions**: Prefer arrow functions for callbacks, named functions for main handlers
- **Comments**: Use JSDoc style for function documentation
- **Error Handling**: Catch errors and redirect to homepage as fallback
- **Constants**: UPPER_CASE for global constants (e.g., `ENABLE_BACKUP_MODE`)
- **No linting/formatting tools configured** - maintain existing code style

## Project Structure
- `worker.js` - Main Cloudflare Worker script (handles routing, redirects, headers)
- `pdc-zip/` - Static assets from Webflow export (HTML, CSS, JS, images)
- `wrangler.toml` - Cloudflare Worker configuration
- **Critical**: ENABLE_BACKUP_MODE flag in worker.js controls site behavior (true = serve us.point.com, false = redirect to point.com)