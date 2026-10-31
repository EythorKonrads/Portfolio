// The shared scoreboard: its rules (src/game/scoreboard.js) and the API that
// stores it (netlify/functions/scores/handler.mjs), here with an in-memory
// store in place of Netlify Blobs
import { ASTEROIDS, FIRST_SPAWN, WAVE_BONUS } from '../../src/game/config';
import { waveAsteroids } from '../../src/game/game';
import {
  BOARD_SIZE,
  addToBoard,
  entryProblem,
  maxScore,
  qualifies,
} from '../../src/game/scoreboard';
import { handleScores } from '../../netlify/functions/scores/handler.mjs';

const entry = (initials, score, date = '2026-01-01T00:00:00.000Z') => ({
  initials,
  score,
  wave: 3,
  time: 60,
  date,
});
const fullBoard = () =>
  Array.from({ length: BOARD_SIZE }, (_, i) =>
    entry('AAA', (BOARD_SIZE - i) * 100)
  );

const memoryStore = () => {
  const data = new Map();
  return {
    data,
    get: async (key) => (data.has(key) ? JSON.parse(data.get(key)) : null),
    setJSON: async (key, value) => data.set(key, JSON.stringify(value)),
  };
};
const request = (method, body) =>
  new Request('http://localhost/api/scores', {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe('Scoreboard', () => {
  context('rules', () => {
    it('caps the Score at what the Waves reached could give', () => {
      // Wave 1 is all smalls, which don't split
      const wave1 = waveAsteroids(1).length * ASTEROIDS.small.score;
      expect(maxScore(1)).to.equal(wave1);
      expect(maxScore(2)).to.be.greaterThan(wave1 + WAVE_BONUS);
    });

    it('accepts a possible entry, and says what is wrong with others', () => {
      const ok = { initials: 'ABC', score: 50, wave: 1, time: 20 };
      expect(entryProblem(ok)).to.be.null;
      expect(entryProblem({ ...ok, initials: 'abc' })).to.equal('initials');
      expect(entryProblem({ ...ok, initials: 'AB' })).to.equal('initials');
      expect(entryProblem({ ...ok, initials: 'A1C' })).to.equal('initials');
      expect(entryProblem({ ...ok, wave: 0 })).to.equal('wave');
      expect(entryProblem({ ...ok, wave: 1.5 })).to.equal('wave');
      expect(entryProblem({ ...ok, score: 0 })).to.equal('score');
      expect(entryProblem({ ...ok, score: maxScore(1) + 1 })).to.equal('score');
      // Wave 5 can't be reached sooner than four Waves' first spawns
      expect(
        entryProblem({ ...ok, wave: 5, time: 4 * FIRST_SPAWN - 1 })
      ).to.equal('time');
    });

    it('lets a Score in while the board has room, or beats the last place', () => {
      expect(qualifies([], 10)).to.be.true;
      expect(qualifies([], 0)).to.be.false;
      const board = fullBoard();
      expect(qualifies(board, 100)).to.be.false;
      expect(qualifies(board, 101)).to.be.true;
    });

    it('ranks by Score, the earlier entry first on a tie, and keeps 10', () => {
      const first = entry('OLD', 500, '2026-01-01T00:00:00.000Z');
      const later = entry('NEW', 500, '2026-02-01T00:00:00.000Z');
      const { board, rank } = addToBoard([first], later);
      expect(board.map((e) => e.initials)).to.deep.equal(['OLD', 'NEW']);
      expect(rank).to.equal(2);

      const full = addToBoard(fullBoard(), entry('TOP', 5000));
      expect(full.rank).to.equal(1);
      expect(full.board).to.have.length(BOARD_SIZE);
    });
  });

  context('API', () => {
    it('serves an empty board to start with', async () => {
      const response = await handleScores(request('GET'), memoryStore());
      expect(response.status).to.equal(200);
      expect(await response.json()).to.deep.equal({ board: [] });
    });

    it('saves an entry that makes the board, and keeps it for good', async () => {
      const store = memoryStore();
      const response = await handleScores(
        request('POST', { initials: 'ABC', score: 50, wave: 1, time: 20 }),
        store
      );
      const { board, rank } = await response.json();
      expect(rank).to.equal(1);
      expect(board[0]).to.include({ initials: 'ABC', score: 50, wave: 1 });
      const keys = [...store.data.keys()];
      expect(keys.filter((k) => k.startsWith('entries/'))).to.have.length(1);
      expect(keys).to.include('board');
    });

    it("writes nothing for a Score that doesn't make the board", async () => {
      const store = memoryStore();
      await store.setJSON('board', fullBoard());
      const response = await handleScores(
        request('POST', { initials: 'ABC', score: 50, wave: 1, time: 20 }),
        store
      );
      expect((await response.json()).rank).to.equal(0);
      expect([...store.data.keys()]).to.deep.equal(['board']);
    });

    it('turns away impossible, malformed and oversized entries', async () => {
      const store = memoryStore();
      const status = async (req) => (await handleScores(req, store)).status;
      expect(
        await status(
          request('POST', { initials: 'ABC', score: 1e9, wave: 1, time: 20 })
        )
      ).to.equal(422);
      expect(
        await status(
          new Request('http://localhost/api/scores', {
            method: 'POST',
            body: '{nope',
          })
        )
      ).to.equal(400);
      expect(
        await status(request('POST', { initials: 'x'.repeat(600) }))
      ).to.equal(413);
      expect(await status(request('DELETE'))).to.equal(405);
      expect(store.data.size).to.equal(0);
    });
  });
});
