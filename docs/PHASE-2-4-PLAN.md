# Phase 2.4 – Playwright Parity for Existing Core Steps

## Objective
Bring the Playwright driver to feature-parity with the behaviours already covered
by the BDUI core step library (forms, selects, visibility waits, simple value
assertions) so the shared feature corpus can run against a real browser without
falling back to the mock driver.

## Tasks & Order
1. **Inventory & Gap Analysis**
   - Review `packages/behavior-driven-ui/src/cucumber/steps/core-steps.ts` to list
     all behaviours currently relying on the mock driver (form entries, select,
     visibility/assert steps).
   - Compare against `PlaywrightDriver` to identify missing or incomplete
     implementations.
2. **Driver Enhancements**
   - Extend `PlaywrightDriver` methods (`fill`, `type`, `select`, `getValue`,
     `expect`) to match the semantics expected by the core steps.
   - Improve error messaging for unsupported `expect` conditions.
   - Ensure navigation history remains accurate post-action.
3. **Form & Select Fixtures**
   - Build a minimal HTML fixture (data URL or local asset) with representative
     controls (text input, textarea, select/multi-select, toggleable element).
   - Use this in integration tests.
4. **Driver Integration Tests**
   - Update `test/driver/playwright-driver.test.ts` (or add new spec) to cover:
     - Filling fields and reading values.
     - Selecting options (single and multiple).
     - Waiting on visible/hidden state via `expect`.
     - Verifying navigation history after form submissions or reloads.
5. **Shared Feature Scenarios**
   - Add new scenarios under `features/ui/` (e.g., `forms.feature`,
     `visibility.feature`) that exercise the newly supported behaviours.
   - Keep scenarios framework-agnostic and reference the shared fixture.
6. **Sample App Wiring**
   - Add any necessary UI elements in `apps/react-sample` so the new shared
     features execute against real components.
   - Ensure existing steps require no changes beyond driver parity.
7. **Documentation Sync**
   - Update `docs/OVERALL-PLAN.md`, `docs/OVERVIEW.md`, and `docs/CURRENT-STATE.md`
     when Step 2.4 completes.
   - Refresh `docs/README.md` troubleshooting / capability notes if new behaviours
     need explanation.
8. **Validation**
   - Run guardrail commands:
     - `pnpm --filter behavior-driven-ui lint`
     - `pnpm --filter behavior-driven-ui test`
     - `pnpm --filter react-sample run test`
     - `pnpm run build:force`
     - `pnpm run test:force`
     - `pnpm run bdui:build`
     - `pnpm run format:check`

## Risks / Watch Items
- Ensure Playwright `expect` conditions throw helpful errors for unsupported
  phrases to avoid silent failures.
- Keep mock driver behaviour aligned; update it if parity requires tweaks so unit
  tests remain useful.
- Watch for Seatbelt/timeouts in long-running Playwright actions; keep fixtures
  simple to avoid CI instability.

This temporary plan file captures the execution order and validation steps for
Phase 2.4 and can be removed once the work ships.
