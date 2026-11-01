// The game's rules (src/game/game.js), driven directly with no drawing
import {
  ARMORED,
  ASTEROIDS,
  BURST,
  EXPLOSION,
  FIRST_SPAWN,
  IMPACT,
  LATE,
  PER_LEVEL,
  POPULATION_START,
  PRICE_GROWTH,
  SATELLITE,
  SHIP,
  SHOP_ITEMS,
  WAVE_BONUS,
  TURRET,
  WAVE_TITLE,
} from '../../src/game/config';
import {
  asteroidHp,
  buy,
  clusterSize,
  createGame,
  isEnded,
  isEnding,
  nextWave,
  price,
  satellitePositions,
  shotDamage,
  spawnInterval,
  startWave,
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

  it('explodes Earth when the last people die, and only then ends', () => {
    const game = emptyGame();
    parkShip(game);
    game.population = 0.2;
    game.asteroids.push(asteroid(game, 'small', 400, 300));
    const drifting = asteroid(game, 'small', 100, 100, 50, 0);
    game.asteroids.push(drifting);
    step(game, 0.01);
    expect(game.status).to.equal('over');
    expect(game.explosion).to.deep.equal({ age: 0 });
    expect(isEnded(game), 'still exploding').to.be.false;
    expect(isEnding(game)).to.be.true;
    // The other rocks drift on past
    const { x } = drifting;
    step(game, EXPLOSION.time / 2);
    expect(drifting.x).to.be.greaterThan(x);
    expect(isEnded(game)).to.be.false;
    step(game, EXPLOSION.time / 2);
    expect(isEnded(game)).to.be.true;
    expect(isEnding(game)).to.be.false;
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

  it('fires a quick tap of the fire key as soon as the cooldown ends', () => {
    const game = emptyGame();
    keepWaveGoing(game);
    const shipShots = () => game.shots.filter((s) => s.from === 'ship');
    step(game, 0.01, { fire: true });
    step(game, 0.01);
    // A tap while it's still cooling down, released straight away
    step(game, 0.01, { fire: true });
    step(game, 0.01);
    expect(shipShots()).to.have.length(1);
    for (let i = 0; i < 30; i++) step(game, 0.01);
    expect(shipShots()).to.have.length(2);
  });

  it('turns the Ship to where the joystick points and flies that way', () => {
    const game = emptyGame();
    keepWaveGoing(game);
    const { x } = game.ship;
    // The Ship starts pointing up; the stick points right
    for (let i = 0; i < 40; i++) step(game, 0.02, { heading: 0, push: 1 });
    expect(Math.cos(game.ship.angle)).to.be.greaterThan(0.9);
    expect(game.ship.x).to.be.greaterThan(x);
    // No auto-fire: shooting is the shoot button's job
    expect(game.shots).to.have.length(0);
  });

  it('thrusts harder the further the joystick is pushed, not at all near the middle', () => {
    const speedAfter = (push) => {
      const game = emptyGame();
      keepWaveGoing(game);
      for (let i = 0; i < 10; i++) {
        step(game, 0.02, { heading: -Math.PI / 2, push });
      }
      return Math.hypot(game.ship.vx, game.ship.vy);
    };
    expect(speedAfter(0.1), 'dead zone').to.equal(0);
    expect(speedAfter(1)).to.be.greaterThan(speedAfter(0.5));
    expect(speedAfter(0.5)).to.be.greaterThan(0);
  });

  context('later Waves', () => {
    const share = (wave, size) =>
      waveAsteroids(wave).filter((s) => s === size).length /
      waveAsteroids(wave).length;

    it('makes Asteroids tougher every Wave from Wave 6', () => {
      const hp = (wave) => asteroidHp({ wave }, 'large');
      expect(hp(5)).to.equal(ASTEROIDS.large.hp);
      expect(hp(6)).to.be.closeTo(ASTEROIDS.large.hp * 1.12, 1e-9);
      expect(hp(12)).to.be.greaterThan(hp(8));
    });

    it('gives new Asteroids, and their pieces, the toughness of the Wave', () => {
      const game = emptyGame();
      parkShip(game);
      keepWaveGoing(game);
      game.wave = 10;
      const rock = asteroid(game, 'medium', 100, 300);
      rock.hp = 0.1;
      game.asteroids.push(rock);
      game.shots.push({ from: 'ship', x: 100, y: 300, vx: 0, vy: 0, life: 1 });
      step(game, 0.01);
      const smalls = game.asteroids.filter((a) => a.size === 'small');
      expect(smalls[1].hp).to.equal(asteroidHp(game, 'small'));
    });

    it('keeps speeding up spawns after Wave 10, down to the floor', () => {
      expect(spawnInterval(11)).to.be.lessThan(spawnInterval(10));
      expect(spawnInterval(20)).to.be.lessThan(spawnInterval(15));
      expect(spawnInterval(60)).to.equal(LATE.spawnMin);
    });

    it('keeps shifting the mix towards large Asteroids after Wave 10', () => {
      expect(share(16, 'large')).to.be.greaterThan(share(10, 'large'));
    });

    it('sends Asteroids in clusters from one side from Wave 10', () => {
      expect(clusterSize(9)).to.equal(1);
      expect(clusterSize(10)).to.equal(2);
      expect(clusterSize(30)).to.equal(LATE.clusterMax);

      const game = createGame({ ...SIZE, seed: 3 });
      game.wave = 11;
      startWave(game); // Wave 12
      parkShip(game);
      while (!game.asteroids.length) step(game, 0.05);
      expect(game.asteroids).to.have.length(clusterSize(12));
      // All just off the same edge
      const edge = ({ x, y }) =>
        x < 0 ? 'left' : x > SIZE.width ? 'right' : y < 0 ? 'top' : 'bottom';
      expect(new Set(game.asteroids.map(edge)).size).to.equal(1);
    });

    it('brings in Armored Asteroids from Wave 20', () => {
      expect(waveAsteroids(19)).to.not.include('armored');
      expect(waveAsteroids(20)).to.include('armored');
      expect(share(40, 'armored')).to.be.at.most(ARMORED.maxShare + 0.05);
    });

    it("lets only the Ship's shots crack an Armored Asteroid", () => {
      const game = emptyGame();
      parkShip(game);
      keepWaveGoing(game);
      const armored = asteroid(game, 'armored', 100, 300);
      game.asteroids.push(armored);
      for (const from of ['turret', 'satellite']) {
        game.shots.push({ from, x: 100, y: 300, vx: 0, vy: 0, life: 1 });
      }
      step(game, 0.01);
      expect(game.shots, 'glanced off').to.have.length(0);
      expect(armored.hp).to.equal(ASTEROIDS.armored.hp);
      game.shots.push({ from: 'ship', x: 100, y: 300, vx: 0, vy: 0, life: 1 });
      step(game, 0.01);
      expect(armored.hp).to.be.lessThan(ASTEROIDS.armored.hp);
    });

    it("doesn't have Turrets aim at Armored Asteroids", () => {
      const game = emptyGame();
      parkShip(game);
      game.owned.turret = 1;
      game.asteroids.push(asteroid(game, 'armored', 400, 150));
      step(game, 0.01);
      expect(game.shots.some((shot) => shot.from === 'turret')).to.be.false;
    });

    it('breaks an Armored Asteroid into mediums', () => {
      const game = emptyGame();
      parkShip(game);
      keepWaveGoing(game);
      const armored = asteroid(game, 'armored', 100, 300);
      armored.hp = 0.1;
      game.asteroids.push(armored);
      game.shots.push({ from: 'ship', x: 100, y: 300, vx: 0, vy: 0, life: 1 });
      step(game, 0.01);
      const pieces = game.asteroids.filter((a) => a.size === 'medium');
      expect(pieces).to.have.length(2);
    });
  });

  context('upgrades', () => {
    it('makes every kind of shot stronger with each damage level', () => {
      const game = emptyGame();
      for (const [from, id] of [
        ['ship', 'shipWeapon'],
        ['turret', 'turretDamage'],
        ['satellite', 'satelliteDamage'],
      ]) {
        expect(shotDamage[from](game), from).to.equal(1);
        game.owned[id] = 2;
        expect(shotDamage[from](game), from).to.equal(1 + 2 * PER_LEVEL[id]);
      }
    });

    it('fires bigger Ship shots with each weapon level', () => {
      const shotSize = (weapon) => {
        const game = emptyGame();
        keepWaveGoing(game);
        game.owned.shipWeapon = weapon;
        step(game, 0.01, { fire: true });
        return game.shots.find((s) => s.from === 'ship').size;
      };
      expect(shotSize(2)).to.be.greaterThan(shotSize(0));
    });

    it('fires the Ship faster with each fire rate level', () => {
      const cooldown = (rate) => {
        const game = emptyGame();
        keepWaveGoing(game);
        game.owned.shipRate = rate;
        step(game, 0.01, { fire: true });
        return game.ship.cooldown;
      };
      expect(cooldown(0)).to.be.closeTo(SHIP.fireDelay, 1e-9);
      expect(cooldown(2)).to.be.closeTo(
        SHIP.fireDelay / (1 + 2 * PER_LEVEL.shipRate),
        1e-9
      );
    });

    it('speeds the Ship up with each engine level', () => {
      const speed = (engine) => {
        const game = emptyGame();
        keepWaveGoing(game);
        game.owned.shipEngine = engine;
        for (let i = 0; i < 10; i++) step(game, 0.05, { thrust: true });
        return Math.hypot(game.ship.vx, game.ship.vy);
      };
      expect(speed(3)).to.be.greaterThan(speed(0));
    });

    it('fires Turrets faster with each fire rate level', () => {
      const cooldown = (rate) => {
        const game = emptyGame();
        parkShip(game);
        game.owned.turret = 1;
        game.owned.turretRate = rate;
        game.asteroids.push(asteroid(game, 'small', 400, 150));
        step(game, 0.01);
        return game.turretCooldowns[0];
      };
      expect(cooldown(0)).to.be.closeTo(TURRET.fireDelay, 1e-9);
      expect(cooldown(2)).to.be.closeTo(
        TURRET.fireDelay / (1 + 2 * PER_LEVEL.turretRate),
        1e-9
      );
    });

    it('has Satellites fire at nearby Asteroids, faster with each level', () => {
      const cooldown = (rate) => {
        const game = emptyGame();
        parkShip(game);
        game.owned.satellite = 1;
        game.owned.satelliteRate = rate;
        // Just outside the Satellite, on the side away from Earth
        const [satellite] = satellitePositions(game);
        const dx = satellite.x - game.earth.x;
        const dy = satellite.y - game.earth.y;
        const out = 40 / Math.hypot(dx, dy);
        game.asteroids.push(
          asteroid(
            game,
            'small',
            satellite.x + dx * out,
            satellite.y + dy * out
          )
        );
        step(game, 0.01);
        expect(game.shots.some((s) => s.from === 'satellite')).to.be.true;
        return game.satelliteCooldowns[0];
      };
      expect(cooldown(0)).to.be.closeTo(SATELLITE.fireDelay, 1e-9);
      expect(cooldown(2)).to.be.closeTo(
        SATELLITE.fireDelay / (1 + 2 * PER_LEVEL.satelliteRate),
        1e-9
      );
    });
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
