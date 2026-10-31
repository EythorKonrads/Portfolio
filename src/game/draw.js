// Draws a game onto the play field's canvas. Reads the game, never changes it.
// Anything that doesn't move (the stars, Earth, each rock's outline) is drawn
// once and reused, so a frame is mostly copying images.
import { BURST, EXPLOSION, IMPACT, SATELLITE, SHIP, SHOT } from './config';
import { GLOW, drawEarth, readEarthColors } from './earth';
import { createRandom } from './random';
import { satellitePositions, turretPositions } from './game';

export function readColors(element) {
  const style = getComputedStyle(element);
  const read = (name) => style.getPropertyValue(name).trim();
  return {
    earth: readEarthColors(element),
    star: read('--color-game-star'),
    ship: read('--color-game-ship'),
    flame: read('--color-game-flame'),
    blastCore: read('--color-game-blast-core'),
    blast: read('--color-game-blast'),
    blastEdge: read('--color-game-blast-edge'),
    flash: read('--color-game-flash'),
    dust: read('--color-game-dust'),
    spark: read('--color-game-spark'),
    asteroid: read('--color-game-asteroid'),
    asteroidEdge: read('--color-game-asteroid-edge'),
    armor: read('--color-game-armor'),
    armorEdge: read('--color-game-armor-edge'),
    shot: read('--color-game-shot'),
    shotGlow: read('--color-game-shot-glow'),
    defence: read('--color-game-defence'),
  };
}

// Above 2x, the extra pixels cost far more than they show
export const pixelRatio = () => Math.min(2, window.devicePixelRatio || 1);

function sprite(width, height, paint) {
  const ratio = pixelRatio();
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * ratio);
  canvas.height = Math.ceil(height * ratio);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  paint(ctx);
  return canvas;
}

// The same stars every time for a given screen size, painted once
export function makeStars(width, height, colors) {
  const random = createRandom(width * 7 + height);
  const count = Math.round((width * height) / 6000);
  return sprite(width, height, (ctx) => {
    ctx.fillStyle = colors.star;
    for (let i = 0; i < count; i++) {
      ctx.globalAlpha = random() * 0.6 + 0.2;
      ctx.beginPath();
      ctx.arc(
        random() * width,
        random() * height,
        random() * 1.2 + 0.3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  });
}

let earthSprite = null;
function earthImage(radius, colors) {
  if (earthSprite?.radius !== radius) {
    const size = radius * 2 * GLOW;
    earthSprite = {
      radius,
      image: sprite(size, size, (ctx) =>
        drawEarth(ctx, size / 2, size / 2, radius, colors.earth)
      ),
    };
  }
  return earthSprite.image;
}

// A lumpy outline per rock, worked out the first time it's drawn
const outlines = new WeakMap();
function outline(asteroid) {
  if (!outlines.has(asteroid)) {
    const random = createRandom(Math.floor(asteroid.seed * 1e9));
    const points = 9;
    const path = new Path2D();
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = asteroid.radius * (0.75 + random() * 0.35);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      i ? path.lineTo(x, y) : path.moveTo(x, y);
    }
    path.closePath();
    outlines.set(asteroid, path);
  }
  return outlines.get(asteroid);
}

function drawAsteroids(ctx, game, colors) {
  for (const asteroid of game.asteroids) {
    const path = outline(asteroid);
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.rotation);
    if (asteroid.size === 'armored') {
      drawArmor(ctx, asteroid, path, colors);
    } else {
      ctx.fillStyle = colors.asteroid;
      ctx.strokeStyle = colors.asteroidEdge;
      ctx.lineWidth = 1.5;
      ctx.fill(path);
      ctx.stroke(path);
    }
    ctx.restore();
  }
}

