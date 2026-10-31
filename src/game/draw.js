// Draws a game onto the play field's canvas. Reads the game, never changes it.
// Anything that doesn't move (the stars, Earth, each rock's outline) is drawn
// once and reused, so a frame is mostly copying images.
import { SATELLITE, SHIP, SHOT } from './config';
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
    asteroid: read('--color-game-asteroid'),
    asteroidEdge: read('--color-game-asteroid-edge'),
    shot: read('--color-game-shot'),
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
  ctx.fillStyle = colors.asteroid;
  ctx.strokeStyle = colors.asteroidEdge;
  ctx.lineWidth = 1.5;
  for (const asteroid of game.asteroids) {
    const path = outline(asteroid);
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.rotation);
    ctx.fill(path);
    ctx.stroke(path);
    ctx.restore();
  }
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

function drawDefences(ctx, game, colors) {
  ctx.fillStyle = colors.defence;
  const turret = 4 * game.scale;
  for (const { x, y } of turretPositions(game)) {
    ctx.beginPath();
    ctx.arc(x, y, turret, 0, Math.PI * 2);
    ctx.fill();
  }
  const satellite = SATELLITE.radius * game.scale;
  for (const { x, y } of satellitePositions(game)) {
    ctx.fillRect(x - satellite * 2, y - 1, satellite * 4, 2); // solar panels
    ctx.beginPath();
    ctx.arc(x, y, satellite * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
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

  const size = earth.radius * 2 * GLOW;
  ctx.drawImage(
    earthImage(earth.radius, colors),
    earth.x - size / 2,
    earth.y - size / 2,
    size,
    size
  );

  drawDefences(ctx, game, colors);
  drawAsteroids(ctx, game, colors);

  ctx.fillStyle = colors.shot;
  for (const shot of game.shots) {
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, SHOT.radius * game.scale, 0, Math.PI * 2);
    ctx.fill();
  }

  drawShip(ctx, game, colors);
}
