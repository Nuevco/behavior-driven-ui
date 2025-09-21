/**
 * Minimal interfaces that describe the initial BDUI CLI configuration surface.
 * These cover the common 80% use cases we expect developers to tweak while leaving
 * room to grow (annotated where future expansion is likely).
 */

import { z } from 'zod';

/** Glob pattern or list of patterns accepted in the configuration. */
export type BduiGlobInput = string | string[];
export const BduiGlobInputSchema = z.union([
  z.string().min(1),
  z.array(z.string().min(1)).min(1),
]);

/** Environment variables that should be injected before running Cucumber. */
export type BduiEnvironmentVariables = Record<string, string>;
export const BduiEnvironmentVariablesSchema = z.record(z.string().min(1));

/** Basic driver options most teams toggle when running UI tests locally or in CI. */
export interface BduiDriverDef {
  readonly browser?: 'chromium' | 'firefox' | 'webkit' | undefined;
  readonly headless?: boolean | undefined;
}
export const BduiDriverDefSchema = z.object({
  browser: z.enum(['chromium', 'firefox', 'webkit']).optional(),
  headless: z.boolean().optional(),
});

/** Lightweight web server configuration to launch an app under test. */
export interface BduiWebServerDef {
  readonly command: string;
  readonly port: number;
  readonly reuseExistingServer?: boolean | undefined;
  // Future: add health check endpoints, ready timeouts, etc.
}
export const BduiWebServerDefSchema = z.object({
  command: z.string().min(1),
  port: z.number().int().positive(),
  reuseExistingServer: z.boolean().optional(),
});

/** Cucumber overrides limited to the common tag + order tweaks. */
export interface BduiCucumberOptionsDef {
  readonly tagExpression?: string | undefined;
  readonly order?: 'defined' | 'random' | undefined;
  // Future: expose formatter + runtime knobs once the basics are validated.
}
export const BduiCucumberOptionsDefSchema = z.object({
  tagExpression: z.string().min(1).optional(),
  order: z.enum(['defined', 'random']).optional(),
});

/**
 * Configuration accepted from `bdui.config.(ts|js)`.
 * Keep this intentionally small so onboarding stays smooth.
 */
export interface BduiCliConfigDef {
  readonly projectRoot?: string | undefined;
  readonly baseURL?: string | undefined;
  readonly features?: BduiGlobInput | undefined;
  readonly steps?: BduiGlobInput | undefined;
  readonly driver?: BduiDriverDef | undefined;
  readonly webServer?: BduiWebServerDef | undefined;
  readonly cucumber?: BduiCucumberOptionsDef | undefined;
  readonly environment?: BduiEnvironmentVariables | undefined;
  // Future: allow advanced runtime overrides (breakpoints, mocks, etc.).
}
export const BduiCliConfigDefSchema = z.object({
  projectRoot: z.string().min(1).optional(),
  baseURL: z.string().url().optional(),
  features: BduiGlobInputSchema.optional(),
  steps: BduiGlobInputSchema.optional(),
  driver: BduiDriverDefSchema.optional(),
  webServer: BduiWebServerDefSchema.optional(),
  cucumber: BduiCucumberOptionsDefSchema.optional(),
  environment: BduiEnvironmentVariablesSchema.optional(),
});

/** Resolved driver settings after applying defaults. */
export interface BduiResolvedDriverDef {
  readonly browser: 'chromium' | 'firefox' | 'webkit';
  readonly headless: boolean;
}
export const BduiResolvedDriverDefSchema = z.object({
  browser: z.enum(['chromium', 'firefox', 'webkit']),
  headless: z.boolean(),
});

/** Resolved cucumber options after merging defaults. */
export interface BduiResolvedCucumberOptionsDef {
  readonly tagExpression: string;
  readonly order: 'defined' | 'random';
}
export const BduiResolvedCucumberOptionsDefSchema = z.object({
  tagExpression: z.string(),
  order: z.enum(['defined', 'random']),
});

/** Fully hydrated configuration with defaults applied for CLI execution. */
export interface BduiResolvedConfigDef {
  readonly projectRoot: string;
  readonly configFilePath: string | null;
  readonly baseURL: string;
  readonly features: string[];
  readonly steps: string[];
  readonly driver: BduiResolvedDriverDef;
  readonly webServer?: BduiWebServerDef | undefined;
  readonly cucumber: BduiResolvedCucumberOptionsDef;
  readonly environment: BduiEnvironmentVariables;
}
export const BduiResolvedConfigDefSchema = z.object({
  projectRoot: z.string().min(1),
  configFilePath: z.string().min(1).nullable(),
  baseURL: z.string().url(),
  features: z.array(z.string().min(1)).min(1),
  steps: z.array(z.string().min(1)).min(1),
  driver: BduiResolvedDriverDefSchema,
  webServer: BduiWebServerDefSchema.optional(),
  cucumber: BduiResolvedCucumberOptionsDefSchema,
  environment: BduiEnvironmentVariablesSchema,
});
