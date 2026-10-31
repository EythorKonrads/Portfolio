// The game's rules, with no drawing or DOM: a game is a plain object that
// step() advances by a slice of time. Tests drive it directly.
import {
  ARMORED,
  ASTEROIDS,
  ASTEROID_HIT,
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
  SHOT,
  SPAWN_INTERVAL,
  SPLIT_COUNT,
  SPLITS_INTO,
  TOUGHER,
  TURRET,
  WAVE_BONUS,
  WAVE_SPEEDUP,
} from './config';
import { earthRadius } from './earth';
import { createRandom } from './random';

// Sizes scale with the screen so a phone isn't crowded
export function worldScale(width, height) {
  return Math.min(1.2, Math.max(0.6, Math.min(width, height) / 800));
}

export function createGame({ width, height, seed } = {}) {
  const game = {
    width,
    height,
    scale: worldScale(width, height),
    random: createRandom(seed),
    status: 'wave', // 'wave' | 'shop' | 'over'
    wave: 0,
    population: POPULATION_START,
    ore: 0,
    score: 0,
    time: 0,
    earth: {
      x: width / 2,
      y: height / 2,
      radius: earthRadius(width, height),
    },
    ship: null,
    asteroids: [],
    shots: [],
    // Fire blasts where Asteroids hit Earth, kept as an angle around Earth
    // so they stay put if the window is resized
    impacts: [],
    // Shattered Asteroids and the wrecked Ship. Space has no air to burn, so
    // these break apart rather than catch fire.
    bursts: [],
    owned: Object.fromEntries(Object.keys(SHOP_ITEMS).map((id) => [id, 0])),
    turretCooldowns: [],
    // Where each Turret's barrel points, for drawing
    turretAims: [],
    satelliteCooldowns: [],
    spawnQueue: [],
    spawnTimer: 0,
  };
  game.ship = newShip(game);
  startWave(game);
  return game;
}

function newShip(game) {
  const { earth } = game;
  return {
    x: earth.x,
    y: earth.y - earth.radius * 1.8,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2, // pointing up
    alive: true,
    respawnIn: 0,
    safeFor: SHIP.safeTime,
    cooldown: 0,
  };
}

// Smalls only at first, mediums from Wave 3, larges from Wave 5. From
// Wave 10 larges keep taking a bigger share, and from Wave 20 armored rocks
// join; both come out of the smalls' share.
function waveMix(wave) {
  if (wave <= 2) return { small: 1 };
  if (wave <= 4) return { small: 0.7, medium: 0.3 };
  const large = Math.min(
    LATE.largeMax,
    0.2 + LATE.largePerWave * Math.max(0, wave - LATE.from)
  );
  const armored =
    wave < ARMORED.from
      ? 0
      : Math.min(
          ARMORED.maxShare,
          ARMORED.share + ARMORED.perWave * (wave - ARMORED.from)
        );
  return { small: 0.5 - (large - 0.2) - armored, medium: 0.3, large, armored };
}

export function waveAsteroids(wave) {
  // Wave 1 gets one extra rock, so clearing it pays for a first upgrade
  const count = 4 + wave * 2 + (wave === 1 ? 1 : 0);
  const mix = waveMix(wave);
  const sizes = [];
  for (const [size, share] of Object.entries(mix)) {
    for (let i = 0; i < Math.round(count * share); i++) sizes.push(size);
  }
  return sizes;
}

export function startWave(game) {
  game.wave += 1;
  game.status = 'wave';
  // Shuffle so sizes arrive mixed, not in blocks
  const sizes = waveAsteroids(game.wave);
  for (let i = sizes.length - 1; i > 0; i--) {
    const j = Math.floor(game.random() * (i + 1));
    [sizes[i], sizes[j]] = [sizes[j], sizes[i]];
  }
  game.spawnQueue = sizes;
  game.spawnTimer = FIRST_SPAWN;
}

