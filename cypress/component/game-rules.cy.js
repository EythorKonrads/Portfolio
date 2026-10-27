// The game's rules (src/game/game.js), driven directly with no drawing
import {
  ASTEROIDS,
  POPULATION_START,
  PRICE_GROWTH,
  SHIP,
  SHOP_ITEMS,
  WAVE_BONUS,
} from '../../src/game/config';
import {
  buy,
  createGame,
  nextWave,
  price,
  satellitePositions,
  step,
  waveAsteroids,
} from '../../src/game/game';

const SIZE = { width: 800, height: 600 };

// A game with nothing left to spawn, so each test places what it needs
const emptyGame = () => {
  const game = createGame({ ...SIZE, seed: 1 });
  game.spawnQueue = [];
  game.asteroids = [];
  return game;
};

const asteroid = (game, size, x, y, vx = 0, vy = 0) => ({
  size,
  x,
  y,
  vx,
  vy,
  radius: ASTEROIDS[size].radius * game.scale,
  hp: ASTEROIDS[size].hp,
  spin: 0,
  rotation: 0,
  seed: 0.5,
});

// Keep the Ship out of the way in a corner
const parkShip = (game) => Object.assign(game.ship, { x: 20, y: 20 });

// A second Asteroid far away stops the Wave ending mid-test
const keepWaveGoing = (game) =>
  game.asteroids.push(asteroid(game, 'small', 790, 590));

