<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';

const root = ref(null);
const isFollowing = ref(false);
let hero = null;
let lastPointer = null;
let frame = 0;

// One style update per frame, however fast the pointer moves
function onPointerMove(event) {
  lastPointer = event;
  isFollowing.value = true;
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const rect = hero.getBoundingClientRect();
    const x = (lastPointer.clientX - rect.left) / rect.width;
    const y = (lastPointer.clientY - rect.top) / rect.height;
    const style = root.value?.style;
    style?.setProperty('--aurora-x', `${x * 100}%`);
    style?.setProperty('--aurora-y', `${y * 100}%`);
    // -1 at the left edge to 1 at the right: the bands lean that way
    style?.setProperty('--aurora-lean', (x * 2 - 1).toFixed(3));
  });
}

function onPointerLeave() {
  isFollowing.value = false;
}

onMounted(() => {
  // Follow a mouse only: touch has no hover, and reduced motion means still
  const canFollow = window.matchMedia(
    '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
  ).matches;
  if (!canFollow) return;
  hero = root.value.parentElement;
  hero.addEventListener('pointermove', onPointerMove, { passive: true });
  hero.addEventListener('pointerleave', onPointerLeave, { passive: true });
});

onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  hero?.removeEventListener('pointermove', onPointerMove);
  hero?.removeEventListener('pointerleave', onPointerLeave);
});
</script>

<template>
  <div
    ref="root"
    class="hero-aurora"
    :class="{ 'hero-aurora--following': isFollowing }"
    aria-hidden="true"
    data-cy="heroAurora"
  >
    <!-- Each path carries its band slowly around the screen; the band itself
         ripples and leans on top of that -->
    <div
      v-for="n in 3"
      :key="n"
      class="hero-aurora__path"
      :class="`hero-aurora__path--${n}`"
      data-cy="auroraPath"
    >
      <div
        class="hero-aurora__band"
        :class="`hero-aurora__band--${n}`"
        data-cy="auroraBand"
      ></div>
    </div>
    <div class="hero-aurora__glow" data-cy="auroraGlow"></div>
  </div>
</template>

<style scoped>
/* Fixed behind the whole page (.home is its stacking context), so it stays
   put whichever element scrolls. Its opacity caps how much it lightens the
   text's background, keeping 4.5:1. */
.hero-aurora {
  --aurora-x: 50%;
  --aurora-y: 30%;
  --aurora-lean: 0;
  /* 1vw and 1vh, but no bigger than on a 1600x1000 screen. Past that, gaps
     between the lights would keep stretching while the rays and blur don't. */
  --aurora-vw: min(1vw, 16px);
  --aurora-vh: min(1vh, 10px);
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  opacity: 0.1;
}
/* Slow wander around the screen, each band on its own path and pace, so the
   aurora never settles in one place */
