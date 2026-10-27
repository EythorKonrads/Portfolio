// Draws a game onto the play field's canvas. Reads the game, never changes it.
import { SATELLITE, SHIP, SHOT } from './config';
import { drawEarth, readEarthColors } from './earth';
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

// The same stars every time for a given screen size
export function makeStars(width, height) {
  const random = createRandom(width * 7 + height);
  const count = Math.round((width * height) / 6000);
  return Array.from({ length: count }, () => ({
    x: random() * width,
    y: random() * height,
    radius: random() * 1.2 + 0.3,
    alpha: random() * 0.6 + 0.2,
  }));
}

function drawAsteroid(ctx, asteroid, colors) {
  // A lumpy outline that stays the same for each rock as it turns
  const random = createRandom(Math.floor(asteroid.seed * 1e9));
  const points = 9;
  ctx.save();
  ctx.translate(asteroid.x, asteroid.y);
  ctx.rotate(asteroid.rotation);
  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = asteroid.radius * (0.75 + random() * 0.35);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = colors.asteroid;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = colors.asteroidEdge;
  ctx.stroke();
  ctx.restore();
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

export function draw(ctx, game, colors, stars) {
  const { width, height, earth } = game;
  ctx.clearRect(0, 0, width, height);

  // The stars fade in after the Launch, so the hand-over isn't a jump
  const starAlpha = Math.min(1, game.time / 0.8 + (game.wave > 1 ? 1 : 0));
  ctx.fillStyle = colors.star;
  for (const star of stars) {
    ctx.globalAlpha = star.alpha * starAlpha;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawEarth(ctx, earth.x, earth.y, earth.radius, colors.earth);
  drawDefences(ctx, game, colors);
  for (const asteroid of game.asteroids) drawAsteroid(ctx, asteroid, colors);

  ctx.fillStyle = colors.shot;
  for (const shot of game.shots) {
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, SHOT.radius * game.scale, 0, Math.PI * 2);
    ctx.fill();
  }

  drawShip(ctx, game, colors);
}
