# BDUI Roadmap — Working Plan (March 2025)

> **Mode Reminder**: stay in **PLANNING MODE** until implementation is explicitly
> authorised. Before any non-doc change, run the guardrails from
> `docs/GUARDRAILS.md` (git status → build → tests → branch check).

## Completed Foundations

- Monorepo tooling (`pnpm` + `turbo`) with strict lint/typecheck/test gates
- Core framework modules (`defineConfig`, `World`, base driver, errors)
- Cucumber runner + core step library (world lifecycle, navigation, viewport)
- `bdui` CLI (`run`, `init`) compiled and documented
- React sample app executing scenarios through the CLI
- Shared feature corpus (`features/ui`) exercises world lifecycle, viewport,
  forms, selects, and visibility behaviours across sample apps
- Playwright driver installed automatically during package postinstall

## Phase 2 – Real Browser Foundation (Playwright Default)

| Step | Status      | Deliverable                                                                          | Validation                                                                                            |
| ---- | ----------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 2.1  | ✅ Complete | Default Playwright driver with mock fallback, browser install hook                   | `pnpm run build:force`, `pnpm run test:force`, `pnpm --filter react-sample run test`                  |
| 2.2  | ✅ Complete | Lock `driver.kind` to `playwright`/`mock`; update docs and config schema accordingly | `pnpm run bdui:build`, `pnpm run test:force`                                                          |
| 2.3  | ✅ Complete | Shared feature corpus under `features/ui`; react-sample consumes it                  | `pnpm --filter react-sample run test`, `pnpm run test:force`                                          |
| 2.4  | ✅ Complete | Playwright driver parity for core steps (forms/selects/visibility waits)             | `pnpm --filter behavior-driven-ui test`, `pnpm --filter react-sample run test`, `pnpm run test:force` |
| 2.5  | 🔜 Planned  | CLI driver overrides (`--driver.browser`, `--driver.headless`) & docs                | CLI integration test + guardrail commands                                                             |
| 2.6  | 🔜 Planned  | Scenario lifecycle screenshots (opt-in) with artifact verification                   | New failing-scenario test + `pnpm run test:force`                                                     |
| 2.7  | 🔜 Planned  | Headed debug workflow (`--headed` flag/env) documented                               | Manual headed run log + guardrails                                                                    |
| 2.8  | 🔜 Planned  | Documentation/guardrail sync for Phase 2 outcomes                                    | `pnpm run format:check`                                                                               |

## Phase 3 – Step Library Expansion (New Behaviours)

| Step | Focus                    | Notes                                                    |
| ---- | ------------------------ | -------------------------------------------------------- |
| 3.1  | Navigation & waits       | URL assertions, network-idle waits, integration coverage |
| 3.2  | Forms & inputs           | Multi-field forms, file upload, validation messages      |
| 3.3  | Widgets & controls       | Dropdowns, modals, tabs, sample scenarios per control    |
| 3.4  | Keyboard & accessibility | Keyboard navigation steps, basic ARIA checks             |
| 3.5  | Network stubbing         | Playwright route interception, mock response steps       |
| 3.6  | Visual regression hooks  | Baseline/diff harness, opt-in guardrails                 |

Each step: add step definitions, Playwright driver support (if needed), shared feature scenarios, unit/integration tests, guardrail commands.

## Phase 4 – Framework Samples

| Step | Target             | Acceptance Criteria                                                             |
| ---- | ------------------ | ------------------------------------------------------------------------------- |
| 4.1  | React + MUI sample | `pnpm --filter react-mui-sample run test` executes shared corpus via Playwright |
| 4.2  | Angular sample     | Angular CLI app, shared corpus green under Playwright                           |
| 4.3  | Vue sample         | Vue 3 + Vite app, shared corpus green                                           |
| 4.4  | Next.js sample     | Handles SSR/CSR routes, shared corpus green                                     |
| 4.5  | Qwik sample        | Validates resumability scenarios, shared corpus green                           |

Each sample step: scaffold app, hook into shared features, document setup, add guardrail command entry.

## Phase 5 – Cross-Browser & Additional Drivers

| Step | Focus                     | Notes                                                           |
| ---- | ------------------------- | --------------------------------------------------------------- |
| 5.1  | Playwright browser matrix | CI matrix Chromium/Firefox/WebKit once parity achieved          |
| 5.2  | Mock driver enhancements  | Keep mock behaviour aligned with new steps for fast unit tests  |
| 5.3  | WebDriver prototype       | Minimal Selenium-backed driver behind opt-in flag               |
| 5.4  | Cypress adapter spike     | Explore CLI integration, capture findings/work items            |
| 5.5  | Driver extension docs     | Publish guide; reintroduce config options only when code exists |

## Phase 6 – Packaging & Release Prep

| Step | Focus                  | Notes                                                                     |
| ---- | ---------------------- | ------------------------------------------------------------------------- |
| 6.1  | Tarball validation     | `pnpm run packages:pack:dry` includes browsers/steps/config assets        |
| 6.2  | Versioning & changelog | Introduce Changesets (or equivalent) for multi-package releases           |
| 6.3  | Publish dry run        | `npm publish --dry-run` for `@nuevco/free-paths` and `behavior-driven-ui` |
| 6.4  | Release playbook       | Document release process, secrets, browser cache expectations             |

## Phase 7 – Extended Coverage & Tooling Backlog

- Round-two frameworks: Svelte, SvelteKit, Nuxt
- Accessibility tooling (axe integration)
- Storybook or design-system smoke tests
- CI reporting (JUnit/HTML artifacts)
- Developer experience (VSCode snippets, typed step helpers)

Keep this document aligned with `docs/OVERVIEW.md` and `docs/CURRENT-STATE.md`. Update
statuses as soon as a step starts or completes, and record validation commands alongside
each deliverable.
