import { spawn } from 'node:child_process';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

// Load BDUI configuration
async function loadBduiConfig() {
  const configPath = path.resolve(process.cwd(), 'bdui.config.ts');
  try {
    // Use dynamic import with file URL for .ts files
    const configModule = await import(pathToFileURL(configPath).href);
    return configModule.default;
  } catch (error) {
    throw new Error(`Failed to load bdui.config.ts: ${error.message}`);
  }
}

async function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now();
  let attempt = 0;

  while (Date.now() - start < timeoutMs) {
    attempt += 1;

    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        console.log(`[dev-server] Ready after ${attempt} attempt(s) (${Date.now() - start}ms).`);
        return;
      }

      console.warn(
        `[dev-server] Attempt ${attempt}: received status ${response.status} ${response.statusText}.`
      );
    } catch (error) {
      const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      console.warn(`[dev-server] Attempt ${attempt}: request failed (${reason}).`);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for dev server at ${url} after ${attempt} attempt(s).`);
}

async function run() {
  // Load configuration
  const config = await loadBduiConfig();
  const webServerConfig = config.webServer;

  if (!webServerConfig?.command) {
    throw new Error('No webServer.command found in bdui.config.ts');
  }

  // Parse the command to extract arguments
  const commandParts = webServerConfig.command.split(/\s+/);
  const [cmd, ...args] = commandParts;

  let actualServerUrl = null;
  let serverReady = false;

  const server = spawn(cmd, args, {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'development',
    },
  });

  // Parse Vite output to get actual server URL
  server.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);

    // Look for Vite's "Local:" output to get the actual URL
    const localMatch = output.match(/➜\s+Local:\s+(https?:\/\/[^\s]+)/);
    if (localMatch) {
      actualServerUrl = localMatch[1];
      serverReady = true;
      console.log(`[dev-server] Detected actual server URL: ${actualServerUrl}`);
    }
  });

  server.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  const terminateServer = async () => {
    if (server.exitCode === null) {
      server.kill('SIGTERM');
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      if (server.exitCode === null) {
        server.kill('SIGKILL');
      }
    }
  };

  const handleTermination = async () => {
    await terminateServer();
    process.exit(1);
  };

  process.once('SIGINT', handleTermination);
  process.once('SIGTERM', handleTermination);

  server.on('error', async (error) => {
    await terminateServer();
    console.error('Failed to start dev server:', error);
    process.exit(1);
  });

  // Wait for Vite to output its ready message with actual URL
  const waitForViteReady = async (timeoutMs = 30_000) => {
    const start = Date.now();

    while (!serverReady && Date.now() - start < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!serverReady || !actualServerUrl) {
      throw new Error('Vite did not report ready status with server URL within timeout');
    }
  };

  try {
    await waitForViteReady();
    // Give Vite a moment to fully bind to the port after reporting ready
    await new Promise((resolve) => setTimeout(resolve, 500));
    await waitForServer(actualServerUrl);
  } catch (error) {
    await terminateServer();
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const runner = spawn(pnpmCommand, ['exec', 'bdui', 'run'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });

  runner.on('exit', async (code) => {
    await terminateServer();
    process.exit(code ?? 1);
  });
}

await run();
