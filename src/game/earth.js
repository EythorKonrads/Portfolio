// Earth's size and drawing, shared by Mini Earth on the page and the game,
// so the Launch hands over from one to the other without a visible jump.

// How far the atmosphere glow reaches, as a share of Earth's radius
export const GLOW = 1.35;

export function earthRadius(width, height) {
  return Math.round(Math.min(width, height) * 0.075);
}

// Rough continents in unit coordinates (Earth's radius is 1), seen from
// over the Atlantic: the Americas on the left, Europe and Africa on the right
const CONTINENTS = [
  [
    [-0.75, -0.55],
    [-0.45, -0.75],
    [-0.15, -0.7],
    [-0.1, -0.5],
    [-0.3, -0.35],
    [-0.35, -0.15],
    [-0.5, -0.05],
    [-0.65, -0.25],
  ],
  [
    [-0.4, 0.05],
    [-0.15, 0.15],
    [-0.1, 0.35],
    [-0.25, 0.7],
    [-0.35, 0.8],
    [-0.4, 0.45],
  ],
  [
    [-0.2, -0.9],
    [0, -0.88],
    [-0.05, -0.75],
    [-0.2, -0.78],
  ],
  [
    [0.15, -0.7],
    [0.45, -0.75],
    [0.55, -0.5],
    [0.3, -0.4],
    [0.15, -0.5],
  ],
  [
    [0.15, -0.3],
    [0.5, -0.32],
    [0.65, 0],
    [0.5, 0.35],
    [0.4, 0.6],
    [0.3, 0.45],
    [0.2, 0.1],
    [0.08, -0.05],
  ],
];

// A smooth closed outline through the midpoints between the corners
function traceShape(ctx, shape, radius) {
  const point = (i) => shape[(i + shape.length) % shape.length];
  const mid = (a, b) => [
    ((a[0] + b[0]) / 2) * radius,
    ((a[1] + b[1]) / 2) * radius,
  ];
  ctx.beginPath();
  ctx.moveTo(...mid(point(-1), point(0)));
  shape.forEach((corner, i) =>
    ctx.quadraticCurveTo(
      corner[0] * radius,
      corner[1] * radius,
      ...mid(corner, point(i + 1))
    )
  );
  ctx.closePath();
}

// Outlines only, in the portfolio's colors. The colors come from CSS
// variables; see readEarthColors.
export function drawEarth(ctx, x, y, radius, colors) {
  ctx.save();
  ctx.translate(x, y);

  const glow = ctx.createRadialGradient(0, 0, radius, 0, 0, radius * GLOW);
  glow.addColorStop(0, colors.glow);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * GLOW, 0, Math.PI * 2);
  ctx.fill();

  // A dark disc, so stars and the Aurora don't show through Earth
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = colors.surface;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1, radius * 0.045);
  ctx.strokeStyle = colors.land;
  for (const shape of CONTINENTS) {
    traceShape(ctx, shape, radius);
    ctx.stroke();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1.5, radius * 0.06);
  ctx.strokeStyle = colors.outline;
  ctx.stroke();

  ctx.restore();
}

export function readEarthColors(element) {
  const style = getComputedStyle(element);
  const read = (name) => style.getPropertyValue(name).trim();
  return {
    surface: read('--color-game-earth'),
    outline: read('--color-game-earth-outline'),
    land: read('--color-game-land'),
    glow: read('--color-game-atmosphere'),
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
