# Phase 2.4 – Inventory & Gap Analysis

## Core Step Behaviours in `core-steps.ts`

- World lifecycle helpers (fresh world, base URL overrides, manual setup trigger).
- Scenario data storage and assertions (`store`, `data should be`, `data absent`).
- Viewport management (`set viewport`, `viewport size should be`).
- Navigation history assertion (`driver should have navigated to`).

## Implications

- Current step library does **not yet** expose explicit form/select/value steps, but upcoming shared feature work (Phase 2.4 tasks 3–5) requires them.
- Driver interfaces already expose `fill`, `type`, `select`, `getValue`, and `expect`; mock driver stubs them.

## Playwright Driver Status

- `type` uses `page.type` (appends text). Need to confirm expected semantics (likely append vs replace) before tests.
- `fill` delegates to `page.fill` (replaces value).
- `select` calls `page.selectOption` (supports single or multiple values but we must cover array acceptance + error handling).
- `getValue` relies on `page.inputValue` – works for `<input>/<textarea>` but **not** `<select>` multi, so parity gap.
- `expect` currently supports only visibility states; lacks value/text assertions required for form validations.
- Navigation history updates on `goto`, `reload`, `back`, `forward`, but not on user initiated navigations (e.g., form submit). Need tests to confirm captured entries after `page.goto` replacement triggered by form actions.

## Identified Gaps To Address

1. Add step definitions for forms/select/value assertions alongside shared features so existing driver hooks are exercised.
2. Enhance Playwright driver:
   - Broaden `expect` coverage (value/text matching, hidden/visible).
   - Improve `getValue` to handle selects (single + multi) and fall back gracefully when selector missing.
   - Ensure `select` returns helpful errors if options missing.
   - Maintain navigation history after actions causing navigation (form submit).
3. Provide deterministic fixtures and tests covering these behaviours to guard parity.

## Outcome Summary

- Added form/text/value/visibility steps to the core library so shared features can drive real DOM interactions.
- Expanded the Playwright driver (`expect`, `select`, `getValue`) and added navigation tracking to capture event-driven navigations.
- Created a deterministic HTML fixture and Vitest coverage for fill/type/select/visibility/history flows.
- Added shared `forms.feature` / `visibility.feature` scenarios plus React sample UI wiring; sample tests now boot a Vite server automatically before running `bdui run`.