// Seconds between one spawn and the next, for a single rock
export function spawnInterval(wave) {
  const interval = Math.max(
    SPAWN_INTERVAL.min,
    SPAWN_INTERVAL.first - SPAWN_INTERVAL.perWave * (wave - 1)
  );
  if (wave < LATE.from) return interval;
  return Math.max(
    LATE.spawnMin,
    interval * LATE.spawnShrink ** (wave - LATE.from)
  );
}

// How many rocks arrive together from one side
export function clusterSize(wave) {
  if (wave < LATE.from) return 1;
  return Math.min(
    LATE.clusterMax,
    2 + Math.floor((wave - LATE.from) / LATE.clusterEvery)
  );
}

export function asteroidHp(game, size) {
  const waves = Math.max(0, game.wave - TOUGHER.from + 1);
  return ASTEROIDS[size].hp * (1 + TOUGHER.perWave * waves);
}

export function asteroidSpeed(game, size) {
  return (
    ASTEROIDS[size].speed * game.scale * (1 + WAVE_SPEEDUP * (game.wave - 1))
  );
}

function makeAsteroid(game, size, x, y, angle) {
  const speed = asteroidSpeed(game, size);
  return {
    size,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: ASTEROIDS[size].radius * game.scale,
    hp: asteroidHp(game, size),
    spin: (game.random() - 0.5) * 1.5,
    rotation: game.random() * Math.PI * 2,
    seed: game.random(),
  };
}

// The next rocks in the queue enter together, just off one random edge,
// spread a little along it and queued up behind each other. Returns how
// many came.
function spawnCluster(game) {
  const count = Math.min(clusterSize(game.wave), game.spawnQueue.length);
  const along = game.random();
  const side = Math.floor(game.random() * 4);
  for (let i = 0; i < count; i++) {
    const spread = (i - (count - 1) / 2) * 0.08;
    const at = Math.min(0.95, Math.max(0.05, along + spread));
    spawnAsteroid(game, game.spawnQueue.shift(), side, at, i);
  }
  return count;
}

// Enter just off an edge, aimed at Earth (give or take its radius). `behind`
// pushes it further out, so a cluster doesn't start on top of itself.
function spawnAsteroid(game, size, side, along, behind) {
  const { width, height, earth } = game;
  const radius = ASTEROIDS[size].radius * game.scale;
  const margin = radius + 5 + behind * radius * 2.5;
  let x;
  let y;
  switch (side) {
    case 0:
      [x, y] = [along * width, -margin];
      break;
    case 1:
      [x, y] = [width + margin, along * height];
      break;
    case 2:
      [x, y] = [along * width, height + margin];
      break;
    default:
      [x, y] = [-margin, along * height];
  }
  const aimX = earth.x + (game.random() - 0.5) * earth.radius;
  const aimY = earth.y + (game.random() - 0.5) * earth.radius;
  game.asteroids.push(
    makeAsteroid(game, size, x, y, Math.atan2(aimY - y, aimX - x))
  );
}

// Levels from the Shop
const level = (game, id) => game.owned[id];
export const shotDamage = {
  ship: (game) => 1 + PER_LEVEL.shipWeapon * level(game, 'shipWeapon'),
  turret: (game) => 1 + PER_LEVEL.turretDamage * level(game, 'turretDamage'),
  satellite: (game) =>
    1 + PER_LEVEL.satelliteDamage * level(game, 'satelliteDamage'),
};

// size only changes how big the shot is drawn
function fire(game, from, x, y, angle, speed, size = 1) {
  game.shots.push({
    from,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: SHOT.life,
    size,
  });
}

