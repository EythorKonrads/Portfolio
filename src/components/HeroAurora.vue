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
    <div
      class="hero-aurora__band hero-aurora__band--1"
      data-cy="auroraBand"
    ></div>
    <div
      class="hero-aurora__band hero-aurora__band--2"
      data-cy="auroraBand"
    ></div>
    <div
      class="hero-aurora__band hero-aurora__band--3"
      data-cy="auroraBand"
    ></div>
    <div class="hero-aurora__glow" data-cy="auroraGlow"></div>
  </div>
</template>

<style scoped>
/* Sits behind the hero's content (the hero is its stacking context). Its
   opacity caps how much it lightens the text's background, keeping 4.5:1. */
.hero-aurora {
  --aurora-x: 50%;
  --aurora-y: 30%;
  --aurora-lean: 0;
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  opacity: 0.16;
}
.hero-aurora__band {
  position: absolute;
  left: -30%;
  width: 160%;
  height: 40%;
  border-radius: 50%;
  filter: blur(40px);
  background: linear-gradient(
    90deg,
    transparent,
    var(--color-aurora-green) 30%,
    var(--color-aurora-teal) 65%,
    transparent
  );
  animation: hero-aurora-drift 26s ease-in-out infinite alternate;
  transition: translate 1.5s ease-out;
}
.hero-aurora__band--1 {
  top: -8%;
}
.hero-aurora__band--2 {
  top: 14%;
  background: linear-gradient(
    90deg,
    transparent,
    var(--color-aurora-teal) 35%,
    var(--color-aurora-green) 70%,
    transparent
  );
  animation-duration: 34s;
  animation-delay: -12s;
}
.hero-aurora__band--3 {
  top: 36%;
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
  width: 70%;
  aspect-ratio: 1;
  translate: -50% -50%;
  background: radial-gradient(
    circle,
    var(--color-aurora-green),
    transparent 70%
  );
  opacity: 0;
  transition:
    opacity 0.8s ease,
    left 1.2s ease-out,
    top 1.2s ease-out;
}
.hero-aurora--following .hero-aurora__glow {
  opacity: 0.7;
}
@keyframes hero-aurora-drift {
  from {
    transform: translateX(-12%) skewY(-6deg) scaleY(0.8);
  }
  to {
    transform: translateX(12%) skewY(4deg) scaleY(1.15);
  }
}
/* Lighter on phones: two bands, slower, less blur to paint */
@media screen and (max-width: 600px) {
  .hero-aurora__band {
    height: 55%;
    filter: blur(28px);
    animation-duration: 40s;
  }
  .hero-aurora__band--2 {
    top: 30%;
    animation-duration: 52s;
  }
  .hero-aurora__band--3 {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hero-aurora__band {
    animation: none;
    transform: skewY(-4deg);
  }
  .hero-aurora__glow {
    display: none;
  }
}
</style>
