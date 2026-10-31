// The game's rules (src/game/game.js), driven directly with no drawing
import {
  ASTEROIDS,
  BURST,
  FIRST_SPAWN,
  IMPACT,
  POPULATION_START,
  PRICE_GROWTH,
  SHIP,
  SHOP_ITEMS,
  WAVE_BONUS,
  WAVE_TITLE,
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

  it('pays enough Ore for a first upgrade when all of Wave 1 is shot', () => {
    const ore = waveAsteroids(1).reduce((sum, s) => sum + ASTEROIDS[s].ore, 0);
    const cheapest = Math.min(
      ...Object.values(SHOP_ITEMS).map((item) => item.price)
    );
    expect(ore).to.be.at.least(cheapest);
  });

  it('holds back the first Asteroid until the Wave title has gone', () => {
    const game = createGame({ ...SIZE, seed: 1 });
    parkShip(game);
    while (game.time < WAVE_TITLE) step(game, 0.05);
    expect(game.asteroids).to.have.length(0);
    while (game.time < FIRST_SPAWN + 0.05) step(game, 0.05);
    expect(game.asteroids).to.have.length(1);
  });

  it('ends the Wave as soon as the last Asteroid leaves the screen', () => {
    const game = emptyGame();
    parkShip(game);
    // Just past the right edge, heading further out
    const leaving = asteroid(game, 'small', 790, 300, 200, 0);
    game.asteroids.push(leaving);
    step(game, 0.01);
    expect(game.status).to.equal('wave');
    while (leaving.x < SIZE.width + leaving.radius) step(game, 0.01);
    step(game, 0.01);
    expect(game.asteroids).to.have.length(0);
    expect(game.status).to.equal('shop');
  });

  it('keeps Asteroids that are off screen but heading in', () => {
    const game = emptyGame();
    parkShip(game);
    game.asteroids.push(asteroid(game, 'small', -30, 300, 50, 0));
    step(game, 0.01);
    expect(game.asteroids).to.have.length(1);
    expect(game.status).to.equal('wave');
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

  it('leaves a fire blast where an Asteroid hits Earth, bigger for bigger rocks', () => {
    const game = emptyGame();
    parkShip(game);
    keepWaveGoing(game);
    const { earth } = game;
    // One just above Earth, one just below
    game.asteroids.push(
      asteroid(game, 'small', earth.x, earth.y - earth.radius)
    );
    game.asteroids.push(
      asteroid(game, 'large', earth.x, earth.y + earth.radius)
    );
    step(game, 0.01);
    const [small, large] = game.impacts;
    expect(small.angle).to.be.closeTo(-Math.PI / 2, 1e-9);
    expect(large.angle).to.be.closeTo(Math.PI / 2, 1e-9);
    expect(large.radius).to.be.greaterThan(small.radius);
    step(game, IMPACT.time);
    expect(game.impacts).to.have.length(0);
  });

  it('lets the last blast finish before opening the Shop', () => {
    const game = emptyGame();
    parkShip(game);
    game.asteroids.push(asteroid(game, 'small', 400, 260));
    step(game, 0.01);
    expect(game.asteroids).to.have.length(0);
    expect(game.status).to.equal('wave');
    step(game, IMPACT.time);
    expect(game.status).to.equal('shop');
  });

  it('plays out the last blast after the game is over', () => {
    const game = emptyGame();
    parkShip(game);
    game.population = 0.2;
    game.asteroids.push(asteroid(game, 'small', 400, 300));
    step(game, 0.01);
    expect(game.status).to.equal('over');
    expect(game.impacts).to.have.length(1);
    step(game, IMPACT.time);
    expect(game.impacts).to.have.length(0);
  });

  it('shatters a shot Asteroid where it broke, then clears it', () => {
    const game = emptyGame();
    parkShip(game);
    keepWaveGoing(game);
    const rock = asteroid(game, 'small', 100, 300, 30, 0);
    game.asteroids.push(rock);
    game.shots.push({ from: 'ship', x: 100, y: 300, vx: 0, vy: 0, life: 1 });
    step(game, 0.01);
    expect(game.bursts).to.have.length(1);
    expect(game.bursts[0]).to.include({ kind: 'rock', vx: 30 });
    step(game, BURST.rock);
    expect(game.bursts).to.have.length(0);
  });

  it('breaks the Ship apart when an Asteroid hits it', () => {
    const game = emptyGame();
    keepWaveGoing(game);
    Object.assign(game.ship, { x: 100, y: 100, safeFor: 0 });
    game.asteroids.push(asteroid(game, 'small', 100, 100));
    step(game, 0.01);
    expect(game.ship.alive).to.be.false;
    expect(game.bursts.map((b) => b.kind)).to.deep.equal(['ship']);
    step(game, BURST.ship);
    expect(game.bursts).to.have.length(0);
  });

  it('lets the last shattered rock clear before opening the Shop', () => {
    const game = emptyGame();
    parkShip(game);
    game.asteroids.push(asteroid(game, 'small', 100, 300));
    game.shots.push({ from: 'ship', x: 100, y: 300, vx: 0, vy: 0, life: 1 });
    step(game, 0.01);
    expect(game.asteroids).to.have.length(0);
    expect(game.status).to.equal('wave');
    step(game, BURST.rock);
    expect(game.status).to.equal('shop');
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

  it("stops shots at Earth's surface", () => {
    const game = emptyGame();
    parkShip(game);
    keepWaveGoing(game);
    // Fired from the left, straight at Earth, with a rock on the far side
    game.asteroids.push(asteroid(game, 'small', 700, 300));
    game.shots.push({ from: 'ship', x: 300, y: 300, vx: 600, vy: 0, life: 9 });
    for (let i = 0; i < 60; i++) step(game, 0.01);
    expect(game.shots).to.have.length(0);
    expect(game.asteroids.find((a) => a.x > 600).hp).to.equal(1);
  });

  it('hits a small Asteroid even when a shot would skip past it in one step', () => {
    const game = emptyGame();
    parkShip(game);
    keepWaveGoing(game);
    game.asteroids.push(asteroid(game, 'small', 100, 100));
    // 50px in one step, from one side of the rock clean to the other
    game.shots.push({ from: 'ship', x: 75, y: 100, vx: 1000, vy: 0, life: 1 });
    step(game, 0.05);
    expect(game.asteroids).to.have.length(1);
    expect(game.ore).to.equal(ASTEROIDS.small.ore);
  });

  it('hits an Asteroid slightly outside its drawn edge', () => {
    const game = emptyGame();
    parkShip(game);
    keepWaveGoing(game);
    const rock = asteroid(game, 'small', 100, 100);
    game.asteroids.push(rock);
    game.shots.push({
      from: 'ship',
      x: 100,
      y: 100 + rock.radius * 1.15,
      vx: 0,
      vy: 0,
      life: 1,
    });
    step(game, 0.01);
    expect(game.asteroids).to.have.length(1);
  });

  it("keeps the Ship off Earth's surface", () => {
    const game = emptyGame();
    keepWaveGoing(game);
    Object.assign(game.ship, { x: 400, y: 200, vx: 0, vy: 400 });
    for (let i = 0; i < 40; i++) step(game, 0.02);
    const distance = Math.hypot(
      game.ship.x - game.earth.x,
      game.ship.y - game.earth.y
    );
    expect(distance).to.be.at.least(
      game.earth.radius + SHIP.radius * game.scale - 1e-6
    );
  });

  it("doesn't have Turrets aim through Earth", () => {
    const game = emptyGame();
    parkShip(game);
    game.owned.turret = 1; // sits on top of Earth
    game.asteroids.push(asteroid(game, 'small', 400, 420)); // below Earth
    step(game, 0.01);
    expect(game.shots.some((shot) => shot.from === 'turret')).to.be.false;
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