// Plated in steel so it reads as unbreakable: a thick bright edge, an inner
// plate line, and rivets round it
function drawArmor(ctx, asteroid, path, colors) {
  ctx.fillStyle = colors.armor;
  ctx.strokeStyle = colors.armorEdge;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3.5;
  ctx.fill(path);
  ctx.stroke(path);
  ctx.save();
  ctx.scale(0.55, 0.55);
  ctx.lineWidth = 2 / 0.55;
  ctx.stroke(path);
  ctx.restore();
  ctx.fillStyle = colors.armorEdge;
  ctx.beginPath();
  const rivet = Math.max(1, asteroid.radius * 0.07);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * asteroid.radius * 0.72;
    const y = Math.sin(angle) * asteroid.radius * 0.72;
    ctx.moveTo(x + rivet, y);
    ctx.arc(x, y, rivet, 0, Math.PI * 2);
  }
  ctx.fill();
}

function drawShip(ctx, game, colors) {
  const { ship } = game;
  if (!ship.alive) return;
  // Blink while it can't be hit
  if (ship.safeFor > 0 && Math.floor(game.time * 8) % 2) return;
  const r = SHIP.radius * game.scale;
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  if (ship.thrusting) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.35);
    ctx.lineTo(-r * (1.3 + Math.random() * 0.4), 0);
    ctx.lineTo(-r * 0.7, r * 0.35);
    ctx.fillStyle = colors.flame;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(-r * 0.8, -r * 0.7);
  ctx.lineTo(-r * 0.5, 0);
  ctx.lineTo(-r * 0.8, r * 0.7);
  ctx.closePath();
  ctx.fillStyle = colors.ship;
  ctx.fill();
  ctx.restore();
}

// Turrets look like their Shop icon: a dome on Earth's surface, with a
// barrel that turns to whatever it's aiming at
function drawTurrets(ctx, game, colors) {
  const { earth } = game;
  const dome = 6 * game.scale;
  const barrel = 10 * game.scale;
  const turrets = turretPositions(game).map(({ x, y }, i) => {
    const outward = Math.atan2(y - earth.y, x - earth.x);
    return { x, y, outward, aim: game.turretAims[i] ?? outward };
  });
  ctx.strokeStyle = colors.defence;
  ctx.lineWidth = 2.5 * game.scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const { x, y, aim } of turrets) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(aim) * barrel, y + Math.sin(aim) * barrel);
  }
  ctx.stroke();
  ctx.fillStyle = colors.defence;
  ctx.beginPath();
  for (const { x, y, outward } of turrets) {
    ctx.moveTo(x, y);
    ctx.arc(x, y, dome, outward - Math.PI / 2, outward + Math.PI / 2);
  }
  ctx.fill();
}

function drawDefences(ctx, game, colors) {
  drawTurrets(ctx, game, colors);
  ctx.fillStyle = colors.defence;
  const satellite = SATELLITE.radius * game.scale;
  ctx.beginPath();
  for (const { x, y } of satellitePositions(game)) {
    ctx.rect(x - satellite * 2, y - 1, satellite * 4, 2); // solar panels
    ctx.moveTo(x + satellite * 0.7, y);
    ctx.arc(x, y, satellite * 0.7, 0, Math.PI * 2);
  }
  ctx.fill();
}

// One bright ball with a soft halo, so a fast shot reads as a single shot
function drawShots(ctx, game, colors) {
  const r = SHOT.radius * game.scale;
  for (const [color, base] of [
    [colors.shotGlow, r * 2.2],
    [colors.shot, r],
  ]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const shot of game.shots) {
      const radius = base * (shot.size ?? 1);
      ctx.moveTo(shot.x + radius, shot.y);
      ctx.arc(shot.x, shot.y, radius, 0, Math.PI * 2);
    }
    ctx.fill();
  }
}

