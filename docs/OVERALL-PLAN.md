# OVERALL IMPLEMENTATION PLAN – Updated March 2025

> **Guardrail Reminder** – Remain in **planning mode** until the USER explicitly authorises implementation mode. Before any future code changes outside `docs/`, the pre‑implementation checklist from `docs/GUARDRAILS.md` must be satisfied in order: `git status`, `pnpm build`, `pnpm test`, branch verification. Builds/tests may be substituted with the project’s turbo equivalents where appropriate.

---

## 📊 Phase Overview
| Phase | Scope | Status |
|-------|-------|--------|
| Phase 1 | Workspace & tooling foundation | 🟢 Complete |
| Phase 2 | Internal modules + cucumber runner | 🟡 In progress |
| Phase 3 | CLI & developer tooling | 🔴 Not started |
| Phase 4 | Framework validation apps | 🟡 Underway (React sample live) |
| Phase 5 | Packaging, CI/CD & reporting | 🔴 Not started |

---

## ✅ Phase 1 – Foundation (Completed)
1. Monorepo scaffold (pnpm workspaces, turbo, lint/TS configs)
2. Strict quality gates (80+ ESLint rules, strict TS, lint/typecheck wired into turbo)
3. Universal path utilities (`@nuevco/free-paths`) validated via CJS/ESM apps
4. Root scripts & tooling hardened (`pnpm build`, `pnpm test`, quality shortcuts)

All tasks remain green; no follow-up required except keeping configs in sync.

---

## 🔧 Phase 2 – Internal Modules & Runner (In Progress)
| Step | Description | Status | Notes / Follow-up |
|------|-------------|--------|-------------------|
| 2.1 | Core config + types (`defineConfig`, `BehaviorDrivenUIConfig`) | 🟢 | Shipping in `src/core` |
| 2.2 | World abstraction & base driver/errors | 🟢 | `World`, `BaseDriver`, error classes done |
| 2.3 | Cucumber runner (`runBduiFeatures`), support loader & mock driver | 🟢 | Works with React sample, handles Node 20.9 with new import fallback |
| 2.4 | Core step library (hooks/data/viewport/navigation) | 🟢 | Implemented in `src/cucumber/steps/core-steps.ts`; additional packs still TBD |
| 2.5 | Adapter packages (Jest/WebDriver) | 🟡 | Packages scaffolded; need API surface + tests |
| 2.6 | Shared feature corpus under `/features` | ⚪ | Placeholder `.gitkeep`; React sample currently hosts feature files locally |
| 2.7 | Real Playwright driver implementation | ⚪ | Mock driver ok for demo; production driver still required |

**Next actions for Phase 2**
1. Finalise adapter APIs and wire them into the runner (packages `behavior-driven-ui-jest`, `behavior-driven-ui-webdriver`).
2. Move sample features out of `apps/react-sample/features` into shared `/features/ui` and consume them via runner config.
3. Replace mock driver with real Playwright bindings or provide toggles between mock and real drivers.

---

## 🛠️ Phase 3 – CLI & Tooling (Not Started)
Planned deliverables:
1. `bdui` CLI (Commander-based) with commands to run features per workspace (`bdui run --app react-app`, etc.).
2. Project scaffolding/generator (optional) for teams adopting behavior-driven UI testing.
3. Config discovery enhancements (dotfiles, environment overrides, driver presets).

Dependencies: Phase 2 adapter APIs should be stable before wiring them into the CLI.

---

## 🧪 Phase 4 – Framework Validation Apps (Ongoing)
| App | Status | Notes |
|-----|--------|-------|
| `react-sample` | 🟢 Live | Runs three demo scenarios; proves `runBduiFeatures` loop |
| `next-app` | 🔴 Not started | Needs Next.js scaffold, parity with React features |
| `qwik-app` | 🔴 Not started | Needs Qwik scaffold, hydration/resume scenarios |
| `cjs-app` / `esm-app` | 🟢 Stable | Continue using for `@nuevco/free-paths` validation |

**Near-term tasks**
- Copy the React sample’s features into `/features/ui`, then point each framework app to the shared corpus.
- Scaffold Next/Qwik apps with minimal pages covering forms, navigation, responsive behaviour.
- Add Playwright (or WebDriver) harness per app so the runner can launch UI servers on demand.

---

## 📦 Phase 5 – Packaging, CI & Reporting (Not Started)
Planned steps:
1. Tarball packaging (`pnpm pack:tarballs`) gated by lint/ts/test success
2. GitHub Actions workflow running the full turbo pipeline + integration suites
3. Quality/reporting dashboards: cucumber JSON, coverage metrics, bundle size checks
4. Optional: adopt Changesets to manage versioning/publishing when ready

Pre-req: Adapter packages and additional apps should be stable to avoid thrashing the pipeline.

---

## 🗓️ Next 2–3 Sprint Priorities
1. **Adapter hardening** – implement Jest/WebDriver bridges, add integration tests.
2. **Shared feature migration** – centralise feature files and update React sample to consume them via config overrides.
3. **Driver realisation** – swap mock driver for Playwright in a feature flaggable way.
4. **Next.js scaffold** – start `apps/next-app` mirroring the React sample scenarios.
5. **Documentation** – keep `docs/` in sync (overview, current state, guardrails) after each milestone.

---

## 📌 Outstanding Risks & Mitigations
- **Seatbelt (sandbox) limitations**: `pnpm --filter react-sample test` fails inside the sandbox due to `tsx` IPC restrictions. Mitigation: use `node run-react-sample.js` locally, document this caveat.
- **@cucumber/cucumber internal API usage**: `loadSupportBuilder` depends on internal module shape; maintain regression tests and pin versions until adapters mature.
- **Adapter packages** are empty shells today; prioritize filling them to avoid drift between docs and reality.

Keep this plan updated as tasks progress. When a step is delivered, mark it 🟢 here and mirror the change in `docs/CURRENT-STATE.md` so the entire team stays aligned.