// input: { turn: -1..1, thrust: bool, fire: bool, target: {x, y} | null }
// A target (touch) steers the Ship towards it, thrusting, and fires.
function stepShip(game, dt, input) {
  const { ship } = game;
  if (!ship.alive) {
    ship.respawnIn -= dt;
    if (ship.respawnIn <= 0) game.ship = newShip(game);
    return;
  }
  ship.safeFor = Math.max(0, ship.safeFor - dt);
  ship.cooldown = Math.max(0, ship.cooldown - dt);

  const engine = 1 + PER_LEVEL.shipEngine * level(game, 'shipEngine');
  let turn = input.turn ?? 0;
  let thrust = !!input.thrust;
  // Holding the fire key keeps firing at the Ship's rate. A tap during the
  // cooldown waits for it, so a quick tap is never lost.
  const pressed = !!input.fire && !game.fireHeld;
  game.fireHeld = !!input.fire;
  if (pressed) ship.queuedShot = true;
  let firing = !!input.fire || ship.queuedShot;
  if (input.target) {
    const dx = input.target.x - ship.x;
    const dy = input.target.y - ship.y;
    const wanted = Math.atan2(dy, dx);
    const diff = Math.atan2(
      Math.sin(wanted - ship.angle),
      Math.cos(wanted - ship.angle)
    );
    turn = Math.max(-1, Math.min(1, diff * 4));
    // Ease off once there, rather than circling the finger
    thrust = Math.hypot(dx, dy) > 30 * game.scale;
    firing = true;
  }

  ship.angle += turn * SHIP.turnSpeed * dt;
  ship.thrusting = thrust;
  if (thrust) {
    ship.vx += Math.cos(ship.angle) * SHIP.thrust * engine * game.scale * dt;
    ship.vy += Math.sin(ship.angle) * SHIP.thrust * engine * game.scale * dt;
  }
  const drag = Math.max(0, 1 - SHIP.drag * dt);
  ship.vx *= drag;
  ship.vy *= drag;
  const maxSpeed = SHIP.maxSpeed * engine * game.scale;
  const speed = Math.hypot(ship.vx, ship.vy);
  if (speed > maxSpeed) {
    ship.vx *= maxSpeed / speed;
    ship.vy *= maxSpeed / speed;
  }
  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;
  keepInside(game, ship);
  keepOffEarth(game, ship);

  if (firing && ship.cooldown === 0) {
    ship.queuedShot = false;
    const rate = 1 + PER_LEVEL.shipRate * level(game, 'shipRate');
    ship.cooldown = SHIP.fireDelay / rate;
    const nose = SHIP.radius * game.scale;
    fire(
      game,
      'ship',
      ship.x + Math.cos(ship.angle) * nose,
      ship.y + Math.sin(ship.angle) * nose,
      ship.angle,
      SHOT.speed * game.scale,
      // A stronger weapon shows as a bigger ball
      1 + 0.3 * level(game, 'shipWeapon')
    );
  }
}

// The screen's edge is a wall: the Ship stops against it and slides along
export function keepInside(game, ship) {
  const r = SHIP.radius * game.scale;
  if (ship.x < r || ship.x > game.width - r) {
    ship.x = Math.min(game.width - r, Math.max(r, ship.x));
    ship.vx = 0;
  }
  if (ship.y < r || ship.y > game.height - r) {
    ship.y = Math.min(game.height - r, Math.max(r, ship.y));
    ship.vy = 0;
  }
}

// Earth is solid too: the Ship stops on its surface and slides around it,
// so it can never fire from inside it
export function keepOffEarth(game, ship) {
  const { earth } = game;
  const dx = ship.x - earth.x;
  const dy = ship.y - earth.y;
  const distance = Math.hypot(dx, dy) || 1;
  const surface = earth.radius + SHIP.radius * game.scale;
  if (distance >= surface) return;
  const nx = dx / distance;
  const ny = dy / distance;
  ship.x = earth.x + nx * surface;
  ship.y = earth.y + ny * surface;
  const inward = ship.vx * nx + ship.vy * ny;
  if (inward < 0) {
    ship.vx -= inward * nx;
    ship.vy -= inward * ny;
  }
}

