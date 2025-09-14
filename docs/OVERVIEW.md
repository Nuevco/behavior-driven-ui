# behavior-driven-ui — Monorepo Layout & Cross-Framework Test Plan

This repo hosts the reusable library **and** three framework apps (React, Next, Qwik) that consume the library as an installed dependency. Each app runs the **same** Gherkin features to verify parity.

---

## 1) Monorepo layout (pnpm workspaces + turbo)

```
behavior-driven-ui/
├─ package.json                # workspaces + scripts
├─ pnpm-lock.yaml
├─ turbo.json                  # cached builds/tests across packages
├─ .github/workflows/ci.yml    # CI matrix (build, pack, install, run features)
├─ features/                   # canonical Gherkin shared by all apps
│  ├─ common/                  # generic steps/fixtures used by all
│  └─ ui/                      # actual feature files (*.feature)
├─ packages/
│  ├─ core/                    # core lib (DSL, world, config)
│  ├─ driver-playwright/       # Playwright driver implementation
│  ├─ runner-cucumber/         # cucumber-js integration
│  ├─ cli/                     # `bdui` bin (wraps cucumber, utilities)
│  └─ preset-default/          # built-in steps pack (click/type/drag/mocks/viewport)
└─ apps/
   ├─ react-app/               # Vite React sample app under test
   │  ├─ playwright.config.ts
   │  ├─ bdui.config.ts        # app-level config (baseURL, webServer)
   │  ├─ tests/bdui/steps/     # app-specific step extensions
   │  ├─ tests/bdui/fixtures/  # mock fixtures
   │  └─ ...
   ├─ next-app/                # Next.js sample app under test
   │  ├─ playwright.config.ts
   │  ├─ bdui.config.ts
   │  └─ tests/bdui/...
   └─ qwik-app/                # Qwik City sample app under test
      ├─ playwright.config.ts
      ├─ bdui.config.ts
      └─ tests/bdui/...
```

### Workspace dependency strategy

* All apps consume the main library via **workspace protocol** so they always use the latest **built** package artifacts:

  * In each app `package.json`:

    ```json
    {
      "dependencies": {
        "behavior-driven-ui": "workspace:^"
      },
      "optionalDependencies": {
        "behavior-driven-ui-webdriver": "workspace:^",
        "behavior-driven-ui-jest": "workspace:^"
      }
    }
    ```
* Build order is enforced by `turbo` pipeline and package `dependencies`.

---

## 2) Top-level package.json (key parts)

```json
{
  "name": "behavior-driven-ui-monorepo",
  "private": true,
  "packageManager": "pnpm@9",
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "pack:tarballs": "pnpm -r --filter ./packages... pack --pack-destination ./dist/tarballs",
    "e2e:react": "pnpm --filter react-app test",
    "e2e:next": "pnpm --filter next-app test",
    "e2e:qwik": "pnpm --filter qwik-app test",
    "e2e:all": "pnpm e2e:react && pnpm e2e:next && pnpm e2e:qwik"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0"
  }
}
```

### turbo.json (pipeline)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {"dependsOn": ["^build"], "outputs": ["dist/**"]},
    "test": {"dependsOn": ["build"], "outputs": []},
    "dev": {"cache": false}
  }
}
```

---

## 3) Package outlines

### packages/behavior-driven-ui (Main Package)

* **Exports**: `defineConfig`, `defineSteps`, `World`, `Driver` interface, config loader, built-in drivers, runners, presets, CLI
* **Internal Structure**:
  - `core/` - Configuration system, World class, Driver interface
  - `drivers/` - Playwright driver implementation (default)
  - `runners/` - Cucumber.js wrapper and integration
  - `presets/` - Built-in step definitions (navigation, forms, gestures, assertions)
  - `cli/` - CLI commands (`bdui cucumber`, `bdui doctor`, `bdui pack`)
* **Dist**: Single optimized bundle (ESM + CJS) with tree-shaking support
* **Dependencies**: Includes Playwright, Cucumber.js, Commander.js internally

### packages/behavior-driven-ui-webdriver (Optional Override)

* Alternative WebDriver implementation for Selenium-based testing
* Replaces default Playwright driver when installed

### packages/behavior-driven-ui-jest (Optional Override)

* Alternative Jest runner for Jest-based test execution
* Replaces default Cucumber runner when installed

### packages/behavior-driven-ui-cypress (Optional Override)

* Alternative Cypress driver for Cypress-based testing
* Provides Cypress integration when needed

---

## 4) Shared Gherkin: single source of truth

* Canonical features live in `/features/ui/*.feature`.
* Each app **symlinks** or imports those features at runtime so the same scenarios run everywhere.
* Example app `bdui.config.ts` points `features` to `../../features/ui/**/*.feature`.

```
features/
└─ ui/
   ├─ home.feature
   ├─ search.feature
   └─ responsiveness.feature
