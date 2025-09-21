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
- ⚠️ Mock driver still powers the runner; Playwright integration is required for
  real UI validation
- ⚠️ Shared feature corpus (`features/`) is a placeholder; frameworks still host
  their own copies
- ✅ Jest/WebDriver adapters removed; only active packages remain, future adapters will be reintroduced deliberately

## Immediate Priorities
1. **Ship a real Playwright driver** to replace the mock driver
   - Implement `PlaywrightDriver` satisfying the `Driver` interface
   - Surface configuration toggles (headless/browser selection) via `bdui.config`
   - Update `react-sample` to execute through the real driver by default
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
| 1 | Implement Playwright-based driver and wire CLI defaults | 🔜 Planned | Blocks credible demo scenarios |
| 2 | Remove Jest/WebDriver adapter scaffolds | ✅ Complete | Packages removed; revisit adapters when needed |
| 3 | Consolidate shared features under `/features/ui` and update configs | 🔜 Planned | Enables multiple framework apps to share coverage |
| 4 | Build out cross-framework samples (React w/ MUI, Angular, Vue, Next.js, Qwik) | ⏳ Backlog | Each app consumes shared features and runs via Playwright |
| 5 | Round-two frameworks (Svelte, SvelteKit, Vue SSR/Nuxt) | ⏳ Backlog | Extend shared scenarios once initial matrix is stable |
| 6 | Introduce CI/tarball packaging after real driver + shared features land | ⏳ Backlog | Ensures publish/readiness |

Status icons: ✅ Done · 🔜 Planned/In Progress · ⏳ Backlog

Keep this overview updated whenever a roadmap item completes or new priorities
emerge.
