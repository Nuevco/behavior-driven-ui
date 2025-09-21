# Behavior Driven UI (BDUI)

Behavior Driven UI gives teams a jump-start on UI automation by shipping a
curated library of Gherkin step definitions, a world implementation, and a
purpose-built CLI runner. Instead of inventing step vocabularies or wiring up
cucumber from scratch, you get a standard language for common UI interactions –
clicking, navigating, scrolling, asserting state – and a CLI that assembles the
core steps with any project-specific additions.

## Why BDUI?

- **Opinionated step library** – Hundreds of teams repeat the same groundwork
  (click, fill, wait, check state) before they can even write a scenario. BDUI
  provides those primitives out of the box so you can start at the feature level
  immediately.
- **Shared vocabulary** – Scenarios remain readable and consistent across
  projects because everyone uses the same phrases for the same actions.
- **Extensible but safe** – You can add custom steps when needed, but the core
  library is always included, so common behaviors never regress.
- **Single CLI entry point** – `bdui run` registers the core steps, your custom
  steps, and cucumber. No boilerplate `cucumber.ts` file, no manual loader setup.
- **Fast onboarding** – `bdui init` scaffolds the minimal config and directory
  layout so new projects can start writing features in minutes.

## Core Concepts

### Step Library

BDUI’s world and step definitions cover the 80% UI automation cases:

- Navigation and page load helpers
- Viewport management
- Input interactions (click, fill, select, scroll)
- Assertion helpers around stored state
- Hooks for scenario setup/teardown

These steps live inside the published package and are always registered before
cucumber runs. Your additional steps augment the library; they don’t replace it.

### CLI Orchestration

The CLI ensures every run uses the same orchestration flow:

1. Discover `bdui.config.ts` (or `.js`) in the project root.
2. Register TypeScript/ESM loaders (`tsx`).
3. Load the config, resolve feature and step globs.
4. Register BDUI’s core steps plus your custom ones.
5. Execute cucumber through the `runBduiFeatures` runner.

This keeps projects consistent and removes the need for custom cucumber entry
points.

## Getting Started

```bash
pnpm install behavior-driven-ui
pnpm exec bdui init   # optional but recommended scaffolding
pnpm exec bdui run    # execute your features
```

`bdui init` creates:

- `bdui.config.ts` with sensible defaults (`features/**/*.feature`,
  `bdui/steps/**/*.{ts,js}`)
- `features/.gitkeep` and `bdui/steps/.gitkeep` to establish directory structure

`bdui run` picks up that config, merges the core steps with any custom steps you
place under `bdui/steps/`, and runs cucumber.

## Configuration Overview

```ts
// bdui.config.ts
export default {
  baseURL: 'http://localhost:3000',
  features: ['features/**/*.feature'],
  steps: ['bdui/steps/**/*.{ts,js}'],
  driver: {
    browser: 'chromium',
    headless: true,
  },
  cucumber: {
    tagExpression: '',
    order: 'defined',
  },
  environment: {
    NODE_ENV: 'test',
  },
};
```

Add custom steps inside `bdui/steps/` – they’ll be loaded alongside the built-in
library. Feature files stay under `features/`.

## Example Project

`apps/react-sample` shows BDUI in action:

```bash
pnpm --filter react-sample run test
```

That command builds the CLI and runs cucumber using the shared step library plus
any custom steps the sample adds. It demonstrates how fast teams can start
writing meaningful scenarios when they don’t have to bootstrap cucumber first.

## Troubleshooting Tips

- **Scenarios can’t find steps** – Confirm your custom step files match the
  `steps` glob in `bdui.config.ts` and use a supported extension (`.ts`, `.tsx`,
  `.js`, `.jsx`).
- **TypeScript config load issues** – Run `pnpm run bdui:build` to compile the
  CLI; it includes loader registration and avoids `ERR_UNKNOWN_FILE_EXTENSION`.
- **Need additional primitives** – Drop new step definitions in
  `bdui/steps/`. They automatically load without touching the underlying runner.

## What’s Next

- Expand the step catalog with higher-level UI patterns.
- Add more sample apps demonstrating best practices.
- Integrate guardrail tests so `bdui run` is exercised across supported stacks.

BDUI removes the tedious setup work so teams can focus on writing the scenarios
that matter. Start a feature file, use the shared vocabulary, and ship reliable
UI automation from day one.
