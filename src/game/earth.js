// Earth's size and drawing, shared by Mini Earth on the page and the game,
// so the Launch hands over from one to the other without a visible jump.

// How far the atmosphere glow reaches, as a share of Earth's radius
export const GLOW = 1.35;

export function earthRadius(width, height) {
  return Math.round(Math.min(width, height) * 0.075);
}

// Rough continents in unit coordinates (Earth's radius is 1)
const CONTINENTS = [
  [
    [-0.7, -0.5],
    [-0.3, -0.75],
    [0.05, -0.55],
    [-0.05, -0.25],
    [-0.35, -0.1],
    [-0.45, 0.25],
    [-0.75, 0.05],
  ],
  [
    [0.2, -0.15],
    [0.55, -0.35],
    [0.8, -0.05],
    [0.65, 0.35],
    [0.35, 0.6],
    [0.2, 0.3],
  ],
  [
    [-0.25, 0.5],
    [0.05, 0.45],
    [0.1, 0.8],
    [-0.2, 0.85],
  ],
];

// The colors come from CSS variables; see readEarthColors
export function drawEarth(ctx, x, y, radius, colors) {
  ctx.save();
  ctx.translate(x, y);

  const glow = ctx.createRadialGradient(
    0,
    0,
    radius * 0.9,
    0,
    0,
    radius * GLOW
  );
  glow.addColorStop(0, colors.glow);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * GLOW, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = colors.ocean;
  ctx.fill();
  ctx.clip();

  ctx.fillStyle = colors.land;
  for (const shape of CONTINENTS) {
    ctx.beginPath();
    shape.forEach(([px, py], i) =>
      i
        ? ctx.lineTo(px * radius, py * radius)
        : ctx.moveTo(px * radius, py * radius)
    );
    ctx.closePath();
    ctx.fill();
  }

  // Shade the night side for a bit of roundness
  const shade = ctx.createLinearGradient(-radius, -radius, radius, radius);
  shade.addColorStop(0.45, 'transparent');
  shade.addColorStop(1, colors.shade);
  ctx.fillStyle = shade;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);

  ctx.restore();
}

export function readEarthColors(element) {
  const style = getComputedStyle(element);
  const read = (name) => style.getPropertyValue(name).trim();
  return {
    ocean: read('--color-game-ocean'),
    land: read('--color-game-land'),
    glow: read('--color-game-atmosphere'),
    shade: read('--color-game-shade'),
  };
}

// Draw Earth filling a <canvas> element, sharp on high-density screens
export function paintEarthCanvas(canvas, size) {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = size * ratio;
  canvas.height = size * ratio;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, size, size);
  // Leave room for the atmosphere glow around the globe
  drawEarth(ctx, size / 2, size / 2, size / 2 / GLOW, readEarthColors(canvas));
}