.hero-aurora__path {
  position: absolute;
  inset: 0;
  animation: hero-aurora-wander-1 80s ease-in-out infinite alternate;
}
.hero-aurora__path--2 {
  animation-name: hero-aurora-wander-2;
  animation-duration: 105s;
  animation-delay: -40s;
}
.hero-aurora__path--3 {
  animation-name: hero-aurora-wander-3;
  animation-duration: 130s;
  animation-delay: -75s;
}
@keyframes hero-aurora-wander-1 {
  0% {
    transform: translate(0, 0);
  }
  30% {
    transform: translate(
      calc(28 * var(--aurora-vw)),
      calc(45 * var(--aurora-vh))
    );
  }
  65% {
    transform: translate(
      calc(-24 * var(--aurora-vw)),
      calc(78 * var(--aurora-vh))
    );
  }
  100% {
    transform: translate(
      calc(14 * var(--aurora-vw)),
      calc(10 * var(--aurora-vh))
    );
  }
}
@keyframes hero-aurora-wander-2 {
  0% {
    transform: translate(0, calc(55 * var(--aurora-vh)));
  }
  40% {
    transform: translate(
      calc(-30 * var(--aurora-vw)),
      calc(-5 * var(--aurora-vh))
    );
  }
  75% {
    transform: translate(
      calc(20 * var(--aurora-vw)),
      calc(35 * var(--aurora-vh))
    );
  }
  100% {
    transform: translate(
      calc(-12 * var(--aurora-vw)),
      calc(72 * var(--aurora-vh))
    );
  }
}
@keyframes hero-aurora-wander-3 {
  0% {
    transform: translate(0, calc(30 * var(--aurora-vh)));
  }
  35% {
    transform: translate(
      calc(26 * var(--aurora-vw)),
      calc(60 * var(--aurora-vh))
    );
  }
  70% {
    transform: translate(
      calc(-28 * var(--aurora-vw)),
      calc(-15 * var(--aurora-vh))
    );
  }
  100% {
    transform: translate(
      calc(16 * var(--aurora-vw)),
      calc(45 * var(--aurora-vh))
    );
  }
}
.hero-aurora__band {
  position: absolute;
  left: -30%;
  width: 160%;
  /* Narrow curtains, so there's still dark sky for the cursor glow to light
     up */
  height: calc(30 * var(--aurora-vh));
  /* On the band, not the curtain: a filter runs before the mask on the same
     element, which would leave the rays hard-edged */
  filter: blur(8px);
  animation: hero-aurora-drift 26s ease-in-out infinite alternate;
  transition: translate 1s ease-out;
}
/* A curtain like the real thing: brightest green along a sharper lower edge,
   fading through teal to purple at the top, cut into shimmering rays */
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
  animation: hero-aurora-rays 28s linear infinite;
}
.hero-aurora__band--1 {
  top: calc(-5 * var(--aurora-vh));
}
.hero-aurora__band--2 {
  top: calc(10 * var(--aurora-vh));
  animation-duration: 34s;
  animation-delay: -12s;
}
.hero-aurora__band--3 {
  top: calc(25 * var(--aurora-vh));
  animation-duration: 42s;
  animation-delay: -20s;
  animation-direction: alternate-reverse;
}
.hero-aurora--following .hero-aurora__band {
  translate: calc(var(--aurora-lean) * 4%) 0;
}
.hero-aurora__glow {
  position: absolute;
  left: var(--aurora-x);
  top: var(--aurora-y);
  width: min(28vw, 360px);
  aspect-ratio: 1;
  translate: -50% -50%;
  /* A solid core, so the small spot still reads clearly */
  background: radial-gradient(
    circle,
    var(--color-aurora-green) 25%,
    transparent 70%
  );
  opacity: 0;
  transition:
    opacity 0.8s ease,
    left 0.3s ease-out,
    top 0.3s ease-out;
}
.hero-aurora--following .hero-aurora__glow {
  opacity: 1;
}
@keyframes hero-aurora-drift {
  from {
    transform: translateX(-18%) skewY(-6deg) scaleY(0.8);
  }
  to {
    transform: translateX(18%) skewY(4deg) scaleY(1.15);
  }
}
/* The two ray sets slide opposite ways, so the rays flicker as they cross */
@keyframes hero-aurora-rays {
  to {
    mask-position:
      0 0,
      0 0,
      170px 0,
      -290px 0;
  }
}
/* Lighter on phones: two bands, slower */
@media screen and (max-width: 600px),
  screen and (orientation: landscape) and (max-width: 739px) and (max-height: 500px) {
  .hero-aurora__band {
    animation-duration: 40s;
  }
  .hero-aurora__band--2 {
    top: calc(14 * var(--aurora-vh));
    animation-duration: 52s;
  }
  .hero-aurora__band--3 {
    display: none;
  }
  .hero-aurora__path {
    animation-duration: 110s;
  }
  .hero-aurora__path--2 {
    animation-duration: 140s;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hero-aurora__path {
    animation: none;
  }
  .hero-aurora__band {
    animation: none;
    transform: skewY(-4deg);
  }
  .hero-aurora__band::before {
    animation: none;
  }
  .hero-aurora__glow {
    display: none;
  }
}
</style>
