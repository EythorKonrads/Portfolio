// A fixed port lets a run in another worktree pass against the first run's
// server, so each run takes a free port.
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import process from 'node:process';

const port = await new Promise((resolve) => {
  const server = createServer().listen(0, () => {
    const freePort = server.address().port;
    server.close(() => resolve(freePort));
  });
});
const url = `http://localhost:${port}`;

const isQuiet = process.argv.includes('--quiet');
const { status, stderr } = spawnSync(
  'start-server-and-test',
  [
    `vite preview --port ${port} --strictPort`,
    url,
    `cypress run --e2e -b electron --config baseUrl=${url} ${process.argv.slice(2).join(' ')}`,
  ],
  {
    stdio: ['inherit', 'inherit', isQuiet ? 'pipe' : 'inherit'],
    encoding: 'utf8',
  }
);

// A failed run ends with a long error dump that only repeats the exit code
if (stderr) process.stderr.write(stderr.split('Error: Command failed')[0]);

process.exit(status ?? 1);
