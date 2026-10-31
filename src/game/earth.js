// Earth's size and drawing, shared by Mini Earth on the page and the game,
// so the Launch hands over from one to the other without a visible jump.

// How far the atmosphere glow reaches, as a share of Earth's radius
export const GLOW = 1.35;

export function earthRadius(width, height) {
  return Math.round(Math.min(width, height) * 0.075);
}

// Rough coastlines as [longitude, latitude] in degrees: few points and
// straight edges, so they read as real continents, not smooth blobs
// prettier-ignore
const COASTLINES = {
  northAmerica: [
    [-168, 66], [-162, 70], [-156, 71], [-140, 70], [-128, 70], [-115, 68],
    [-95, 72], [-85, 70], [-80, 63], [-90, 57], [-82, 52], [-78, 59],
    [-70, 61], [-64, 59], [-56, 52], [-60, 47], [-66, 44], [-70, 42],
    [-74, 40], [-76, 35], [-81, 31], [-80, 25], [-83, 29], [-89, 30],
    [-94, 29], [-97, 26], [-97, 21], [-95, 18], [-90, 21], [-87, 21],
    [-88, 16], [-84, 15], [-83, 10], [-79, 9], [-80, 7], [-85, 10], [-87, 13],
    [-92, 15], [-97, 16], [-105, 20], [-106, 23], [-112, 29], [-110, 23],
    [-115, 30], [-117, 33], [-121, 35], [-124, 40], [-124, 46], [-127, 51],
    [-134, 58], [-146, 61], [-152, 59], [-158, 57], [-165, 61],
  ],
  southAmerica: [
    [-77, 8], [-72, 12], [-64, 10], [-60, 8], [-52, 5], [-50, 0], [-44, -2],
    [-35, -5], [-35, -9], [-39, -13], [-39, -18], [-41, -22], [-45, -23],
    [-48, -26], [-49, -29], [-53, -34], [-58, -35], [-57, -38], [-62, -39],
    [-65, -42], [-64, -47], [-68, -50], [-69, -52], [-68, -55], [-71, -54],
    [-74, -50], [-74, -44], [-73, -37], [-71, -30], [-70, -18], [-76, -14],
    [-81, -6], [-80, -2], [-80, 1], [-77, 4],
  ],
  greenland: [
    [-73, 78], [-60, 82], [-35, 83], [-20, 82], [-18, 77], [-22, 70],
    [-32, 68], [-42, 60], [-48, 61], [-52, 65], [-54, 70], [-58, 75],
    [-66, 76],
  ],
  iceland: [
    [-24, 65], [-14, 65], [-14, 66.5], [-22, 66.5],
  ],
  cuba: [
    [-85, 22], [-80, 23], [-74, 20], [-78, 20],
  ],
  europe: [
    [-9, 43], [-9, 37], [-6, 36], [-1, 37], [3, 42], [7, 43.5], [9, 44],
    [12, 42], [15.5, 38], [16.5, 39], [18.5, 40], [15, 42], [13, 45.5],
    [19, 42], [23, 37], [26, 40], [29, 41], [28, 44], [30, 46], [35, 45],
    [40, 47], [40, 60], [32, 70], [28, 71], [20, 70], [14, 67], [5, 62],
    [5, 58], [8, 58], [11, 59], [12, 56], [10, 57], [8, 55], [8, 54], [4, 52],
    [2, 51], [-2, 48], [-5, 48], [-1, 46], [-2, 43.5],
  ],
  britain: [
    [-5, 50], [1, 51], [2, 53], [-1, 55], [-3, 58.5], [-6, 58], [-5, 55],
    [-3, 54], [-4.5, 52],
  ],
  ireland: [
    [-10, 52], [-6, 52], [-6, 55], [-8, 55.3], [-10, 54],
  ],
  africa: [
    [-17, 21], [-13, 27], [-10, 30], [-9, 33], [-6, 36], [0, 36], [10, 37],
    [11, 33], [20, 31], [25, 32], [32, 31], [35, 28], [39, 22], [43, 12],
    [51, 12], [51, 10], [48, 5], [41, -2], [40, -10], [40, -16], [35, -24],
    [33, -28], [28, -33], [20, -35], [18, -32], [15, -27], [12, -17],
    [13, -11], [9, -1], [9, 4], [5, 6], [-1, 5], [-8, 4], [-13, 8], [-17, 14],
  ],
  madagascar: [
    [44, -25], [47, -25], [50, -15], [49, -12], [44, -17],
  ],
};

// Seen from over the Atlantic: the Americas on the left, Europe and Africa
// on the right
const VIEW = { longitude: -35, latitude: 15 };

// Orthographic projection to unit coordinates (Earth's radius is 1, y down).
// Points round the back are pulled onto the rim, which the clip then hides.
function project([longitude, latitude]) {
  const rad = Math.PI / 180;
  const lambda = (longitude - VIEW.longitude) * rad;
  const phi = latitude * rad;
  const phi0 = VIEW.latitude * rad;
  let x = Math.cos(phi) * Math.sin(lambda);
  let y =
    Math.cos(phi0) * Math.sin(phi) -
    Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda);
  const facing =
    Math.sin(phi0) * Math.sin(phi) +
    Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda);
  if (facing < 0) {
    const length = Math.hypot(x, y) || 1;
    x /= length;
    y /= length;
  }
  return [x, -y];
}

const CONTINENTS = Object.values(COASTLINES).map((coast) => coast.map(project));

function traceShape(ctx, shape, radius) {
  ctx.beginPath();
  shape.forEach(([x, y], i) =>
    i ? ctx.lineTo(x * radius, y * radius) : ctx.moveTo(x * radius, y * radius)
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
