import { supportCodeLibraryBuilder } from '@cucumber/cucumber';

import { registerBehaviorDrivenUISupport } from './cucumber/register.js';
import { hasWorldConfig, setWorldConfig } from './core/world.js';

if (!hasWorldConfig()) {
  setWorldConfig({
    config: {
      baseURL: '',
      features: [],
      steps: [],
    },
  });
}

registerBehaviorDrivenUISupport(supportCodeLibraryBuilder.methods);
