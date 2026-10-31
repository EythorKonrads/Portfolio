// Every tuning number in one place. All are starting points for playtesting.

export const POPULATION_START = 8; // billions

// Per Asteroid size. Radius is at a scale of 1 (see worldScale).
export const ASTEROIDS = {
  // A big rock also pays out through its pieces, so its own Ore is small
  small: { radius: 10, hp: 1, speed: 70, damage: 0.3, ore: 3, score: 10 },
  medium: { radius: 20, hp: 3, speed: 55, damage: 1, ore: 4, score: 30 },
  large: { radius: 34, hp: 6, speed: 42, damage: 2.5, ore: 6, score: 80 },
  // From Wave 20 (see ARMORED): only the Ship's shots can crack it
  armored: {
    radius: 30,
    hp: 10,
    speed: 40,
    damage: 2.5,
    ore: 15,
    score: 150,
    armored: true,
  },
};
// The fire blast where an Asteroid hits Earth: how long it lasts, in seconds,
// and how far it reaches, times the rock's radius, so bigger rocks blast bigger
export const IMPACT = { time: 0.8, reach: 2.4 };
// How long, in seconds, a shattered Asteroid and a wrecked Ship take to clear
export const BURST = { rock: 0.6, ship: 1.2 };
// How far past its radius a shot still hits an Asteroid
export const ASTEROID_HIT = 1.25;
// What a destroyed Asteroid breaks into
export const SPLITS_INTO = {
  armored: 'medium',
  large: 'medium',
  medium: 'small',
  small: null,
};
export const SPLIT_COUNT = 2;

export const WAVE_BONUS = 100; // Score per Wave survived, times the Wave
export const WAVE_SPEEDUP = 0.08; // Extra Asteroid speed per Wave
export const SPAWN_INTERVAL = { first: 1.4, min: 0.45, perWave: 0.1 };
// Later Waves keep getting harder, so maxed-out upgrades don't make them
// easy. Rocks get tougher from Wave 6: +12% HP a Wave.
export const TOUGHER = { from: 6, perWave: 0.12 };
// From Wave 10 there's no ceiling: spawns keep speeding up (6% a Wave, down
// to one every 0.2 s), the mix keeps shifting to large rocks (+2% a Wave, up
// to 40%), and rocks come in clusters from one side, one more rock every 3
// Waves, up to 4
export const LATE = {
  from: 10,
  spawnShrink: 0.94,
  spawnMin: 0.2,
  largePerWave: 0.02,
  largeMax: 0.4,
  clusterEvery: 3,
  clusterMax: 4,
};
// Armored Asteroids join from Wave 20: 10% of the rocks, +1% a Wave, up to 25%
export const ARMORED = { from: 20, share: 0.1, perWave: 0.01, maxShare: 0.25 };
// Seconds the "Wave N" title shows at the start of a Wave. The first
// Asteroid only appears once it has gone.
export const WAVE_TITLE = 2;
export const FIRST_SPAWN = WAVE_TITLE + 0.3;

export const SHIP = {
  radius: 10,
  turnSpeed: 2.4, // radians per second
  thrust: 420,
  maxSpeed: 360,
  drag: 0.9, // share of speed lost per second
  fireDelay: 0.28,
  respawnDelay: 2,
  safeTime: 2,
};
export const SHOT = { speed: 620, life: 1.1, radius: 2.5 };

export const TURRET = { range: 340, fireDelay: 1.3, shotSpeed: 520 };
export const SATELLITE = {
  orbit: 2.3, // times Earth's radius
  orbitSpeed: 0.55,
  range: 240,
  fireDelay: 1.1,
  shotSpeed: 520,
  radius: 5,
};

// Upgrade levels change these
export const PER_LEVEL = {
  turretRate: 0.4, // fire rate +40% a level
  turretDamage: 0.5, // +0.5 damage a level
  shipRate: 0.35,
  shipEngine: 0.25, // thrust and top speed
  shipWeapon: 0.5, // +0.5 damage a level, and a bigger shot
  satelliteRate: 0.4,
  satelliteDamage: 0.5,
};

// The Shop. `max` caps units bought or levels reached; `info` is the tooltip.
export const SHOP_ITEMS = {
  turret: {
    label: 'Turret',
    price: 30,
    max: 4,
    info: 'Sits on Earth and fires at Asteroids that come close.',
  },
  turretRate: {
    label: 'Turret fire rate',
    price: 25,
    max: 3,
    needs: 'turret',
    info: 'Every Turret fires 40% faster a level.',
  },
  turretDamage: {
    label: 'Turret damage',
    price: 25,
    max: 3,
    needs: 'turret',
    info: 'Turret shots do 50% more damage a level.',
  },
  // Satellites cover all of Earth, not one side, so they cost more
  satellite: {
    label: 'Satellite',
    price: 45,
    max: 6,
    info: 'Orbits Earth and fires at Asteroids nearby. Asteroids pass straight through it.',
  },
  satelliteRate: {
    label: 'Satellite fire rate',
    price: 35,
    max: 3,
    needs: 'satellite',
    info: 'Every Satellite fires 40% faster a level.',
  },
  satelliteDamage: {
    label: 'Satellite damage',
    price: 35,
    max: 3,
    needs: 'satellite',
    info: 'Satellite shots do 50% more damage a level.',
  },
  shipRate: {
    label: 'Ship fire rate',
    price: 20,
    max: 3,
    info: 'The Ship fires 35% faster a level.',
  },
  shipWeapon: {
    label: 'Ship weapon',
    price: 30,
    max: 3,
    info: 'Bigger Ship shots that do 50% more damage a level, so tough Asteroids break sooner.',
  },
  shipEngine: {
    label: 'Ship engine',
    price: 20,
    max: 3,
    info: 'More thrust and a higher top speed.',
  },
};
export const PRICE_GROWTH = 1.8;