// A fire blast where an Asteroid hit Earth: a fireball that swells and fades,
// a shock ring, and embers thrown out away from Earth. All of it scales with
// the rock that hit.
function drawImpacts(ctx, game, colors) {
  const { earth } = game;
  ctx.save();
  // Overlapping fire adds up to brighter fire
  ctx.globalCompositeOperation = 'lighter';
  for (const impact of game.impacts) {
    const t = impact.age / IMPACT.time;
    const fade = 1 - t;
    const grow = 1 - fade ** 3; // fast at first, then slowing
    const x = earth.x + Math.cos(impact.angle) * earth.radius;
    const y = earth.y + Math.sin(impact.angle) * earth.radius;
    const reach = impact.radius * IMPACT.reach;

    const r = reach * (0.35 + 0.65 * grow);
    const fire = ctx.createRadialGradient(x, y, 0, x, y, r);
    fire.addColorStop(0, colors.blastCore);
    fire.addColorStop(0.35, colors.blast);
    fire.addColorStop(1, colors.blastEdge);
    ctx.globalAlpha = fade;
    ctx.fillStyle = fire;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = fade * 0.6;
    ctx.strokeStyle = colors.blast;
    ctx.lineWidth = Math.max(1, impact.radius * 0.15 * fade);
    ctx.beginPath();
    ctx.arc(x, y, reach * 1.3 * grow, 0, Math.PI * 2);
    ctx.stroke();

    // The same embers every frame for a given hit; more for bigger rocks
    const random = createRandom(Math.floor(impact.seed * 1e9));
    const embers = Math.round(impact.radius / game.scale / 3) + 5;
    ctx.globalAlpha = fade;
    ctx.fillStyle = colors.flame;
    ctx.beginPath();
    for (let i = 0; i < embers; i++) {
      const angle = impact.angle + (random() - 0.5) * 2.4;
      const distance = reach * (0.6 + random() * 0.9) * grow;
      const size = impact.radius * (0.05 + random() * 0.07) * fade;
      const ex = x + Math.cos(angle) * distance;
      const ey = y + Math.sin(angle) * distance;
      ctx.moveTo(ex + size, ey);
      ctx.arc(ex, ey, size, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.restore();
}

// A shot Asteroid shatters: a quick flash where it broke, a puff of rock dust,
// and stone shards that spin away and fade
function drawRockBurst(ctx, burst, t, colors) {
  const { x, y, radius } = burst;
  const fade = 1 - t;
  const grow = 1 - fade ** 2;
  const random = createRandom(Math.floor(burst.seed * 1e9));

  if (t < 0.25) {
    ctx.globalAlpha = 1 - t / 0.25;
    ctx.fillStyle = colors.flash;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  const puff = radius * (0.8 + 1.2 * grow);
  const dust = ctx.createRadialGradient(x, y, 0, x, y, puff);
  dust.addColorStop(0, colors.dust);
  dust.addColorStop(1, 'transparent');
  ctx.globalAlpha = fade;
  ctx.fillStyle = dust;
  ctx.beginPath();
  ctx.arc(x, y, puff, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.asteroid;
  ctx.strokeStyle = colors.asteroidEdge;
  ctx.lineWidth = 1;
  const shards = Math.round(radius / 4) + 4;
  for (let i = 0; i < shards; i++) {
    const angle = (i / shards) * Math.PI * 2 + random() * 0.6;
    const distance = radius * (0.3 + (1.2 + random()) * grow);
    const size = radius * (0.15 + random() * 0.2);
    ctx.save();
    ctx.translate(
      x + Math.cos(angle) * distance,
      y + Math.sin(angle) * distance
    );
    ctx.rotate(angle + t * (random() - 0.5) * 12);
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.6, -size * (0.4 + random() * 0.4));
    ctx.lineTo(-size * 0.4, size * (0.4 + random() * 0.4));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// The Ship breaks up: its hull comes apart into the edges it's drawn with,
// which tumble away, with a flash ring and electrical sparks
function drawShipBurst(ctx, burst, t, colors) {
  const { x, y, radius: r, angle } = burst;
  const fade = 1 - t;
  const grow = 1 - fade ** 3;
  const random = createRandom(Math.floor(burst.seed * 1e9));

  ctx.globalAlpha = fade * 0.8;
  ctx.strokeStyle = colors.flash;
  ctx.lineWidth = Math.max(1, r * 0.2 * fade);
  ctx.beginPath();
  ctx.arc(x, y, r * (0.5 + 3 * grow), 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = fade;
  ctx.fillStyle = colors.spark;
  ctx.beginPath();
  for (let i = 0; i < 14; i++) {
    const a = random() * Math.PI * 2;
    const distance = r * (1 + random() * 3.5) * grow;
    const size = r * (0.08 + random() * 0.1) * fade;
    const sx = x + Math.cos(a) * distance;
    const sy = y + Math.sin(a) * distance;
    ctx.moveTo(sx + size, sy);
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
  }
  ctx.fill();

  // The hull's corners, as in drawShip
  const hull = [
    [r, 0],
    [-r * 0.8, -r * 0.7],
    [-r * 0.5, 0],
    [-r * 0.8, r * 0.7],
  ];
  ctx.strokeStyle = colors.ship;
  ctx.lineWidth = Math.max(1, r * 0.18);
  ctx.lineCap = 'round';
  hull.forEach((from, i) => {
    const to = hull[(i + 1) % hull.length];
    const mx = (from[0] + to[0]) / 2;
    const my = (from[1] + to[1]) / 2;
    const drift = Math.atan2(my, mx) + (random() - 0.5);
    const distance = r * (1 + random() * 2) * grow;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.translate(
      mx + Math.cos(drift) * distance,
      my + Math.sin(drift) * distance
    );
    ctx.rotate((random() - 0.5) * 8 * t);
    ctx.beginPath();
    ctx.moveTo(from[0] - mx, from[1] - my);
    ctx.lineTo(to[0] - mx, to[1] - my);
    ctx.stroke();
    ctx.restore();
  });
}

function drawBursts(ctx, game, colors) {
  ctx.save();
  for (const burst of game.bursts) {
    const t = burst.age / BURST[burst.kind];
    const moved = {
      ...burst,
      x: burst.x + burst.vx * burst.age,
      y: burst.y + burst.vy * burst.age,
    };
    if (burst.kind === 'rock') drawRockBurst(ctx, moved, t, colors);
    else drawShipBurst(ctx, moved, t, colors);
  }
  ctx.restore();
}

// Earth from its sprite. While it cracks open it shakes harder and harder.
function drawEarthImage(ctx, game, colors, progress) {
  const { earth } = game;
  const shake = earth.radius * 0.06 * (progress / EXPLOSION.crack);
  const size = earth.radius * 2 * GLOW;
  ctx.drawImage(
    earthImage(earth.radius, colors),
    earth.x - size / 2 + (Math.random() - 0.5) * shake,
    earth.y - size / 2 + (Math.random() - 0.5) * shake,
    size,
    size
  );
}

// Earth's end. First fire glows through cracks that spread across it. Then
// it bursts: a flash, a fireball and a shock wave, with chunks of Earth and
// embers flying apart. (Unlike a rock in space, Earth has air to burn.)
function drawEarthExplosion(ctx, game, colors, progress) {
  const { earth } = game;
  const R = earth.radius;
  // The same cracks and chunks every frame
  const random = createRandom(2024);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (progress < EXPLOSION.crack) {
    const c = progress / EXPLOSION.crack;
    const heat = ctx.createRadialGradient(
      earth.x,
      earth.y,
      0,
      earth.x,
      earth.y,
      R
    );
    heat.addColorStop(0, colors.blastCore);
    heat.addColorStop(0.5, colors.blast);
    heat.addColorStop(1, colors.blastEdge);
    ctx.globalAlpha = c * 0.7;
    ctx.fillStyle = heat;
    ctx.beginPath();
    ctx.arc(earth.x, earth.y, R, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = Math.min(1, c * 1.5);
    ctx.strokeStyle = colors.blastCore;
    ctx.lineWidth = Math.max(1, R * 0.05 * c);
    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      let angle = (i / 7) * Math.PI * 2 + random();
      let x = earth.x;
      let y = earth.y;
      ctx.moveTo(x, y);
      for (let step = 1; step <= 4; step++) {
        angle += (random() - 0.5) * 0.9;
        const reach = (R * step) / 4;
        if (reach > R * c) break;
        x = earth.x + Math.cos(angle) * reach;
        y = earth.y + Math.sin(angle) * reach;
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  const b = (progress - EXPLOSION.crack) / (1 - EXPLOSION.crack);
  const fade = 1 - b;
  const grow = 1 - fade ** 3;

  if (b < 0.2) {
    ctx.globalAlpha = 1 - b / 0.2;
    ctx.fillStyle = colors.flash;
    ctx.beginPath();
    ctx.arc(earth.x, earth.y, R * (1.1 + b * 5), 0, Math.PI * 2);
    ctx.fill();
  }

  const fireball = R * (1 + 1.6 * grow);
  const fire = ctx.createRadialGradient(
    earth.x,
    earth.y,
    0,
    earth.x,
    earth.y,
    fireball
  );
  fire.addColorStop(0, colors.blastCore);
  fire.addColorStop(0.4, colors.blast);
  fire.addColorStop(1, colors.blastEdge);
  ctx.globalAlpha = fade;
  ctx.fillStyle = fire;
  ctx.beginPath();
  ctx.arc(earth.x, earth.y, fireball, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = fade * 0.7;
  ctx.strokeStyle = colors.blast;
  ctx.lineWidth = Math.max(1, R * 0.1 * fade);
  ctx.beginPath();
  ctx.arc(earth.x, earth.y, R * (1 + 7 * grow), 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = fade;
  ctx.fillStyle = colors.flame;
  ctx.beginPath();
  for (let i = 0; i < 36; i++) {
    const angle = random() * Math.PI * 2;
    const distance = R * (1 + random() * 5) * grow;
    const size = R * (0.03 + random() * 0.05) * fade;
    const x = earth.x + Math.cos(angle) * distance;
    const y = earth.y + Math.sin(angle) * distance;
    ctx.moveTo(x + size, y);
    ctx.arc(x, y, size, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();

  // Wedge-shaped chunks of Earth, tumbling outward, fading at the end
  ctx.save();
  ctx.fillStyle = colors.earth.surface;
  ctx.strokeStyle = colors.earth.outline;
  ctx.lineWidth = Math.max(1, R * 0.05);
  ctx.lineJoin = 'round';
  ctx.globalAlpha = Math.min(1, fade * 2.5);
  const chunks = 12;
  for (let i = 0; i < chunks; i++) {
    const from = (i / chunks) * Math.PI * 2;
    const to = ((i + 1) / chunks) * Math.PI * 2;
    const mid = (from + to) / 2;
    const inner = R * (0.1 + random() * 0.3);
    const distance = R * (0.2 + (2 + random() * 2.5) * grow);
    const spin = (random() - 0.5) * 6 * b;
    ctx.save();
    ctx.translate(
      earth.x + Math.cos(mid) * distance,
      earth.y + Math.sin(mid) * distance
    );
    ctx.rotate(spin);
    // Corners relative to the chunk's middle, so it spins about itself
    const cx = Math.cos(mid) * R * 0.6;
    const cy = Math.sin(mid) * R * 0.6;
    const corner = (angle, r) => [
      Math.cos(angle) * r - cx,
      Math.sin(angle) * r - cy,
    ];
    ctx.beginPath();
    ctx.moveTo(...corner(mid, inner));
    ctx.lineTo(...corner(from, R * (0.85 + random() * 0.15)));
    ctx.lineTo(...corner(mid, R));
    ctx.lineTo(...corner(to, R * (0.85 + random() * 0.15)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// starAlpha fades the stars in after the Launch, so the hand-over isn't a jump
export function draw(ctx, game, colors, stars, starAlpha = 1) {
  const { width, height, earth } = game;
  const ratio = pixelRatio();
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.globalAlpha = starAlpha;
  ctx.drawImage(stars, 0, 0, width, height);
  ctx.globalAlpha = 1;

  // Earth, and what sits on and around it, until it bursts apart
  const progress = game.explosion ? game.explosion.age / EXPLOSION.time : null;
  if (progress === null || progress < EXPLOSION.crack) {
    drawEarthImage(ctx, game, colors, progress === null ? 0 : progress);
    drawDefences(ctx, game, colors);
  }
  if (progress !== null && progress < 1) {
    drawEarthExplosion(ctx, game, colors, progress);
  }
  drawAsteroids(ctx, game, colors);
  drawImpacts(ctx, game, colors);
  drawBursts(ctx, game, colors);
  drawShots(ctx, game, colors);
  drawShip(ctx, game, colors);
}