// How close a shot came to a point on its way from where it was last step.
// Shots move several pixels a step, so checking only where they end up
// lets them skip clean through small Asteroids.
function closestApproach(shot, x, y) {
  const sx = shot.x - shot.px;
  const sy = shot.y - shot.py;
  const lengthSquared = sx * sx + sy * sy;
  const t = lengthSquared
    ? Math.max(
        0,
        Math.min(1, ((x - shot.px) * sx + (y - shot.py) * sy) / lengthSquared)
      )
    : 1;
  return Math.hypot(shot.px + sx * t - x, shot.py + sy * t - y);
}

// Defences only aim at what's on their side of Earth, since shots can't
// pass through it
function inSight(game, x, y, asteroid) {
  const { earth } = game;
  const facing =
    (asteroid.x - x) * (x - earth.x) + (asteroid.y - y) * (y - earth.y);
  return (
    facing > 0 || Math.hypot(x - earth.x, y - earth.y) > earth.radius * 1.5
  );
}

function nearestAsteroid(game, x, y, range) {
  let best = null;
  let bestDistance = range;
  for (const asteroid of game.asteroids) {
    // Their shots would only glance off armor
    if (ASTEROIDS[asteroid.size].armored) continue;
    if (!inSight(game, x, y, asteroid)) continue;
    const distance = Math.hypot(asteroid.x - x, asteroid.y - y);
    if (distance < bestDistance) {
      best = asteroid;
      bestDistance = distance;
    }
  }
  return best;
}

// Where an aimed shot meets a moving Asteroid (one step of lead is plenty)
function leadAngle(x, y, target, speed) {
  const time = Math.hypot(target.x - x, target.y - y) / speed;
  return Math.atan2(
    target.y + target.vy * time - y,
    target.x + target.vx * time - x
  );
}

export function turretPositions(game) {
  const { earth } = game;
  const count = game.owned.turret;
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / count;
    return {
      x: earth.x + Math.cos(angle) * earth.radius,
      y: earth.y + Math.sin(angle) * earth.radius,
    };
  });
}

export function satellitePositions(game) {
  const { earth } = game;
  const count = game.owned.satellite;
  const orbit = earth.radius * SATELLITE.orbit;
  return Array.from({ length: count }, (_, i) => {
    const angle = game.time * SATELLITE.orbitSpeed + (i * Math.PI * 2) / count;
    return {
      x: earth.x + Math.cos(angle) * orbit,
      y: earth.y + Math.sin(angle) * orbit,
    };
  });
}

function stepDefences(game, dt) {
  const rate = (id) => 1 + PER_LEVEL[id] * level(game, id);
  const groups = [
    [
      turretPositions(game),
      game.turretCooldowns,
      'turret',
      TURRET,
      rate('turretRate'),
    ],
    [
      satellitePositions(game),
      game.satelliteCooldowns,
      'satellite',
      SATELLITE,
      rate('satelliteRate'),
    ],
  ];
  for (const [positions, cooldowns, from, spec, speedup] of groups) {
    positions.forEach((position, i) => {
      cooldowns[i] = Math.max(0, (cooldowns[i] ?? 0) - dt);
      // Aim every step, not only when firing, so the barrel tracks its target
      const target = nearestAsteroid(
        game,
        position.x,
        position.y,
        spec.range * game.scale
      );
      if (!target) return;
      const speed = spec.shotSpeed * game.scale;
      const angle = leadAngle(position.x, position.y, target, speed);
      if (from === 'turret') game.turretAims[i] = angle;
      if (cooldowns[i] > 0) return;
      fire(game, from, position.x, position.y, angle, speed);
      cooldowns[i] = spec.fireDelay / speedup;
    });
  }
}

