// Talks to the scoreboard function (netlify/functions/scores/). Any failure,
// such as being offline or running under `vite dev`, which has no functions,
// comes back as null, and the end screen says the board isn't available.
const ENDPOINT = '/api/scores';

async function call(options) {
  try {
    const response = await fetch(ENDPOINT, options);
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data?.board) ? data : null;
  } catch {
    return null;
  }
}

// -> { board }
export const fetchBoard = () => call();

// -> { board, rank }, rank 0 if it didn't make the board
export const submitScore = (entry) =>
  call({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
