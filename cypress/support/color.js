// Color math for contrast checks, on rgb()/rgba() strings

const channels = (rgb) => rgb.match(/[\d.]+/g).map(Number);

// WCAG relative luminance
export const luminance = (rgb) =>
  channels(rgb)
    .slice(0, 3)
    .map((v) => v / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);

export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Paint `top` at `alpha` (times its own alpha, if any) over an opaque `bottom`
export const composite = (top, bottom, alpha = 1) => {
  const [tr, tg, tb, ta = 1] = channels(top);
  const a = ta * alpha;
  const mixed = [tr, tg, tb].map(
    (c, i) => c * a + channels(bottom)[i] * (1 - a)
  );
  return `rgb(${mixed.join(', ')})`;
};
