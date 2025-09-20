# behavior-driven-ui — Monorepo Overview

## 🚀 Current Status (Updated March 2025)

The **behavior-driven-ui** monorepo now ships a working “vertical slice” of the behavior‑driven runner along with strict quality gates and a living React sample that executes real features. Foundation work (Phase 1) is complete, the internal core + cucumber modules are in place, and we have the first consumer app validating the runner end‑to‑end.

**Highlights**
- Dual-module build (`tsup`) produces ESM + CJS bundles for every package
- Strict linting/TypeScript rules remain build-blocking across the workspace
- `runBduiFeatures` orchestrates cucumber-js with an internal step library and mock driver
- `apps/react-sample` runs three sample features and generates Playwright-ready artifacts
- Supporting integration packages (`behavior-driven-ui-jest`, `behavior-driven-ui-webdriver`) are scaffolded for upcoming adapters

---

## 🗂️ Monorepo Layout (pnpm + turbo)
```
behavior-driven-ui/
├─ package.json                    # pnpm workspace root, turbo scripts
├─ pnpm-workspace.yaml             # packages/* + apps/* workspaces
├─ turbo.json                      # build/test pipelines with quality gates
├─ eslint.config.js                # ultra-strict lint config (80+ rules)
├─ tsconfig.json                   # strict TypeScript baseline (project references ready)
├─ features/                       # shared canonical Gherkin corpus (placeholders today)
│  ├─ common/.gitkeep
│  └─ ui/.gitkeep
├─ packages/
│  ├─ behavior-driven-ui/          # main framework package
│  │  ├─ src/
│  │  │  ├─ index.ts               # exports core + cucumber modules
│  │  │  ├─ core/                  # config/world/base driver abstractions
│  │  │  └─ cucumber/              # runner, mock driver, core step library
│  │  ├─ tsup.config.ts            # dual ESM/CJS build, bundler tweaks for Node 20.9
│  │  └─ package.json
│  ├─ behavior-driven-ui-jest/     # Jest integration adapter (scaffold)
│  ├─ behavior-driven-ui-webdriver # Selenium/WebDriver shim (scaffold)
│  └─ free-paths/                  # Universal path utilities used by all packages
├─ apps/
│  ├─ cjs-app/                     # CommonJS validation of @nuevco/free-paths
│  ├─ esm-app/                     # ESM validation of @nuevco/free-paths
│  └─ react-sample/                # Live demo exercising runBduiFeatures + features/
└─ docs/                           # Living documentation (this file, guardrails, plan)
```

---

## ✅ Implementation Status Snapshot
| Area | Status | Notes |
|------|--------|-------|
| Workspace & tooling | 🟢 Complete | pnpm v9, turbo 2.x, strict lint/TS, Prettier |
| Core module (`packages/behavior-driven-ui/src/core`) | 🟢 Complete | `defineConfig`, `World`, base driver + errors |
| Cucumber runner (`src/cucumber`) | 🟢 Complete | `runBduiFeatures`, mock driver, core step library |
| Integration packages | 🟡 In progress | Jest + WebDriver packages scaffolded (APIs TBD) |
| Sample apps | 🟢 CJS/ESM validation, 🟢 React sample | React app runs real features; Next/Qwik pending |
| Shared features | ⚪ Placeholder | Top-level `/features` directories reserved for future parity tests |

---

## 🔭 Target Architecture (Where We’re Heading)
The original charter remains: **“Enterprise-grade behavior-driven UI testing across multiple frameworks.”** Our roadmap keeps the existing vision but acknowledges the progress already landed.

1. **Core Framework** (Done / hardening): configuration, world, drivers, runner
2. **Integration Adapters**
   - Playwright/CLI keep evolving in `behavior-driven-ui`
   - Jest/WebDriver adapters live in dedicated packages
3. **Framework Sample Apps**
   - ✅ `react-sample`
   - 🔜 `next-app` & `qwik-app` (scaffolding plus feature parity)
4. **Feature Parity Harness**
   - Shared `/features/ui/**/*.feature` set executed in every app via the runner
   - Scenario-level reporting comparing results across frameworks
5. **Distribution Workflow**
   - Tarball packaging + CI pipelines enforcing lint/ts/test gates
   - Eventually Changesets-driven publishing for npm releases

---

## 🛣️ Path to the Requested Future State
The overview previously listed future tasks without acknowledging newer progress. Below is the realistic continuation plan based on today’s code:

### Phase 2 – Internal Module Enhancements (In Flight)
1. **Driver Interface Hardening** (Playwright first, WebDriver scaffolded)
2. **Preset Step Packs** (forms, navigation, viewport, assertions)
3. **Shared hooks & lifecycle utilities**

### Phase 3 – CLI & Tooling
1. Build out `bdui` CLI (Commander.js) for running features per app
2. Provide project generator utilities (scaffold new apps + configs)
3. Improve configuration discovery (per-app overrides, environment profiles)

### Phase 4 – Framework Validation Apps
1. **next-app** – uses Next.js with the runner; ensures SSR/CSR flows work
2. **qwik-app** – validate resumability & client hydration scenarios
3. Expand sample features to cover responsive layout, forms, routing, async flows

### Phase 5 – Quality & Distribution
1. Tarball packaging + smoke tests before publishing
2. GitHub Actions pipeline enforcing lint/ts/test/build matrix
3. Quality dashboards (coverage, cucumber scenario reports, bundle sizes)

---

## 📌 Key Decisions (Locked In)
- **Workspace protocol** for consuming the latest builds during development (`workspace:*`)
- **Dual ESM/CJS output** for compatibility with all consumers
- **Strict guardrails** (lint + typecheck before builds, zero-tolerance failures)
- **Composable packages** so Jest/WebDriver adapters evolve independently

---

## 🧭 Next Actions
1. Update `docs/CURRENT-STATE.md` & `docs/OVERALL-PLAN.md` (done as part of this refresh) to stay aligned.
2. Formalize API surfaces for the Jest/WebDriver adapters and link them into the runner.
3. Scaffold Next.js & Qwik sample apps that mirror `react-sample`’s feature set.
4. Introduce shared feature content under `/features/ui` (the React sample currently houses its own copies).
5. Plan CI/tarball workflows once integrations stabilize.

This document will continue to evolve as new packages/apps come online. Keep it updated whenever a significant architectural milestone lands so the whole team—and future contributors—see an accurate snapshot of the system.
