# Behavior Driven UI — Overview

## Purpose

Behavior Driven UI (BDUI) delivers an opinionated step library and CLI so teams
can start writing executable Gherkin scenarios without first wiring cucumber or
inventing UI vocabularies. The framework ships:

- Core config, world, and driver abstractions under `packages/behavior-driven-ui/src/core`
- A cucumber runner plus built-in step packs under `src/cucumber`
- The `bdui` CLI (`run`, `init`) that registers BDUI’s steps, loads project
  configuration, and executes features end-to-end
- A React sample app that already exercises the CLI and core step library

Strict lint/typecheck guardrails remain in place across the monorepo.

## Current Snapshot (March 2025)

- ✅ Dual ESM/CJS builds with `tsup`; CLI outputs live in `dist/`
- ✅ `bdui run` / `bdui init` compiled and documented (`docs/README.md`)
- ✅ `apps/react-sample` runs shared viewport/forms/visibility scenarios via `pnpm --filter react-sample run test`
- ✅ Playwright driver powers CLI runs by default; mock driver remains available
  for fast unit tests
- ✅ Shared feature corpus (`features/ui/`) covers world lifecycle, viewport
  sizing, forms/selects, and visibility waits; sample apps reference it directly
- ✅ Jest/WebDriver adapters removed; only active packages remain, future adapters will be reintroduced deliberately
- ✅ Playwright Chromium installs automatically during `behavior-driven-ui`
  postinstall; CI caches browser binaries so CLI runs never miss a browser

## Immediate Priorities

1. **Phase 2.5 – CLI driver overrides** so headless/headed/browser toggles are configurable from the CLI
2. **Phase 2.6 – Scenario lifecycle screenshots** to capture artifacts on failure
3. **Phase 2.7 – Headed debugging workflow** enabling repeatable non-headless runs

## Roadmap — One Step at a Time

| Order | Task                                                                          | Owner/Status | Notes                                                                                                                                                   |
| ----- | ----------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Set up CI & dry-run packaging                                                 | ✅ Complete  | GitHub Actions runs `pnpm run build:force`, `pnpm run test:force`, doc lint, CLI/matrix tests on feature branches; produces tarballs without publishing |
| 2     | Phase 2.2 – Lock driver surface                                               | ✅ Complete  | Restricted config/CLI to `playwright` or `mock`, docs updated                                                                                           |
| 3     | Phase 2.3 – Shared feature corpus                                             | ✅ Complete  | Moved scenarios to `/features/ui`; react-sample consumes shared files                                                                                   |
| 4     | Phase 2.4 – Playwright parity for core steps                                  | ✅ Complete  | Driver + steps support forms/selects/visibility; shared corpus + PWT tests pass                                                                         |
| 5     | Phase 2.5 – CLI driver overrides                                              | 🔜 Planned   | Allow CLI/browser overrides with tests and docs                                                                                                         |
| 6     | Phase 2.6 – Scenario lifecycle screenshots                                    | 🔜 Planned   | Capture opt-in screenshots on failure and persist artifacts                                                                                             |
| 7     | Remove Jest/WebDriver adapter scaffolds                                       | ✅ Complete  | Packages removed; revisit adapters when needed                                                                                                          |
| 8     | Build out cross-framework samples (React w/ MUI, Angular, Vue, Next.js, Qwik) | ⏳ Backlog   | Each app consumes shared features and runs via Playwright                                                                                               |
| 9     | Round-two frameworks (Svelte, SvelteKit, Vue SSR/Nuxt)                        | ⏳ Backlog   | Extend shared scenarios once initial matrix is stable                                                                                                   |

Status icons: ✅ Done · 🔜 Planned/In Progress · ⏳ Backlog

Keep this overview updated whenever a roadmap item completes or new priorities
emerge.
