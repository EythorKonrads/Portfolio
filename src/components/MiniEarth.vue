<script setup>
import { defineAsyncComponent, nextTick, onMounted, ref } from 'vue';
import { GLOW, earthRadius, paintEarthCanvas } from '@/game/earth';

// The game's code only downloads once someone shows interest
let gameModule = null;
const loadGame = () => (gameModule ??= import('./GameScreen.vue'));
const GameScreen = defineAsyncComponent(loadGame);

// Two roots (the button and the teleported game), so classes go on the button
defineOptions({ inheritAttrs: false });

const PHOTO_SIZE = 100;
const LAUNCH_MS = 900;

const button = ref(null);
const globe = ref(null);
const launchGlobe = ref(null);
const isTakingOver = ref(false);
const isLaunching = ref(false);
const isPlaying = ref(false);
const launchStyle = ref({});

onMounted(() => paintEarthCanvas(globe.value, PHOTO_SIZE * GLOW));

function startTakeover() {
  isTakingOver.value = true;
  loadGame();
}

function stopTakeover() {
  if (!isLaunching.value) isTakingOver.value = false;
}

// Keep the page behind the game out of reach: no focus, no scrolling
function lockPage(locked) {
  document.getElementById('app')?.toggleAttribute('inert', locked);
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}

// The Launch: Earth glides from wherever it is now to the middle of the
// screen, at exactly the size the game draws it, while the game loads
async function launch() {
  if (isLaunching.value || isPlaying.value) return;
  const from = globe.value.getBoundingClientRect();
  const { innerWidth: width, innerHeight: height } = window;
  const size = earthRadius(width, height) * 2 * GLOW;
  const left = (width - size) / 2;
  const top = (height - size) / 2;

  isLaunching.value = true;
  lockPage(true);
  // Start drawn at its final place, then moved back over the page's Earth
  launchStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${size}px`,
    height: `${size}px`,
    transform: `translate(${from.left - left}px, ${from.top - top}px) scale(${from.width / size})`,
    transition: 'none',
  };
  await nextTick();
  paintEarthCanvas(launchGlobe.value, size);
  // Let the browser lay out the start before gliding away from it
  launchGlobe.value.getBoundingClientRect();
  launchStyle.value = {
    ...launchStyle.value,
    transform: 'none',
    transition: `transform ${LAUNCH_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`,
  };

  await Promise.all([
    new Promise((resolve) => setTimeout(resolve, LAUNCH_MS)),
    loadGame(),
  ]);
  isPlaying.value = true;
}

// The game shows its first frame before the Launch layer goes away
function onGameReady() {
  isLaunching.value = false;
  isTakingOver.value = false;
}

function onGameClose() {
  isPlaying.value = false;
  isLaunching.value = false;
  isTakingOver.value = false;
  lockPage(false);
  button.value?.focus({ preventScroll: true });
  // Focusing starts a Takeover; a closed game shouldn't greet you with one
  isTakingOver.value = false;
}
</script>

<template>
  <button
    v-bind="$attrs"
    ref="button"
    type="button"
    class="mini-earth"
    :class="{
      'mini-earth--taking-over': isTakingOver,
      'mini-earth--launching': isLaunching || isPlaying,
    }"
    aria-label="Play Defend Earth, a game"
    data-cy="miniEarth"
    @pointerenter="startTakeover"
    @pointerleave="stopTakeover"
    @focus="startTakeover"
    @blur="stopTakeover"
    @click="launch"
  >
    <slot></slot>
    <span class="mini-earth__orbit" aria-hidden="true">
      <canvas
        ref="globe"
        class="mini-earth__globe"
        data-cy="miniEarthGlobe"
      ></canvas>
    </span>
    <span class="mini-earth__play" aria-hidden="true">Play</span>
  </button>

  <Teleport to="body">
    <div
      v-if="isLaunching"
      class="mini-earth__launch"
      aria-hidden="true"
      data-cy="launch"
    >
      <canvas
        ref="launchGlobe"
        class="mini-earth__launch-globe"
        :style="launchStyle"
      ></canvas>
    </div>
    <GameScreen v-if="isPlaying" @ready="onGameReady" @close="onGameClose" />
  </Teleport>
</template>

<style lang="scss" scoped>
.mini-earth {
  /* The globe's resting size (a share of the photo's) and its distance from
     the photo's centre */
  --mini-earth-scale: 0.22;
  --mini-earth-orbit: 64px;
  position: relative;
  display: block;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.mini-earth:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 4px;
}
.mini-earth__orbit {
  position: absolute;
  inset: 0;
  pointer-events: none;
  animation: mini-earth-orbit 12s linear infinite;
}
/* Sized to cover the photo, then shrunk into orbit; the Takeover undoes both */
.mini-earth__globe {
  position: absolute;
  left: 50%;
  top: 50%;
  /* Room for the atmosphere glow (GLOW in game/earth.js) */
  width: 135%;
  height: 135%;
  /* Its own hit area, so hovering the orbiting Earth counts */
  pointer-events: auto;
  transform: translate(-50%, -50%) translateX(var(--mini-earth-orbit))
    scale(var(--mini-earth-scale));
  transition: transform 0.8s cubic-bezier(0.65, 0, 0.35, 1);
}
.mini-earth--taking-over .mini-earth__orbit {
  animation-play-state: paused;
}
.mini-earth--taking-over .mini-earth__globe {
  transform: translate(-50%, -50%);
}
.mini-earth--launching .mini-earth__globe,
.mini-earth--launching .mini-earth__play {
  visibility: hidden;
}
.mini-earth__play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-game-text);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}
.mini-earth--taking-over .mini-earth__play {
  opacity: 1;
  transition: opacity 0.3s 0.6s;
}
@keyframes mini-earth-orbit {
  to {
    transform: rotate(360deg);
  }
}
/* The Mini Earth is on the page, so it follows the site's motion rules */
@media (prefers-reduced-motion: reduce) {
  .mini-earth__orbit {
    animation: none;
    transform: rotate(-40deg);
  }
  .mini-earth__globe {
    transition: none;
  }
}

.mini-earth__launch {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background-color: var(--color-game-space);
  animation: mini-earth-fade-in 0.6s ease both;
}
.mini-earth__launch-globe {
  position: absolute;
  transform-origin: 0 0;
}
@keyframes mini-earth-fade-in {
  from {
    background-color: transparent;
  }
}
</style>
