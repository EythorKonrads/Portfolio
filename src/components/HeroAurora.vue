<template>
  <div class="hero-aurora" aria-hidden="true" data-cy="heroAurora">
    <div
      v-for="n in 3"
      :key="n"
      class="hero-aurora__band"
      :class="`hero-aurora__band--${n}`"
      data-cy="auroraBand"
    ></div>
  </div>
</template>

<style scoped>
/* At the top of the content column, so it scrolls away with the content. Its
   opacity caps how much it lightens the text's background, keeping 4.5:1. */
.hero-aurora {
  /* 1vw and 1vh, but no bigger than on a 1600x1000 screen. Past that, gaps
     between the lights would keep stretching while the rays and blur don't. */
  --aurora-vh: min(1vh, 10px);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  /* Room for all the bands, but never taller than short filtered content,
     which would make the column scroll */
  height: min(100%, calc(70 * var(--aurora-vh)));
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  opacity: 0.17;
}
.hero-aurora__band {
  position: absolute;
  left: -30%;
  width: 160%;
  height: calc(30 * var(--aurora-vh));
  /* On the band, not the curtain: a filter runs before the mask on the same
     element, which would leave the rays hard-edged */
  filter: blur(8px);
  transform: skewY(-4deg);
}
/* A curtain like the real thing: brightest green along a sharper lower edge,
   fading through teal to purple at the top, cut into rays */
.hero-aurora__band::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    var(--color-aurora-green) 10%,
    var(--color-aurora-teal) 35%,
    var(--color-aurora-purple) 75%,
    transparent
  );
  /* Faded ends, a lower edge and a top that fades out, then two sets of
     rays at different spacings so the pattern never looks regular */
  mask-image:
    linear-gradient(
      90deg,
      transparent,
      var(--color-black) 25%,
      var(--color-black) 75%,
      transparent
    ),
    linear-gradient(
      to top,
      transparent,
      var(--color-black) 8%,
      var(--color-black) 30%,
      transparent
    ),
    repeating-linear-gradient(
      90deg,
      var(--color-black) 0 4px,
      color-mix(in srgb, var(--color-black) 45%, transparent) 10px,
      var(--color-black) 17px
    ),
    repeating-linear-gradient(
      90deg,
      var(--color-black) 0 9px,
      color-mix(in srgb, var(--color-black) 58%, transparent) 18px,
      var(--color-black) 29px
    );
  mask-composite: intersect;
}
.hero-aurora__band--1 {
  top: calc(-5 * var(--aurora-vh));
}
.hero-aurora__band--2 {
  top: calc(10 * var(--aurora-vh));
}
.hero-aurora__band--3 {
  top: calc(25 * var(--aurora-vh));
}
/* Lighter on phones: two bands */
@media screen and (max-width: 600px),
  screen and (orientation: landscape) and (max-width: 739px) and (max-height: 500px) {
  .hero-aurora__band--2 {
    top: calc(14 * var(--aurora-vh));
  }
  .hero-aurora__band--3 {
    display: none;
  }
}
</style>
