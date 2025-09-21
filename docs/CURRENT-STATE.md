# CURRENT PROJECT STATE – March 2025 Update

Repository: `behavior-driven-ui`
Goal: Enterprise-grade BDD UI testing framework with cross-framework validation and a ready-to-run CLI.

## 🎯 Executive Summary
- Foundation (Phase 1) remains complete: monorepo, turbo pipeline, strict lint/TS gates, universal path utilities.
- Phase 2 has progressed well beyond Step 9: the cucumber runner, mock driver, core step library, and world/config abstractions are live and exercised by the new `react-sample` app.
- Adapter scaffolds have been removed; only active packages remain in the workspace.
- Shared top-level `/features` directory is still a placeholder—React sample currently hosts the only feature files.
- Immediate focus shifts to delivering a real Playwright driver, expanding shared features, and bringing additional framework apps online.

## 📦 Workspace Snapshot
| Package / App | Status | Notes |
|---------------|--------|-------|
| `packages/behavior-driven-ui` | 🟢 Core + cucumber modules + CLI | `runBduiFeatures` runner, core step library, `bdui run`/`bdui init` commands |
| `packages/free-paths` | 🟢 Stable | Universal path helpers consumed across workspaces |
| `apps/cjs-app`, `apps/esm-app` | 🟢 Passing | Validate `@nuevco/free-paths` in CJS/ESM |
| `apps/react-sample` | 🟢 Passing (outside Seatbelt) | Runs three sample features via `runBduiFeatures`; generates reports |

## 🧱 Architecture & Modules
- **Core module** (`src/core`)
  - `defineConfig`, `BehaviorDrivenUIConfig`, `World`, `BaseDriver`, error types
- **Cucumber + CLI modules** (`src/cucumber`, `src/cli`)
  - `runBduiFeatures` runner, support builder resolution, mock driver, core step library (world lifecycle, data steps, viewport, navigation)
  - CLI bundles (`bdui run`, `bdui init`) register the shared steps, handle config discovery, and expose TypeScript loader registration
- **Integration adapters**
  - Future adapters (Jest/WebDriver) will be reintroduced if/when needed
- **Sample React app**
  - Consumes built package via workspace dependency
  - Houses sample features: viewport resizing, world data reset, initial navigation
  - Executes scenarios through the CLI (`pnpm --filter react-sample run test`)

## ✅ Quality & Tooling
- Lint (`pnpm lint`) and TS checks (`pnpm type:check`) still build-blocking via turbo pipeline
- Dual-module builds succeed: `pnpm build` (turbo) runs all package/app builds in ~11s cached
- Compiled CLI registers loaders automatically; `pnpm --filter react-sample run test` now succeeds via `bdui run`
- Playwright Chromium installs automatically during `behavior-driven-ui`’s postinstall; CI caches `~/.cache/ms-playwright` so browser downloads don’t reoccur every run

## 📉 Gaps vs Documentation
- Prior docs assumed only `core/` existed inside `behavior-driven-ui`; now `cucumber/` is equally important and must be documented (done in OVERVIEW refresh).
- Plan/status trackers lagged: Phase 2 steps beyond Step 9 were marked undone despite real code. Tables have been corrected in `OVERALL-PLAN.md`.
- React sample app, Jest/WebDriver packages, and the new fallback import logic were missing from previous narratives—now captured in this update.

## 🔜 Near-Term Focus (Next 2–3 sprints)
1. Ship **Playwright driver integration** so `bdui run` exercises a real browser, not the mock driver
2. Establish a **shared feature corpus** under `/features/ui` and refactor React sample (and future apps) to consume it
3. Scaffold additional apps (React + MUI, Next.js, Angular, Vue) mirroring shared scenarios once the real driver lands
4. Extend step libraries (forms, network stubbing, accessibility assertions)
5. Establish tarball packaging + CI flows after real driver + shared features stabilize

## 📌 Risks & Watch Items
- Cucumber runner currently relies on `@cucumber/cucumber` internals via dynamic import; keep tests around `loadSupportBuilder` as versions change
- Seatbelt constraints may still block long-running CLI invocations; document usage expectations for contributors and provide fallbacks when necessary
- Additional framework apps will drive the need for real Playwright driver integration rather than the mock driver presently in use

Stay aligned with `docs/GUARDRAILS.md`: planning mode by default, request implementation authorization before altering source outside the docs suite.