describe('Game rules', () => {
  it('starts on Wave 1 with the whole Population and no Ore', () => {
    const game = createGame({ ...SIZE, seed: 1 });
    expect(game.status).to.equal('wave');
    expect(game.wave).to.equal(1);
    expect(game.population).to.equal(POPULATION_START);
    expect(game.ore).to.equal(0);
    expect(game.earth).to.include({ x: 400, y: 300 });
  });

  it('brings in smalls first, then mediums, then larges', () => {
    const sizes = (wave) => new Set(waveAsteroids(wave));
    expect([...sizes(1)]).to.deep.equal(['small']);
    expect([...sizes(2)]).to.deep.equal(['small']);
    expect(sizes(3).has('medium')).to.be.true;
    expect(sizes(4).has('large')).to.be.false;
    expect(sizes(5).has('large')).to.be.true;
    expect(waveAsteroids(6).length).to.be.greaterThan(waveAsteroids(1).length);
  });

  it('breaks a large Asteroid into mediums and a medium into smalls', () => {
    const game = emptyGame();
    parkShip(game);
    keepWaveGoing(game);
    const large = asteroid(game, 'large', 100, 300);
    large.hp = 1;
    game.asteroids.push(large);
    game.shots.push({ from: 'ship', x: 100, y: 300, vx: 0, vy: 0, life: 1 });
    step(game, 0.01);
    const sizes = game.asteroids.map((a) => a.size);
    expect(sizes.filter((s) => s === 'medium')).to.have.length(2);
    expect(game.ore).to.equal(ASTEROIDS.large.ore);
    expect(game.score).to.equal(ASTEROIDS.large.score);

    const medium = game.asteroids.find((a) => a.size === 'medium');
    Object.assign(medium, { hp: 1, vx: 0, vy: 0 });
    game.shots.push({
      from: 'ship',
      x: medium.x,
      y: medium.y,
      vx: 0,
      vy: 0,
      life: 1,
    });
    step(game, 0.01);
    expect(game.asteroids.filter((a) => a.size === 'small')).to.have.length(3);
  });

  it('leaves nothing behind when a small Asteroid is destroyed', () => {
    const game = emptyGame();
    parkShip(game);
    keepWaveGoing(game);
    game.asteroids.push(asteroid(game, 'small', 100, 300));
    game.shots.push({ from: 'ship', x: 100, y: 300, vx: 0, vy: 0, life: 1 });
    step(game, 0.01);
    expect(game.asteroids).to.have.length(1);
    expect(game.ore).to.equal(ASTEROIDS.small.ore);
  });

  it('costs Population by Asteroid size when Earth is hit', () => {
    Object.keys(ASTEROIDS).forEach((size) => {
      const game = emptyGame();
      parkShip(game);
      keepWaveGoing(game);
      game.asteroids.push(asteroid(game, size, 400, 300));
      step(game, 0.01);
      expect(game.population, size).to.be.closeTo(
        POPULATION_START - ASTEROIDS[size].damage,
        1e-9
      );
    });
  });

  it('ends the game when the Population reaches zero', () => {
    const game = emptyGame();
    parkShip(game);
    game.population = 0.2;
    game.asteroids.push(asteroid(game, 'small', 400, 300));
    step(game, 0.01);
    expect(game.population).to.equal(0);
    expect(game.status).to.equal('over');
  });

  it('opens the Shop with a Wave bonus once a Wave is cleared', () => {
    const game = emptyGame();
    step(game, 0.01);
    expect(game.status).to.equal('shop');
    expect(game.score).to.equal(WAVE_BONUS * 1);
    nextWave(game);
    expect(game.status).to.equal('wave');
    expect(game.wave).to.equal(2);
  });

  it('stops the Ship at the edge of the screen, sliding along it', () => {
    const game = emptyGame();
    keepWaveGoing(game);
    Object.assign(game.ship, { x: 795, y: 200, vx: 300, vy: 100 });
    step(game, 0.05);
    const edge = SIZE.width - SHIP.radius * game.scale;
    expect(game.ship.x).to.equal(edge);
    expect(game.ship.vx).to.equal(0);
    expect(game.ship.vy, 'keeps moving along the edge').to.be.greaterThan(0);
  });

  it('brings a destroyed Ship back beside Earth, safe for a while', () => {
    const game = emptyGame();
    keepWaveGoing(game);
    Object.assign(game.ship, { x: 100, y: 100, safeFor: 0 });
    game.asteroids.push(asteroid(game, 'medium', 100, 100));
    step(game, 0.01);
    expect(game.ship.alive).to.be.false;
    for (let t = 0; t < SHIP.respawnDelay + 0.1; t += 0.05) step(game, 0.05);
    expect(game.ship.alive).to.be.true;
    expect(game.ship.safeFor).to.be.greaterThan(0);
    expect(
      Math.hypot(game.ship.x - game.earth.x, game.ship.y - game.earth.y)
    ).to.be.lessThan(game.earth.radius * 3);
  });

  it('lets Asteroids pass through Satellites unharmed', () => {
    const game = emptyGame();
    parkShip(game);
    keepWaveGoing(game);
    game.owned.satellite = 1;
    game.satelliteCooldowns = [99]; // not firing
    const [position] = satellitePositions(game);
    const rock = asteroid(game, 'medium', position.x, position.y);
    game.asteroids.push(rock);
    step(game, 0.001);
    expect(rock.hp).to.equal(ASTEROIDS.medium.hp);
    expect(game.owned.satellite).to.equal(1);
  });

  it('has Turrets fire at Asteroids in range', () => {
    const game = emptyGame();
    parkShip(game);
    game.owned.turret = 1;
    game.asteroids.push(asteroid(game, 'small', 400, 150));
    step(game, 0.01);
    expect(game.shots.some((shot) => shot.from === 'turret')).to.be.true;
  });

  context('the Shop', () => {
    const shopGame = (ore) => {
      const game = emptyGame();
      step(game, 0.01); // clears Wave 1
      game.ore = ore;
      return game;
    };

    it('raises each price by the growth factor per purchase', () => {
      const game = shopGame(1000);
      const first = price(game, 'satellite');
      expect(first).to.equal(SHOP_ITEMS.satellite.price);
      buy(game, 'satellite');
      expect(price(game, 'satellite')).to.equal(
        Math.round(SHOP_ITEMS.satellite.price * PRICE_GROWTH)
      );
      expect(game.ore).to.equal(1000 - first);
    });

    it('caps Turrets at 4 and Satellites at 6', () => {
      const game = shopGame(1e6);
      for (let i = 0; i < 10; i++) {
        buy(game, 'turret');
        buy(game, 'satellite');
      }
      expect(game.owned.turret).to.equal(4);
      expect(game.owned.satellite).to.equal(6);
    });

    it('sells Turret upgrades only once there is a Turret', () => {
      const game = shopGame(1000);
      expect(buy(game, 'turretRate')).to.be.false;
      buy(game, 'turret');
      expect(buy(game, 'turretRate')).to.be.true;
    });

    it("doesn't sell what the player can't afford, or mid-Wave", () => {
      const game = shopGame(5);
      expect(buy(game, 'turret')).to.be.false;
      expect(game.ore).to.equal(5);
      game.ore = 1000;
      nextWave(game);
      expect(buy(game, 'turret')).to.be.false;
    });
  });
});
