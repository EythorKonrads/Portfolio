// Drawing (src/game/draw.js) on a real canvas. How it looks is for a person
// to judge; this checks that everything draws, at every stage, without
// throwing, and that the effects actually put pixels on the canvas.
import { BURST, IMPACT } from '../../src/game/config';
import { createGame } from '../../src/game/game';
import { draw, makeStars, pixelRatio, readColors } from '../../src/game/draw';

const SIZE = { width: 800, height: 600 };

const setup = () => {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE.width * pixelRatio();
  canvas.height = SIZE.height * pixelRatio();
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const colors = readColors(document.body);
  const game = createGame({ ...SIZE, seed: 1 });
  const stars = makeStars(SIZE.width, SIZE.height, colors);
  return { ctx, colors, game, stars };
};

// How much is drawn in a square around a point: the sum of its alpha values
const inkNear = (ctx, x, y, reach = 30) => {
  const r = pixelRatio();
  const { data } = ctx.getImageData(
    (x - reach) * r,
    (y - reach) * r,
    reach * 2 * r,
    reach * 2 * r
  );
  let sum = 0;
  for (let i = 3; i < data.length; i += 4) sum += data[i];
  return sum;
};

const effects = (t) => ({
  impacts: [{ angle: 1, radius: 30, seed: 0.3, age: t * IMPACT.time }],
  bursts: [
    {
      kind: 'rock',
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      radius: 20,
      angle: 0,
      seed: 0.4,
      age: t * BURST.rock,
    },
    {
      kind: 'ship',
      x: 300,
      y: 100,
      vx: 0,
      vy: 0,
      radius: 10,
      angle: 1,
      seed: 0.5,
      age: t * BURST.ship,
    },
  ],
});

describe('Game drawing', () => {
  it('reads every color it needs from the CSS variables', () => {
    const { colors } = setup();
    const { earth, ...rest } = colors;
    for (const [name, value] of Object.entries({ ...rest, ...earth })) {
      expect(value, name).to.not.equal('');
    }
  });

  it('draws blasts, shattered rocks and the wrecked Ship at every stage', () => {
    const { ctx, colors, game, stars } = setup();
    for (const t of [0, 0.1, 0.5, 0.99]) {
      Object.assign(game, effects(t));
      expect(() => draw(ctx, game, colors, stars, 0)).not.to.throw();
    }
  });

  it('draws normal and Armored Asteroids', () => {
    const { ctx, colors, game, stars } = setup();
    const rock = (size, x) => ({
      size,
      x,
      y: 100,
      vx: 0,
      vy: 0,
      radius: 30,
      hp: 1,
      spin: 0,
      rotation: 0,
      seed: 0.5,
    });
    game.asteroids = [rock('large', 100), rock('armored', 300)];
    draw(ctx, game, colors, stars, 0);
    expect(inkNear(ctx, 100, 100)).to.be.greaterThan(0);
    expect(inkNear(ctx, 300, 100)).to.be.greaterThan(0);
  });

  it('puts a shattered rock and a wrecked Ship on screen', () => {
    const { ctx, colors, game, stars } = setup();
    // Stars off, so any pixel there comes from the effects
    draw(ctx, game, colors, stars, 0);
    expect(inkNear(ctx, 100, 100)).to.equal(0);
    expect(inkNear(ctx, 300, 100)).to.equal(0);
    Object.assign(game, effects(0.05));
    draw(ctx, game, colors, stars, 0);
    expect(inkNear(ctx, 100, 100)).to.be.greaterThan(0);
    expect(inkNear(ctx, 300, 100)).to.be.greaterThan(0);
  });
});
