# Phase 2.5 – CLI Driver Overrides

## Objective
Build the foundation system for runtime configuration overrides via CLI flags and environment variables. This establishes the override mechanism and precedence system that will be extended in 2.6 (headed debug) and 2.7 (screenshots). We are NOT implementing 2.6/2.7 features now - only the configuration override infrastructure.

## Scope Limitations
- **NOT implementing**: headed mode features, screenshot capabilities, or debug workflows
- **NOT adding**: configuration settings that will be needed for 2.6/2.7
- **Focus**: Infrastructure for runtime config overrides and basic driver settings only
- **Future phases**: 2.6 will add headed/debug settings, 2.7 will add screenshot settings

## Tasks & Order

## CLI-Overrideable Settings Proposal
Based on current configuration schema, these settings will support CLI/env override:

**Driver Settings** (existing in config, CLI-suitable):
- `driver.browser` - Browser choice affects testing behavior significantly
- `driver.kind` - Switch between playwright/mock for different test scenarios

**Base Configuration** (existing in config, CLI-suitable):
- `baseURL` - Essential for testing different environments (dev/staging/prod)

**Web Server Settings** (existing in config, CLI-suitable):
- `webServer.port` - Useful for CI environments with dynamic port allocation
- `webServer.reuseExistingServer` - CI optimization setting

**NOT CLI-overrideable** (too complex or inappropriate for runtime):
- `features`, `steps` - File patterns, should be in config
- `breakpoints`, `mocks`, `tags` - Complex objects, config-only
- `webServer.command` - Security risk, config-only

**NOTE**: Settings for 2.6 (headed mode) and 2.7 (screenshots) will be added to config in those phases, not now.

## Tasks & Order

1. **Configuration Schema Extension**
   - Review existing `BehaviorDrivenUIConfig` interface for runtime-overrideable settings
   - Design override interfaces without adding new 2.6/2.7 settings
   - Define precedence system: CLI flags > env vars > config file > defaults
   - **Acceptance Criteria**: TypeScript interfaces defined for overrides, no new config settings
   - **Validation**: `pnpm bdui:lint && pnpm bdui:type:check` passes

2. **Commander.js CLI Flag Integration**
   - Add CLI flags for proposed overrideable settings: `--driver.browser`, `--driver.kind`, `--baseURL`, `--webServer.port`, `--webServer.reuseExistingServer`
   - Add proper option parsing with validation (enums, URLs, ports, booleans)
   - Pass parsed options through to `executeRun` function
   - **Acceptance Criteria**: CLI accepts override flags without errors, help text shows options
   - **Validation**: `bdui run --help` shows override options, `pnpm bdui:build` passes

3. **Config Manager Override System**
   - Extend `ConfigManager` to accept runtime configuration overrides
   - Add `applyRuntimeOverrides(overrides: ConfigOverrides)` method
   - Implement precedence: CLI flags > env vars > config file > defaults
   - **Acceptance Criteria**: ConfigManager merges overrides correctly, existing config unchanged
   - **Validation**: `pnpm bdui:test` passes, config tests verify override behavior

4. **Execute Run Integration**
   - Update `executeRun` to apply CLI overrides to ConfigManager before test execution
   - Ensure environment variable detection works alongside CLI flags
   - Add logging to show which configuration overrides are active
   - **Acceptance Criteria**: Overrides applied before test execution, clearly logged
   - **Validation**: `pnpm bdui:build && pnpm bdui:test` passes

5. **Driver Configuration Integration**
   - Update `PlaywrightDriver` to respect browser setting from config (chromium/firefox/webkit)
   - Update driver factory to handle `driver.kind` override (playwright/mock)
   - Ensure configuration changes flow through to driver instantiation
   - **Acceptance Criteria**: Driver uses overridden browser/kind settings correctly
   - **Validation**: Manual test with each browser override, `pnpm --filter react-sample test` passes

6. **Environment Variable Support**
   - Add environment variable detection for all CLI-overrideable settings
   - Map env vars: `BDUI_DRIVER_BROWSER`, `BDUI_DRIVER_KIND`, `BDUI_BASE_URL`, `BDUI_WEB_SERVER_PORT`, `BDUI_WEB_SERVER_REUSE`
   - Test environment variable precedence below CLI flags but above config
   - **Acceptance Criteria**: Environment variables override config, CLI flags override env vars
   - **Validation**: Manual test with env vars set, `pnpm bdui:test` passes

7. **Integration Tests**
   - Add CLI integration tests for all override flag parsing
   - Test precedence order: CLI > env > config > defaults for each setting
   - Test invalid flag values and error handling
   - **Acceptance Criteria**: All override scenarios tested, error cases covered
   - **Validation**: `pnpm bdui:test` passes with new test coverage

8. **Documentation & Examples**
   - Update CLI help text with override flag descriptions and examples
   - Add configuration override examples showing all supported settings
   - Document environment variable usage for CI scenarios
   - **Acceptance Criteria**: Help text clear, examples functional, docs accurate
   - **Validation**: `bdui run --help` readable, examples can be copy-pasted

9. **Validation & Testing**
   - Test all browser overrides: `--driver.browser chromium|firefox|webkit`
   - Test driver kind override: `--driver.kind playwright|mock`
   - Test all other overrideable settings with various values
   - Verify no breaking changes to existing functionality
   - **Acceptance Criteria**: All override combinations work, existing tests pass
   - **Validation**: Full guardrail command suite passes

## Guardrail Commands
Run after each task completion:
- `pnpm bdui:lint`
- `pnpm bdui:type:check`
- `pnpm bdui:test`
- `pnpm bdui:build`
- `pnpm --filter react-sample test`
- `pnpm run test:force`
- `pnpm run format:check`

## Acceptance Criteria Summary
- CLI accepts all proposed override flags without errors
- Environment variables for all overrideable settings work correctly
- Precedence order works: CLI flags > env vars > config file > defaults
- Driver respects browser and kind overrides from configuration
- BaseURL and webServer settings can be overridden at runtime
- All existing tests pass, no breaking changes to current functionality
- Help text is clear and includes examples for all override options
- Integration tests cover all override scenarios and error cases

## Risks / Watch Items
- Ensure browser installation requirements are clear when switching browsers via override
- Watch for Playwright browser launch failures with clear error messages
- Keep existing config behavior unchanged for backward compatibility
- Ensure CLI flag validation prevents invalid values for all overrideable settings
- Test that override behavior is consistent across different operating systems
- Avoid feature creep - do not add 2.6/2.7 settings during this phase

## Future Phase Integration
- **Phase 2.6**: Will add headed/debug configuration settings and CLI overrides
- **Phase 2.7**: Will add screenshot configuration settings and CLI overrides
- This phase establishes the override infrastructure that future phases will extend

This plan builds incrementally, focusing only on existing configuration settings and the override mechanism itself.