/* global process, setTimeout, console, fetch, Buffer */
import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';

import type { BehaviorDrivenUIConfig } from './types.js';

export interface ServerManagerOptions {
  config: BehaviorDrivenUIConfig;
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
  private readonly config: BehaviorDrivenUIConfig;
  private readonly timeout: number;
  private serverProcess: ChildProcess | null = null;
  private actualServerUrl: string | null = null;
  private serverReady = false;

  constructor(options: ServerManagerOptions) {
    this.config = options.config;
    this.timeout = options.timeout ?? 30_000;
  }

  /**
   * Start the development server and wait for it to be ready
   */
  async start(): Promise<ServerInfo> {
    if (!this.config.webServer?.command) {
      throw new Error('No webServer.command found in configuration');
    }

    const { command } = this.config.webServer;
    const commandParts = command.split(/\s+/);
    const [cmd, ...args] = commandParts;

    if (!cmd) {
      throw new Error('Invalid command: empty command string');
    }

    this.serverProcess = spawn(cmd, args, {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
    });

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

    this.serverProcess.kill('SIGTERM');
    await new Promise((resolve) => setTimeout(resolve, 1_000));

    if (this.serverProcess.exitCode === null) {
      this.serverProcess.kill('SIGKILL');
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
      this.stop()
        .then(() => {
          process.exit(1);
        })
        .catch((_err) => {
          process.exit(1);
        });
    };

    process.once('SIGINT', terminate);
    process.once('SIGTERM', terminate);
  }

  private setupServerOutputParsing(): void {
    if (!this.serverProcess) return;

    this.serverProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      process.stdout.write(output);

      // Parse Vite output to extract actual server URL
      const localMatch = output.match(/➜\s+Local:\s+(https?:\/\/[^\s]+)/);
      if (localMatch?.[1]) {
        this.actualServerUrl = localMatch[1];
        this.serverReady = true;
        // eslint-disable-next-line no-console
        console.log(
          `[server-manager] Detected server URL: ${this.actualServerUrl}`
        );
      }
    });

    this.serverProcess.stderr?.on('data', (data: Buffer) => {
      process.stderr.write(data);
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
