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
- ✅ `apps/react-sample` runs three scenarios via `pnpm --filter react-sample run test`
- ✅ Playwright driver powers CLI runs by default; mock driver remains available
  for fast unit tests
- ⚠️ Shared feature corpus (`features/`) is a placeholder; frameworks still host
  their own copies
- ✅ Jest/WebDriver adapters removed; only active packages remain, future adapters will be reintroduced deliberately
- ✅ Playwright Chromium installs automatically during `behavior-driven-ui`
  postinstall; CI caches browser binaries so CLI runs never miss a browser

## Immediate Priorities
1. **Harden the Playwright driver** now that it powers the CLI by default
   - Broaden command coverage (forms, expectations, screenshots)
   - Expose configuration toggles (headless/browser selection) via `bdui.config`
   - Document how to opt into the mock driver for unit tests
2. **Remove unused adapter scaffolds**
   - Delete `behavior-driven-ui-jest` / `behavior-driven-ui-webdriver` so the repo
     only contains active packages (done)
3. **Establish a shared feature corpus**
   - Move common scenarios into `/features/ui`
   - Update `react-sample` (and future apps) to reference the shared features via
     `bdui.config`

## Roadmap — One Step at a Time
| Order | Task | Owner/Status | Notes |
|-------|------|--------------|-------|
| 1 | Set up CI & dry-run packaging | ✅ Complete | GitHub Actions runs `pnpm run build:force`, `pnpm run test:force`, doc lint, CLI/matrix tests on feature branches; produces tarballs without publishing |
| 2 | Implement Playwright-based driver and wire CLI defaults | ✅ Complete | CLI runs now launch Playwright by default; mock driver remains available for lightweight unit tests |
| 3 | Remove Jest/WebDriver adapter scaffolds | ✅ Complete | Packages removed; revisit adapters when needed |
| 4 | Consolidate shared features under `/features/ui` and update configs | 🔜 Planned | Enables multiple framework apps to share coverage |
| 5 | Build out cross-framework samples (React w/ MUI, Angular, Vue, Next.js, Qwik) | ⏳ Backlog | Each app consumes shared features and runs via Playwright |
| 6 | Round-two frameworks (Svelte, SvelteKit, Vue SSR/Nuxt) | ⏳ Backlog | Extend shared scenarios once initial matrix is stable |

Status icons: ✅ Done · 🔜 Planned/In Progress · ⏳ Backlog

Keep this overview updated whenever a roadmap item completes or new priorities
emerge.