```

---

## 5) App-level configs (React/Next/Qwik)

**apps/react-app/bdui.config.ts**

```ts
import { defineConfig } from "behavior-driven-ui";
export default defineConfig({
  baseURL: "http://localhost:5173",
  webServer: { command: "pnpm dev", port: 5173, reuseExistingServer: true },
  driver: { kind: "playwright", browser: "chromium", headless: true },
  features: ["../../features/ui/**/*.feature"],
  steps: ["./tests/bdui/steps/**/*.steps.ts"],
  breakpoints: { source: "mui", muiThemePath: "./src/theme.ts", defaultHeight: 800 },
  mocks: { fixturesDir: "./tests/bdui/fixtures", strategy: "playwright" },
  tags: { headed: { driver: { headless: false } }, mobile: { viewport: "sm" } }
});
```

**apps/next-app/bdui.config.ts**

```ts
export default {
  baseURL: "http://localhost:3000",
  webServer: { command: "pnpm start", port: 3000, reuseExistingServer: true },
  driver: { kind: "playwright", browser: "chromium", headless: true },
  features: ["../../features/ui/**/*.feature"],
  steps: ["./tests/bdui/steps/**/*.steps.ts"],
  breakpoints: { source: "tailwind", tailwindConfigPath: "./tailwind.config.ts" }
};
```

**apps/qwik-app/bdui.config.ts**

```ts
export default {
  baseURL: "http://localhost:5173",
  webServer: { command: "pnpm dev", port: 5173, reuseExistingServer: true },
  driver: { kind: "playwright", browser: "chromium", headless: true },
  features: ["../../features/ui/**/*.feature"],
  steps: ["./tests/bdui/steps/**/*.steps.ts"],
  breakpoints: { source: "override", override: { sm: 640, md: 768, lg: 1024 } }
};
```

---

## 6) Making apps consume the **latest built** library

### Local development

* Use workspace protocol (`workspace:^`) so `pnpm install` links to local sources.
* Always build first: `pnpm build` (turbo ensures leaf apps build **after** packages).

### CI & cross-environment consistency

* Produce **tarballs** for the main package and optional overrides during CI:

  1. `pnpm pack:tarballs` → creates `dist/tarballs/behavior-driven-ui-<version>.tgz` and optional override packages.
  2. For each app, `pnpm add -w ./dist/tarballs/behavior-driven-ui-<version>.tgz` to force install the **exact** build artifacts.
* This simulates “real npm installs” without publishing.

### Optional: Changesets for versioning

* Manage versions/publishing with Changesets (`pnpm changeset`, `pnpm changeset version`, `pnpm -r publish`).

---

## 7) Playwright configs per app

Each app keeps its own `playwright.config.ts` but shares a consistent pattern:

```ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: { baseURL: process.env.BASE_URL, headless: true },
  webServer: {
    command: process.env.WEB_COMMAND ?? "pnpm dev",
    port: Number(process.env.PORT ?? 5173),
    reuseExistingServer: true
  }
});
```

> The `runner-cucumber` invokes Playwright with the app’s `bdui.config.ts`; the config injects `BASE_URL`, `WEB_COMMAND`, `PORT`.

---

## 8) Running the **same features** across all apps

### Local

```
pnpm build
pnpm e2e:all
```

* Internally this runs `bdui cucumber` inside each app with the same shared `features/ui/**/*.feature` set.

### Headed vs headless

* Add `@headed` tag at Scenario or Feature level to toggle for just that scope.
* Or run with env: `BDUI_HEADED=1 pnpm e2e:react` (the driver honors env override).

---

## 9) CI workflow (GitHub Actions sketch)

```yaml
name: CI
on: [push, pull_request]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }

      - run: pnpm install
      - run: pnpm build
      - run: pnpm pack:tarballs

      # Install tarballs into each app to mirror real installs
      - run: pnpm --filter react-app add -D ./dist/tarballs/*
      - run: pnpm --filter next-app add -D ./dist/tarballs/*
      - run: pnpm --filter qwik-app add -D ./dist/tarballs/*

      - run: pnpm e2e:react
      - run: pnpm e2e:next
      - run: pnpm e2e:qwik
```

---

## 10) Test organization guarantee (Scenario = test)

* `runner-cucumber` maps every Scenario to a discrete test case.
* Reports show: `React | <Feature> | <Scenario>`, `Next | ...`, `Qwik | ...` for parity checks.

---

## 11) Developer UX summary

* **Add/modify shared Gherkin** in `/features/ui` → all apps pick it up.
* **Extend steps** per app by dropping files in `apps/<app>/tests/bdui/steps`.
* **Mocks & screenshots** work uniformly via the Playwright driver.
* **Responsive** uses MUI/Tailwind/override breakpoints from each app’s config.

---

## 12) Next steps to scaffold

* Create package skeletons with `tsup` build.
* Implement `Driver` Playwright shim and `preset-default` steps.
* Wire `runner-cucumber` to load shared features + per-app step folders.
* Add minimal sample pages in each app that exercise forms, drag/drop, sliders, routing, and responsive layout.
