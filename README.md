# Zone01 Profile Dashboard

Full-stack playground for exploring Zone01 student data through GraphQL. The project is split into:
- **`proxy/`** - a Go 1.22 reverse proxy that authenticates against the Zone01 platform and forwards GraphQL requests with CORS and logging baked in.
- **`zone01-profile/`** - a Vite + React (TypeScript) dashboard that signs users in, calls the proxy, and renders progress analytics.

## Highlights
- Username/email + password sign-in that exchanges credentials for an upstream JWT and caches it client-side.
- GraphQL data layer with hooks for profile metadata, XP history, pass/fail aggregates, and recent submissions.
- SVG-based charts visualizing XP earned over time, XP by project, and pass/fail donut.
- Theme system with persistent light/dark preference and a sticky navigation bar.

```
.
|-- proxy
|   |-- main.go            # HTTP entrypoint
|   |-- handlers.go        # /auth, /refresh, /graphql, /healthz
|   |-- helpers.go         # CORS, logging, env helpers
|   |-- router.go          # gorilla/mux wiring
|   |-- models.go          # request/response DTOs
|   |-- variables.env      # sample environment configuration
|   `-- *_test.go          # handler and router coverage
`-- zone01-profile
    |-- src/auth           # auth context + provider
    |-- src/graphql        # document strings for ME/transactions/progress queries
    |-- src/hooks          # data-fetching and aggregation hooks
    |-- src/components     # NavBar + SVG visualizations
    |-- src/pages          # Login screen and dashboard layout
    `-- .env               # Vite-side proxy base URL
```

## Prerequisites
- Go **1.22+**
- Node.js **18+** (tested with npm)  
  Install dependencies with `npm install` inside `zone01-profile/`.

## Configuration
### Proxy (`proxy/`)
Create a `.env` (or export environment variables) before running the Go service. A starter file lives at `proxy/variables.env`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | Port the proxy listens on. |
| `ZONE01_BASE` | `https://platform.zone01.gr` | Upstream Zone01 base URL. |
| `SIGNIN_PATH` | `/api/auth/signin` | Auth endpoint hit during `/auth/signin`. |
| `GRAPHQL_PATH` | `/api/graphql-engine/v1/graphql` | GraphQL endpoint proxied via `/graphql`. |

### Frontend (`zone01-profile/`)
- `VITE_PROXY_BASE` (see `zone01-profile/.env`) points the React app at the proxy. When running both layers locally, leave it at `http://localhost:8080`.
- Tokens are stored in `sessionStorage` (`z01_token`). Theme preference lives in `localStorage` (`z01_theme`).

## Local Development
1. **Start the proxy**
   ```powershell
   cd proxy
   go run .
   ```
   The server exposes:
   - `POST /auth/signin` - exchanges credentials for a JWT
   - `POST /auth/refresh` - lightweight session ping
   - `POST /graphql` - forwards GraphQL payloads to the upstream API
   - `GET  /healthz` - health check for deployment targets

2. **Start the React app (in another terminal)**
   ```powershell
   cd zone01-profile
   npm install        # first run only
   npm run dev
   ```
   Open the URL printed by Vite (typically `http://localhost:5173`). Sign in with valid Zone01 credentials; the dashboard will fetch your profile, XP transactions, progress records, and render all charts.

## Testing & Quality
- Backend: `go test ./...` (covers handlers, router wiring, and helper behavior).
- Frontend: `npm run lint` to run the TypeScript-aware ESLint config.

## Production Builds
- **Proxy:** `go build -o bin/proxy ./...` (or containerize; a single binary with no external dependencies).
- **Frontend:** `npm run build` generates static assets under `zone01-profile/dist/`. Serve behind any static host and point it at the deployed proxy with `VITE_PROXY_BASE`.

## Troubleshooting
- **CORS errors:** Ensure the Vite dev server origin is allowed. The proxy mirrors the request origin by default; double-check you are hitting `http://localhost:8080`.
- **GraphQL failures:** The proxy surfaces upstream GraphQL errors (first message) back to the client; open the browser console for details.
- **Stale tokens:** Use the `Logout` button in the nav bar to clear `sessionStorage`, or manually remove `z01_token`.

## Next Steps
- Deploy the Go proxy behind HTTPS (e.g., Fly.io, Render) and configure `VITE_PROXY_BASE` accordingly.
- Extend the dashboard by adding more GraphQL documents under `src/graphql/` and wiring new hooks in `src/hooks/useGraph.ts`.
