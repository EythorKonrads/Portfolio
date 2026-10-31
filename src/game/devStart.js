// Playtesting shortcuts, read from the page's URL under `npm run dev` or
// `netlify dev` only; production builds leave them out. For example:
//
//   http://localhost:5173/?wave=20&ore=3000&people=0.5
//
//   wave    start on this Wave
//   ore     start with this much Ore
//   people  start with this many billion people (at most the usual 8)
//
// The Scoreboard turns away a game started on a late Wave: it was played
// faster than the Waves allow. To test saving a Score, use `people` alone.
import { POPULATION_START } from './config';
import { startWave } from './game';

export function applyDevStart(game, search) {
  const params = new URLSearchParams(search);
  // null when missing, empty or not a number
  const number = (name) => {
    const raw = params.get(name)?.trim();
    const value = Number(raw);
    return raw && Number.isFinite(value) ? value : null;
  };

  const wave = number('wave');
  if (wave !== null && wave > 1) {
    game.wave = Math.floor(wave) - 1;
    startWave(game);
  }
  const ore = number('ore');
  if (ore !== null) game.ore = Math.max(0, Math.floor(ore));
  const people = number('people');
  if (people !== null) {
    game.population = Math.min(POPULATION_START, Math.max(0.1, people));
  }
}
