import { spawn } from 'node:child_process';
import process from 'node:process';

const SERVER_URL = 'http://127.0.0.1:4173';
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

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
  const server = spawn(
    pnpmCommand,
    ['run', 'dev', '--host=127.0.0.1', '--port=4173'],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
    }
  );

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

  try {
    await waitForServer(SERVER_URL);
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
