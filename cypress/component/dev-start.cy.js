// Playtesting shortcuts from the URL (src/game/devStart.js)
import { POPULATION_START } from '../../src/game/config';
import { createGame, waveAsteroids } from '../../src/game/game';
import { applyDevStart } from '../../src/game/devStart';

const game = () => createGame({ width: 800, height: 600, seed: 1 });

describe('Dev start', () => {
  it('starts on the Wave asked for, with its Asteroids lined up', () => {
    const g = game();
    applyDevStart(g, '?wave=20');
    expect(g.wave).to.equal(20);
    expect(g.spawnQueue).to.have.length(waveAsteroids(20).length);
  });

  it('sets the Ore and people asked for, within limits', () => {
    const g = game();
    applyDevStart(g, '?ore=3000&people=0.5');
    expect(g.ore).to.equal(3000);
    expect(g.population).to.equal(0.5);
    applyDevStart(g, '?people=99&ore=-5');
    expect(g.population).to.equal(POPULATION_START);
    expect(g.ore).to.equal(0);
  });

  it('leaves the game alone without options, or with junk', () => {
    const g = game();
    applyDevStart(g, '');
    applyDevStart(g, '?wave=abc&people=&ore=1e999');
    expect(g.wave).to.equal(1);
    expect(g.population).to.equal(POPULATION_START);
    expect(g.ore).to.equal(0);
  });
});
