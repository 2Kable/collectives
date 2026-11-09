# Collectives

Event management web application for the Club Alpin Français d'Annecy:
Flask, SQLAlchemy, Alembic (`flask db`), Jinja templates, pytest. Production
runs on MariaDB, development and tests also on SQLite.

## Layout
 * `collectives/models/`: SQLAlchemy models
 * `collectives/routes/`: Flask blueprints (HTML pages)
 * `collectives/api/`: JSON API used by the pages
 * `collectives/forms/`: WTForms forms
 * `collectives/templates/`: Jinja templates
 * `collectives/utils/`: helpers (access control, mail, extranet, payment, vite...)
 * `frontend/`: React + TypeScript + PrimeReact islands built with Vite
 * `collectives/configuration.yaml`: configuration items editable from the UI
 * `migrations/versions/`: Alembic migrations
 * `tests/`: pytest tests, fixtures in `tests/fixtures/`
 * `doc/`: Sphinx documentation

## Commands
 * Install Python: `uv sync --dev`
 * Format Python: `uvx ruff format`
 * Lint Python: `uvx ruff check`
 * Tests Python: `uv run pytest tests/<file>` (run the files related to the change)
 * Install Frontend: `npm --prefix frontend install`
 * Dev Server (Backend): `./run.py` (pass `--vite` to launch Vite concurrently)
 * Dev Server (Frontend standalone): `npm --prefix frontend run dev`
 * Lint & Format Frontend: `npm --prefix frontend run lint` / `npm --prefix frontend run format`
 * Test & Build Frontend: `npm --prefix frontend run test` / `npm --prefix frontend run build`
 * All CI jobs locally: `./run_ci_jobs_locally.sh`

## Rules
Follow [CODING.md](CODING.md) when writing code, commit messages and pull
requests. For any code review, follow its *Code review* section exactly,
including the output format.

### Targeted testing
To prevent slow iteration and unnecessary test overhead:
 * **Frontend tasks** (files under `frontend/` or UI styling): only run frontend linting, tests, or build:
   `npm --prefix frontend run lint` / `npm --prefix frontend run test`
   Do NOT run `pytest` or backend checks for frontend-only changes.
 * **Backend tasks** (files under `collectives/`, `tests/`, etc.): only run the specific pytest file(s) related to the change:
   `uv run pytest tests/<file>`
   Do NOT run frontend tests or the full backend test suite for backend-only changes.
 * Only run full CI or both suites (`./run_ci_jobs_locally.sh`) when touching cross-cutting integrations or explicitly requested.

@CODING.md

## Note for contributors using Claude Code
Claude Code reads this file only when the repository has no `CLAUDE.md` or
`CLAUDE.local.md`. Keep personal instructions in `~/.claude/CLAUDE.md`.
