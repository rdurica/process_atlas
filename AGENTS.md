# Agent Context for Process Atlas

## Stack

- **Backend**: Laravel 13, PHP 8.5+, Inertia.js
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Canvas**: @xyflow/react
- **Database**: PostgreSQL (prod), SQLite in-memory (tests)
- **Cache/Sessions/Queue**: Redis
- **Infrastructure**: Docker (php-fpm + nginx + node)

## Dev Environment

All development runs inside Docker containers via `docker compose`.

| Command               | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `make init`           | First-time setup: certs, network, images, containers |
| `make up`             | Start containers detached                            |
| `make down`           | Stop containers                                      |
| `make logs`           | Stream logs                                          |
| `make php`            | Shell into PHP container                             |
| `make node`           | Shell into Node container                            |
| `make setup-githooks` | Enable pre-commit hook (Prettier on staged files)    |

**All `php artisan` and `npm` commands must run inside their containers:**

```shell
docker compose exec php-fpm php artisan <cmd>
docker compose exec node npm <cmd>
```

## Key Commands

```shell
# Setup (inside php container)
composer setup   # install deps, generate key, migrate

# Backend
php artisan test              # run all tests (Pest)
php artisan test --filter=X   # run single test
composer pint                 # format code
composer pint --test          # check formatting
composer phpstan              # static analysis

# Frontend (inside node container)
npm run dev          # Vite dev server
npm run build        # production build (tsc + vite + vite --ssr)
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run format:check # Prettier
```

## Architecture Notes

- **App entrypoint**: `src/` (Laravel skeleton)
- **Frontend**: `src/resources/js/` — Inertia pages, React components, types
- **Backend**: `src/app/` — Models, Controllers, Services
- **MCP server**: `POST /api/mcp` (auth: sanctum + mcp.use middleware)
- **MCP stdio**: `php artisan mcp:serve-stdio --user=<id>`
- **Workflow model** is the core domain entity; `app/Models/` has Workflow, WorkflowVersion, Screen, etc.
- **No API routes** for the React frontend — Inertia handles server-side rendering

## Testing

- Uses **Pest PHP** (not PHPUnit directly)
- Test DB is **SQLite in-memory** — no real DB connection needed for local tests
- Tests are **disabled in CI** (`if: false`) for all test jobs; only linting/code quality runs
- Feature tests live in `tests/Feature/`, unit tests in `tests/Unit/`

## Code Quality

- **Pint** (Laravel preset) for PHP code style — `src/pint.json` has custom rules
- **PHPStan** level is configured in `src/phpstan.neon`
- Frontend: ESLint + Prettier + TypeScript strict checking

## CI Pipeline

- `code-quality.yml` runs on push to `main`/`develop` and on PRs
  - Frontend: typecheck → lint → prettier check
  - Backend: pint --test → phpstan
- `ci.yaml` is currently **disabled** (all test jobs have `if: false`); only Docker linting runs

## Security & Production

- **API rate limiting**: 60 req/min for authenticated API, 30 req/min for MCP endpoint. Configured in `AppServiceProvider::boot()` and applied via `throttle:api` / `throttle:mcp` middleware.
- **Production `.env`**: Use `src/.env.production.example` as the base for production deploy. Contains secure settings (`APP_DEBUG=false`, `SESSION_ENCRYPT=true`, `SESSION_SECURE_COOKIE=true`).
- **HTTP security headers**: Nginx configuration in `build/dev/nginx/default.conf` adds CSP, Referrer-Policy, Permissions-Policy, HSTS, X-Frame-Options, and X-Content-Type-Options.
- **CORS**: Explicitly configured in `config/cors.php` with `supports_credentials=true`.
- **File upload**: Screen images are validated via `mimes:jpg,jpeg,png,webp` and checked with `getimagesize()` after upload.
- **API error handling**: Set in `bootstrap/app.php` so API endpoints never return stack traces (generic JSON response when `APP_DEBUG=false`).

## Important Gotchas

- `make init` moves `build/dev/.github` to `.github` — do not edit the former directly
- The Docker network `apps` must exist before `make up` (created by `make init`)
- `composer setup` must be run inside the php container, not on the host
- Node modules are in a Docker volume; use `make node-sync` to copy them to host if needed
