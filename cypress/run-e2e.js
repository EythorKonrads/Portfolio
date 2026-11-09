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

const { status } = spawnSync(
  'start-server-and-test',
  [
    `vite preview --port ${port} --strictPort`,
    url,
    `cypress run --e2e -b electron --config baseUrl=${url} ${process.argv.slice(2).join(' ')}`,
  ],
  { stdio: 'inherit' }
);

process.exit(status ?? 1);