// Fully off screen and still heading away, so it can never come back.
// New Asteroids start off screen too, but heading in.
function hasLeft(game, asteroid) {
  const { x, y, vx, vy, radius } = asteroid;
  return (
    (x < -radius && vx <= 0) ||
    (x > game.width + radius && vx >= 0) ||
    (y < -radius && vy <= 0) ||
    (y > game.height + radius && vy >= 0)
  );
}

function stepEffects(game, dt) {
  const effects = [...game.impacts, ...game.bursts];
  if (game.explosion) effects.push(game.explosion);
  for (const effect of effects) effect.age += dt;
  game.impacts = game.impacts.filter((impact) => impact.age < IMPACT.time);
  game.bursts = game.bursts.filter((burst) => burst.age < BURST[burst.kind]);
}

// Drifts on with what broke apart. The seed keeps its pieces the same each
// frame without using the game's random numbers.
function addBurst(game, kind, thing, radius, angle = 0) {
  game.bursts.push({
    kind,
    x: thing.x,
    y: thing.y,
    vx: thing.vx,
    vy: thing.vy,
    radius,
    angle,
    seed: (thing.seed ?? game.time * 0.618) % 1,
    age: 0,
  });
}

function destroyAsteroid(game, asteroid) {
  const spec = ASTEROIDS[asteroid.size];
  addBurst(game, 'rock', asteroid, asteroid.radius);
  game.ore += spec.ore;
  game.score += spec.score;
  const smaller = SPLITS_INTO[asteroid.size];
  if (!smaller) return [];
  // The pieces fly apart, but keep heading roughly the same way
  const heading = Math.atan2(asteroid.vy, asteroid.vx);
  return Array.from({ length: SPLIT_COUNT }, (_, i) =>
    makeAsteroid(
      game,
      smaller,
      asteroid.x,
      asteroid.y,
      heading + (i - (SPLIT_COUNT - 1) / 2) * 0.8
    )
  );
}

// Once the game is lost, Earth's explosion plays out before the end screen
export function isEnded(game) {
  return (
    game.status === 'over' &&
    (!game.explosion || game.explosion.age >= EXPLOSION.time)
  );
}

// Something is still moving after game over: the explosion, a blast or a wreck
export function isEnding(game) {
  return (
    game.status === 'over' &&
    (!isEnded(game) || game.impacts.length + game.bursts.length > 0)
  );
}

