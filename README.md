[![Actions Status](https://github.com/Club-Alpin-Annecy/collectives/workflows/Linter/badge.svg)](https://github.com/Club-Alpin-Annecy/collectives/actions)
[![Actions Status](https://github.com/Club-Alpin-Annecy/collectives/workflows/Tests/badge.svg)](https://github.com/Club-Alpin-Annecy/collectives/actions)
[![Actions Status](https://github.com/Club-Alpin-Annecy/collectives/workflows/Documentation/badge.svg)](https://github.com/Club-Alpin-Annecy/collectives/actions)


# Collectives

This repository contains the Flask-based Collectives web app, an event management system for outdoor clubs.

## Demonstration
A live demonstration exists at https://test.collectives.cafannecy.fr

## Documentation
Detailed documentation is available in the ``doc`` folder and can be browsed at https://doc.collectives.cafannecy.fr

# Quick start

## Local installation

### Prerequisites
- **Python 3.10+** (see [`.python-version`](.python-version)) with [**uv**](https://docs.astral.sh/uv/)
- **Node.js 20+** (see [`.node-version`](.node-version), recommended Node 22 LTS) and **npm** (for the frontend React islands built with Vite)

> **Tip (Unified runtime manager):**
> You can use [**mise**](https://mise.jdx.dev/) to automatically install and manage both the Python and Node.js versions defined in [`.python-version`](.python-version) and [`.node-version`](.node-version):
> ```sh
> # Once mise is installed (https://mise.jdx.dev/):
> mise install
> ```
> Alternatively, you can install Node.js via [nodejs.org](https://nodejs.org/) or your system package manager (`brew install node`, `winget install OpenJS.NodeJS.LTS`, or `apt install nodejs npm`).

### Setup

1. Install uv: follow https://docs.astral.sh/uv/getting-started/installation/
 ```sh
 # macOS and Linux
 > curl -LsSf https://astral.sh/uv/install.sh | sh
 # Windows
 PS> powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
 ```

2. Clone this git repository (or unzip release archive)

3. From the root of the repo, install Python dependencies:
 ```sh
 uv sync
 ```

4. Install frontend dependencies and build frontend assets:
 ```sh
 npm --prefix frontend install
 npm --prefix frontend run build
 ```

5. Start the local server:

   **Option A: Flask + Vite combined (recommended for development)**
   Launches Flask and Vite concurrently in a single terminal with colored logs and live Hot Module Replacement (HMR):
   ```sh
   uv run run.py --vite
   # or directly:
   ./run.py --vite
   ```

   **Option B: Separate terminals**
   ```sh
   # Terminal 1: Start Flask backend
   uv run run.py

   # Terminal 2: Start Vite frontend dev server (with HMR)
   npm --prefix frontend run dev
   ```

   **Option C: Standalone backend**
   Serves the pre-compiled static assets built in step 4 (no Vite server needed):
   ```sh
   uv run run.py
   ```

6. Navigate to http://localhost:5000/ to test the app.

## Frontend & Vite

Collectives uses server-rendered Jinja templates enhanced with interactive **React + TypeScript + PrimeReact islands** located in [`frontend/`](frontend/).

- **Vite dev server**: When started with `uv run run.py --vite` (or separately with `npm --prefix frontend run dev`), Vite runs on `http://localhost:5173`. Flask automatically detects the running Vite dev server and hot-reloads frontend code with HMR.
- **Production build**: `npm --prefix frontend run build` type-checks TypeScript (`tsc -b`) and builds production bundles into `collectives/static/dist/vite/` alongside a manifest (`manifest.json`). When the Vite dev server is not active, Flask loads assets directly from this manifest.
- **Frontend commands**:
  - `npm --prefix frontend run dev`: Start standalone Vite dev server
  - `npm --prefix frontend run build`: Type-check and build production bundles
  - `npm --prefix frontend run lint`: Lint TypeScript and JSX with Biome
  - `npm --prefix frontend run format`: Format frontend code with Biome
  - `npm --prefix frontend run test`: Run unit and component tests with Vitest

## Configuration
Instance specific configuration can be included in `instance/config.py`

## Access
Default account is admin
Default password is foobar2 (can be changed in config.py)

## Test data
A data set for tests can be loaded into the db via `etc/test_set.py` 

## Legacy installation via pip (deprecated)

1. Unzip the package from the source.
2. Install Python (this app has been tested with Python 3.8) and pip3
3. Install required dependencies with pip
    `pip install -r requirements.txt`
4. Run the development server (it will be available at http://localhost:5000)
    `./run.py`
    (do not run this in production)

# Contributing

## Workflow

1. Fork this repository and clone your fork to your local machine

2. Install dependencies:
   - Backend: `uv sync`
   - Frontend: `npm --prefix frontend install`

3. (Optional) Install `ruff` and `Biome` VS Code extensions to format and lint your code automatically

4. Make the desired changes, following guidelines in [CODING.md](CODING.md)

5. Format and lint your code:
   - Python formatting: `uvx ruff format`
   - Python linter: `uvx ruff check --fix`
   - Frontend formatting: `npm --prefix frontend run format`
   - Frontend linter: `npm --prefix frontend run lint`

6. Run tests:
   - Python tests: `uv run pytest tests/<file>` (run relevant backend tests)
   - Frontend tests: `npm --prefix frontend run test` (run Vitest)
   - Frontend build check: `npm --prefix frontend run build`
   - Run all CI jobs locally: `./run_ci_jobs_locally.sh` (or `./run_ci_jobs_locally.sh --frontend` for frontend only)

7. Push your local branch to your fork and create a pull request against the main repository

## Adding, updating dependencies

### Backend dependencies (Python)

Dependencies are configured in `pyproject.toml`, but it is recommended to use the `uv` high-level interface when possible. See https://docs.astral.sh/uv/, `uv add --help` and `uv lock --help` for more information.

 - Adding a dependency: `uv add your-python-package`
 - Updating the dependency lock file: `uv lock`. This may be necessary if changing the `pyproject.toml` file directly.
 - Upgrading all dependencies to latest possible version: `uv lock --upgrade`. This should be run regularly to stay up to date with upstream packages.
 - A pip `requirements.txt` file may be created using `uv pip freeze`

### Frontend dependencies (npm)

Frontend dependencies are managed in [`frontend/package.json`](frontend/package.json):

 - Adding a dependency: `npm --prefix frontend install <package>`
 - Adding a dev dependency: `npm --prefix frontend install -D <package>`
 - Updating dependencies: `npm --prefix frontend update`

## Building the documentation

1. Navigate to `doc` repository
2. Run `uv run make html`
3. Open the result in a web browser, e.g: `open build/html/index.html`
