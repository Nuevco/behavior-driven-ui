# CURRENT PROJECT STATE – March 2025 Update

Repository: `behavior-driven-ui`
Goal: Enterprise-grade BDD UI testing framework with cross-framework validation

## 🎯 Executive Summary
- Foundation (Phase 1) remains complete: monorepo, turbo pipeline, strict lint/TS gates, universal path utilities.
- Phase 2 has progressed well beyond Step 9: the cucumber runner, mock driver, core step library, and world/config abstractions are live and exercised by the new `react-sample` app.
- Additional packages (`behavior-driven-ui-jest`, `behavior-driven-ui-webdriver`) are scaffolded; APIs still need fleshing out.
- Shared top-level `/features` directory is still a placeholder—React sample currently hosts the only feature files.
- Immediate focus shifts to stabilising adapters, expanding shared features, and bringing additional framework apps online.

## 📦 Workspace Snapshot
| Package / App | Status | Notes |
|---------------|--------|-------|
| `packages/behavior-driven-ui` | 🟢 Core + cucumber modules shipping dual ESM/CJS builds | `runBduiFeatures` orchestrates cucumber-js with mock driver + step library |
| `packages/behavior-driven-ui-jest` | 🟡 Scaffolded | Needs API finalized & tests wired to core runner |
| `packages/behavior-driven-ui-webdriver` | 🟡 Scaffolded | Placeholder WebDriver driver exported; integration TBD |
| `packages/free-paths` | 🟢 Stable | Universal path helpers consumed across workspaces |
| `apps/cjs-app`, `apps/esm-app` | 🟢 Passing | Validate `@nuevco/free-paths` in CJS/ESM |
| `apps/react-sample` | 🟢 Passing (outside Seatbelt) | Runs three sample features via `runBduiFeatures`; generates reports |

## 🧱 Architecture & Modules
- **Core module** (`src/core`)
  - `defineConfig`, `BehaviorDrivenUIConfig`, `World`, `BaseDriver`, error types
- **Cucumber module** (`src/cucumber`)
  - `runBduiFeatures` runner, support builder resolution, mock driver, core step library (world lifecycle, data steps, viewport, navigation)
  - Builds now emit direct exports (no chunk indirection) to support Node 20.9 environments
- **Integration adapters**
  - Jest + WebDriver packages exist but require implementation of test runners/adapters
- **Sample React app**
  - Consumes built package via workspace dependency
  - Houses sample features: viewport resizing, world data reset, initial navigation
  - Uses namespace import fallback so Node 20.9+ reliably resolves `runBduiFeatures`

## ✅ Quality & Tooling
- Lint (`pnpm lint`) and TS checks (`pnpm type:check`) still build-blocking via turbo pipeline
- Dual-module builds succeed: `pnpm build` (turbo) runs all package/app builds in ~11s cached<br>Seatbelt prevents `pnpm --filter react-sample test` from finishing inside the sandbox; command works locally
- Added helper `run-react-sample.js` script to execute features without relying on `tsx`

## 📉 Gaps vs Documentation
- Prior docs assumed only `core/` existed inside `behavior-driven-ui`; now `cucumber/` is equally important and must be documented (done in OVERVIEW refresh).
- Plan/status trackers lagged: Phase 2 steps beyond Step 9 were marked undone despite real code. Tables have been corrected in `OVERALL-PLAN.md`.
- React sample app, Jest/WebDriver packages, and the new fallback import logic were missing from previous narratives—now captured in this update.

## 🔜 Near-Term Focus (Next 2–3 sprints)
1. Flesh out **adapter packages**:
   - Implement Jest runner glue (`behavior-driven-ui-jest`)
   - Implement real WebDriver bindings (`behavior-driven-ui-webdriver`)
2. **Shared feature corpus** under `/features/ui` and refactor React sample to consume it (instead of local copies)
3. Scaffold additional apps (`next-app`, `qwik-app`) mirroring React sample scenarios
4. Extend step libraries (forms, network stubbing, accessibility assertions)
5. Establish tarball packaging + CI flows once adapters stabilise

## 📌 Risks & Watch Items
- Cucumber runner currently relies on `@cucumber/cucumber` internals via dynamic import; keep tests around `loadSupportBuilder` as versions change
- Seatbelt constraints mean local developer testing must use raw `node` or external shells; we should document this in contributor docs
- Additional framework apps will drive the need for real Playwright driver integration rather than the mock driver presently in use

Stay aligned with `docs/GUARDRAILS.md`: planning mode by default, request implementation authorization before altering source outside the docs suite.
