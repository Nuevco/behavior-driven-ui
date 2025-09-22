/* global process, setTimeout, console, fetch, Buffer, clearTimeout */
import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';

import { globalConfigManager } from './config-manager.js';

interface NodeError extends Error {
  code?: string;
}

export interface ServerManagerOptions {
  timeout?: number;
}

export interface ServerInfo {
  url: string;
  process: ChildProcess;
}

/**
 * Manages development server startup and health checking
 */
export class ServerManager {
  private readonly timeout: number;
  private serverProcess: ChildProcess | null = null;
  private actualServerUrl: string | null = null;
  private serverReady = false;

  constructor(options: ServerManagerOptions = {}) {
    // Use shorter timeout in CI environments to prevent hanging
    this.timeout = options.timeout ?? 30_000;
  }

  /**
   * Start the development server and wait for it to be ready
   */
  async start(): Promise<ServerInfo> {
    if (!globalConfigManager.getConfig().webServer?.command) {
      throw new Error('No webServer.command found in configuration');
    }

    const webServer = globalConfigManager.getConfig().webServer;
    if (!webServer) {
      throw new Error('WebServer configuration is missing');
    }
    const commandParts = webServer.command.split(/\s+/);
    const [cmd, ...args] = commandParts;

    if (!cmd) {
      throw new Error('Invalid command: empty command string');
    }

    // eslint-disable-next-line no-console
    console.log(`[server-manager] Spawning server: ${cmd} ${args.join(' ')}`);
    // eslint-disable-next-line no-console
    console.log(`[server-manager] Working directory: ${process.cwd()}`);

    this.serverProcess = spawn(cmd, args, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
      detached: false,
    });

    // eslint-disable-next-line no-console
    console.log(
      `[server-manager] Server process spawned with PID: ${this.serverProcess.pid}`
    );

    this.setupServerOutputParsing();
    this.setupErrorHandling();

    await this.waitForServerReady();

    if (!this.actualServerUrl) {
      throw new Error('Server started but no URL was detected');
    }

    await this.healthCheck(this.actualServerUrl);

    if (!this.serverProcess) {
      throw new Error('Server process is null after startup');
    }

    return {
      url: this.actualServerUrl,
      process: this.serverProcess,
    };
  }

  /**
   * Stop the development server
   */
  async stop(): Promise<void> {
    if (!this.serverProcess || this.serverProcess.exitCode !== null) {
      return;
    }

    // Try graceful shutdown first
    this.serverProcess.kill('SIGTERM');

    // Wait for graceful exit with timeout
    const gracefulExitPromise = new Promise<void>((resolve) => {
      if (!this.serverProcess) {
        resolve();
        return;
      }

      this.serverProcess.once('exit', () => resolve());

      // Fallback timeout for graceful shutdown
      setTimeout(() => {
        if (this.serverProcess && this.serverProcess.exitCode === null) {
          this.serverProcess.kill('SIGKILL');
        }
        resolve();
      }, 2_000);
    });

    await gracefulExitPromise;

    // Final cleanup with timeout
    if (this.serverProcess && this.serverProcess.exitCode === null) {
      this.serverProcess.kill('SIGKILL');

      // Wait for force kill with timeout
      await new Promise<void>((resolve) => {
        const forceTimeout = setTimeout(() => resolve(), 1_000);
        this.serverProcess?.once('exit', () => {
          clearTimeout(forceTimeout);
          resolve();
        });
      });
    }

    this.serverProcess = null;
    this.actualServerUrl = null;
    this.serverReady = false;
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  setupSignalHandlers(): void {
    const terminate = (): void => {
      this.stop().catch((_err) => {
        // Log error but don't exit - let the main process handle exit
      });
    };

    process.once('SIGINT', terminate);
    process.once('SIGTERM', terminate);
  }

  private setupServerOutputParsing(): void {
    if (!this.serverProcess) return;

    this.serverProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();

      // Log all output chunks to see what we're getting (clean for readability)
      // eslint-disable-next-line no-control-regex
      const cleanForLogging = output.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
      // eslint-disable-next-line no-console
      console.log(
        `[server-manager] STDOUT: ${JSON.stringify(cleanForLogging)}`
      );

      // Only write to stdout if not in CI environment to avoid hanging
      if (!process.env.CI) {
        process.stdout.write(output);
      }

      // Parse Vite output to extract actual server URL
      // Strip ALL ANSI escape codes (colors, formatting, cursor movements, etc.)
      // eslint-disable-next-line no-control-regex
      const cleanOutput = output.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
      const localMatch = cleanOutput.match(/➜\s+Local:\s+(https?:\/\/[^\s]+)/);
      if (localMatch?.[1]) {
        this.actualServerUrl = localMatch[1];
        this.serverReady = true;

        // Update ConfigManager with detected server info
        const url = new URL(this.actualServerUrl);
        globalConfigManager.updateServerInfo({
          url: this.actualServerUrl,
          port: parseInt(url.port, 10),
        });

        // eslint-disable-next-line no-console
        console.log(
          `[server-manager] SUCCESS: Detected server URL: ${this.actualServerUrl}`
        );
      }
    });

    this.serverProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString();

      // Log stderr too in case errors are there
      // eslint-disable-next-line no-console
      console.log(`[server-manager] STDERR: ${JSON.stringify(output)}`);

      // Only write to stderr if not in CI environment to avoid hanging
      if (!process.env.CI) {
        process.stderr.write(data);
      }
    });

    // Handle broken pipes and errors on stdout/stderr
    this.serverProcess.stdout?.on('error', (err: NodeError) => {
      // Ignore EPIPE errors which are common in CI
      if (err.code !== 'EPIPE') {
        // eslint-disable-next-line no-console
        console.warn('[server-manager] stdout error:', err.message);
      }
    });

    this.serverProcess.stderr?.on('error', (err: NodeError) => {
      // Ignore EPIPE errors which are common in CI
      if (err.code !== 'EPIPE') {
        // eslint-disable-next-line no-console
        console.warn('[server-manager] stderr error:', err.message);
      }
    });
  }

  private setupErrorHandling(): void {
    if (!this.serverProcess) return;

    this.serverProcess.on('error', (error) => {
      // eslint-disable-next-line promise/no-promise-in-callback
      this.stop().catch(() => {
        // Ignore cleanup errors during error handling
      });
      throw new Error(`Server process failed: ${error.message}`);
    });
  }

  private async waitForServerReady(): Promise<void> {
    const start = Date.now();

    while (!this.serverReady && Date.now() - start < this.timeout) {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }

    if (!this.serverReady || !this.actualServerUrl) {
      throw new Error('Server did not start within timeout period');
    }

    // Give the server a moment to fully bind to the port
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }

  private async healthCheck(url: string): Promise<void> {
    const start = Date.now();
    let attempt = 0;

    while (Date.now() - start < this.timeout) {
      attempt++;

      try {
        const response = await fetch(url, { method: 'GET' });
        if (response.ok) {
          // eslint-disable-next-line no-console
          console.log(
            `[server-manager] Health check passed after ${attempt} attempt(s) (${Date.now() - start}ms)`
          );
          return;
        }

        // eslint-disable-next-line no-console
        console.warn(
          `[server-manager] Health check attempt ${attempt}: ${response.status} ${response.statusText}`
        );
      } catch (error) {
        const reason =
          error instanceof Error
            ? `${error.name}: ${error.message}`
            : String(error);
        // eslint-disable-next-line no-console
        console.warn(
          `[server-manager] Health check attempt ${attempt}: ${reason}`
        );
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
    }

    throw new Error(`Health check failed after ${attempt} attempts`);
  }
}
