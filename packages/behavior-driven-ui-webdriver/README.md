# behavior-driven-ui-webdriver

WebDriver driver implementation for behavior-driven-ui framework.

## Installation

```bash
npm install behavior-driven-ui-webdriver
# or
pnpm add behavior-driven-ui-webdriver
```

## Usage

```typescript
import { WebDriverDriver } from 'behavior-driven-ui-webdriver';
import { defineConfig } from 'behavior-driven-ui';

const config = defineConfig({
  baseURL: 'http://localhost:3000',
  driver: {
    kind: 'webdriver',
    browser: 'chrome',
    headless: true,
  },
  features: ['features/**/*.feature'],
  steps: ['steps/**/*.ts'],
});

// Use WebDriver with behavior-driven-ui
const driver = new WebDriverDriver({
  browser: 'chrome',
  headless: true,
});
```

## Configuration

The WebDriver driver supports the following configuration options:

- `browser`: Browser to use (chrome, firefox, edge, safari)
- `headless`: Run in headless mode
- `serverUrl`: WebDriver server URL (for remote execution)
- `capabilities`: Custom WebDriver capabilities
- `implicitWait`: Implicit wait timeout
- `pageLoadTimeout`: Page load timeout
- `scriptTimeout`: Script execution timeout

## Requirements

- Node.js 18+
- behavior-driven-ui (peer dependency)
- Browser drivers (chromedriver, geckodriver, etc.)

## License

MIT