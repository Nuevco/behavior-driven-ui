# BDUI Roadmap — Working Plan (March 2025)

> **Mode Reminder**: Stay in **PLANNING MODE** unless the user explicitly
> authorises implementation work. Before any non-doc changes, run the
> guardrails from `docs/GUARDRAILS.md` (git status → build → tests → branch check).

## Completed Foundations
- Monorepo tooling (pnpm + turbo) with strict lint/typecheck gates
- Core framework modules (`defineConfig`, `World`, base driver, errors)
- Cucumber runner + core step library (`runBduiFeatures`, mock driver, core steps)
- `bdui` CLI (`run`, `init`) compiled and documented
- React sample app executing scenarios through the CLI

## Active Workstream — Deliver an MVP with Real Browser Coverage
| Order | Focus | Status | Acceptance Criteria |
|-------|-------|--------|---------------------|
| 1 | **CI & packaging scaffold** | ✅ Complete | GitHub Actions workflow runs `pnpm run build:force`, `pnpm run test:force`, doc lint, `pnpm run bdui:build`, and matrix tests on feature branches; publishes dry-run tarballs without pushing |
| 2 | **Playwright driver implementation** | 🔜 In progress | `bdui run` drives a real Playwright browser by default; mock driver optional for unit tests. Browser binaries install automatically during package postinstall. |
| 3 | **Remove unused adapter scaffolds** | ✅ Complete | Deleted `behavior-driven-ui-jest` / `behavior-driven-ui-webdriver` from the repo |
| 4 | **Shared feature corpus** | 🔜 In progress | Common scenarios live in `/features/ui`; `react-sample` consumes them via config |

## Near-Term Backlog (Execute after the MVP trio)
| Item | Description | Status |
|------|-------------|--------|
| Next.js sample (`apps/next-app`) | Scaffold app, reuse shared features, validate SSR/CSR via Playwright | ⏳ Backlog |
| Qwik sample (`apps/qwik-app`) | Mirror feature set for resumability checks | ⏳ Backlog |
| CLI enhancements | Environment profiles, driver presets, project generators | ⏳ Backlog |
| Packaging & CI | Tarball builds, GitHub Actions pipeline, cucumber report artefacts | ⏳ Backlog |

## How We Execute
1. Confirm implementation authorisation with the user.
2. Run guardrail commands (git status → build → tests → branch).
3. Update this plan when a task starts, completes, or is re-prioritised.
4. Document deliverables in `docs/CURRENT-STATE.md` and `docs/README.md` as they ship.

Status icons: 🔜 In progress / planned · ⏳ Backlog · ✅ Complete

This plan replaces earlier ad-hoc documents (`docs/BDUI-CLI-PLAN.md`). Keep it
small, current, and actionable so we can iterate one step at a time.