export function step(game, dt, input = {}) {
  // After game over the effects play out, and the rocks drift on past
  if (game.status === 'over') {
    stepEffects(game, dt);
    for (const asteroid of game.asteroids) {
      asteroid.x += asteroid.vx * dt;
      asteroid.y += asteroid.vy * dt;
      asteroid.rotation += asteroid.spin * dt;
    }
    return;
  }
  if (game.status !== 'wave') return;
  game.time += dt;
  stepEffects(game, dt);

  // Spawning
  if (game.spawnQueue.length) {
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      // A cluster waits as long as its rocks would have one by one
      game.spawnTimer = spawnInterval(game.wave) * spawnCluster(game);
    }
  }

  stepShip(game, dt, input);
  stepDefences(game, dt);

  // Earth is solid: shots stop at its surface. Turrets fire from right on
  // it, so a shot only counts as inside once it's clearly past the edge.
  for (const shot of game.shots) {
    shot.px = shot.x;
    shot.py = shot.y;
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
    if (
      closestApproach(shot, game.earth.x, game.earth.y) <
      game.earth.radius - 2
    ) {
      shot.life = 0;
    }
  }
  for (const asteroid of game.asteroids) {
    asteroid.x += asteroid.vx * dt;
    asteroid.y += asteroid.vy * dt;
    asteroid.rotation += asteroid.spin * dt;
  }

  // Shots against Asteroids
  const pieces = [];
  for (const shot of game.shots) {
    if (shot.life <= 0) continue;
    for (const asteroid of game.asteroids) {
      if (asteroid.hp <= 0) continue;
      // A little more generous than the drawn rock, which is lumpy
      const reach = asteroid.radius * ASTEROID_HIT + SHOT.radius * game.scale;
      if (closestApproach(shot, asteroid.x, asteroid.y) > reach) continue;
      shot.life = 0;
      // Only the Ship's shots crack armor; the others glance off
      if (ASTEROIDS[asteroid.size].armored && shot.from !== 'ship') break;
      asteroid.hp -= shotDamage[shot.from](game);
      if (asteroid.hp <= 0) pieces.push(...destroyAsteroid(game, asteroid));
      break;
    }
  }

  // Asteroids against Earth and the Ship
  const { earth, ship } = game;
  for (const asteroid of game.asteroids) {
    if (asteroid.hp <= 0) continue;
    const toEarth = Math.hypot(asteroid.x - earth.x, asteroid.y - earth.y);
    if (toEarth < earth.radius + asteroid.radius * 0.6) {
      game.population = Math.max(
        0,
        game.population - ASTEROIDS[asteroid.size].damage
      );
      asteroid.hp = 0;
      game.impacts.push({
        angle: Math.atan2(asteroid.y - earth.y, asteroid.x - earth.x),
        radius: asteroid.radius,
        seed: asteroid.seed,
        age: 0,
      });
      continue;
    }
    if (
      ship.alive &&
      ship.safeFor === 0 &&
      Math.hypot(asteroid.x - ship.x, asteroid.y - ship.y) <
        asteroid.radius + SHIP.radius * game.scale * 0.7
    ) {
      ship.alive = false;
      ship.respawnIn = SHIP.respawnDelay;
      addBurst(game, 'ship', ship, SHIP.radius * game.scale, ship.angle);
    }
  }

  // Clear out what's gone: spent shots, destroyed Asteroids, and any that
  // left the screen after missing
  game.shots = game.shots.filter(
    (s) =>
      s.life > 0 &&
      s.x > -20 &&
      s.y > -20 &&
      s.x < game.width + 20 &&
      s.y < game.height + 20
  );
  game.asteroids = game.asteroids
    .filter((a) => a.hp > 0 && !hasLeft(game, a))
    .concat(pieces);

  if (game.population <= 0) {
    game.status = 'over';
    game.explosion = { age: 0 };
    game.shots = [];
  } else if (
    !game.spawnQueue.length &&
    !game.asteroids.length &&
    // Let the last blast or shattered rock finish before the Shop covers it
    !game.impacts.length &&
    !game.bursts.length
  ) {
    game.score += WAVE_BONUS * game.wave;
    game.status = 'shop';
  }
}

// The Shop

export function price(game, id) {
  return Math.round(SHOP_ITEMS[id].price * PRICE_GROWTH ** game.owned[id]);
}

// Why an item can't be bought right now, or null if it can
export function blockedReason(game, id) {
  const item = SHOP_ITEMS[id];
  if (game.owned[id] >= item.max) return 'max';
  if (item.needs && !game.owned[item.needs]) return 'needs';
  if (game.ore < price(game, id)) return 'ore';
  return null;
}

export function buy(game, id) {
  if (game.status !== 'shop' || blockedReason(game, id)) return false;
  game.ore -= price(game, id);
  game.owned[id] += 1;
  return true;
}

// The Ship starts each Wave fresh beside Earth
export function nextWave(game) {
  if (game.status !== 'shop') return;
  game.ship = newShip(game);
  game.shots = [];
  startWave(game);
}

// Keep Earth central and the Ship on screen when the window changes size
export function resize(game, width, height) {
  const dx = width / 2 - game.earth.x;
  const dy = height / 2 - game.earth.y;
  game.width = width;
  game.height = height;
  game.earth = {
    x: width / 2,
    y: height / 2,
    radius: earthRadius(width, height),
  };
  const things = [game.ship, ...game.asteroids, ...game.shots, ...game.bursts];
  for (const thing of things) {
    thing.x += dx;
    thing.y += dy;
  }
  keepInside(game, game.ship);
}
