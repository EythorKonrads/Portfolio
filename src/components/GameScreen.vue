<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue';
import { SHOP_ITEMS } from '@/game/config';
import {
  blockedReason,
  buy,
  createGame,
  isEnded,
  isEnding,
  nextWave,
  price,
  resize,
  step,
} from '@/game/game';
import { POPULATION_START, WAVE_TITLE } from '@/game/config';
import { draw, makeStars, pixelRatio, readColors } from '@/game/draw';
import { applyDevStart } from '@/game/devStart';
import Icon from './Icon.vue';
import GameShop from './GameShop.vue';
import GameMenu from './GameMenu.vue';
import GameScoreboard from './GameScoreboard.vue';
import GameEnd from './GameEnd.vue';
import GameIntro from './GameIntro.vue';

const emit = defineEmits(['ready', 'close']);

const root = ref(null);
const canvas = ref(null);
const isMenuOpen = ref(false);
// The Menu can show the Scoreboard in its place; the game stays paused
const isScoreboardOpen = ref(false);
watch(isMenuOpen, () => (isScoreboardOpen.value = false));
// The controls are explained before the first Wave; Play again skips them
const isIntro = ref(true);
const isTouch = window.matchMedia('(pointer: coarse)').matches;
// What the HTML on top shows, copied from the game once a frame
const hud = shallowRef({});
let game = null;
let ctx = null;
let colors = null;
let stars = null;
// Redraw on the next frame even if the game is paused
let needsDraw = true;
let frame = 0;
let lastTime = 0;
let elapsed = 0;

const keys = new Set();
let touchTarget = null;

function newGame() {
  game = createGame({
    width: window.innerWidth,
    height: window.innerHeight,
    // Tests replay the same game every time
    seed: window.Cypress ? 1 : undefined,
  });
  // Playtesting shortcuts such as ?wave=20; see devStart.js
  if (import.meta.env.DEV) applyDevStart(game, window.location.search);
  if (window.Cypress) window.__game = game;
  isMenuOpen.value = false;
  needsDraw = true;
  syncHud();
}

function syncHud() {
  const { status, wave, population, ore, score } = game;
  const next = { status, wave, population, ore, score, ended: isEnded(game) };
  if (Object.keys(next).some((key) => next[key] !== hud.value[key])) {
    hud.value = next;
  }
}

const shopItems = computed(() => {
  // Recomputed whenever Ore changes, which every purchase does
  void hud.value.ore;
  if (!game) return [];
  return Object.keys(SHOP_ITEMS).map((id) => ({
    id,
    owned: game.owned[id],
    price: price(game, id),
    blocked: blockedReason(game, id),
  }));
});

function input() {
  const has = (...codes) => codes.some((code) => keys.has(code));
  return {
    turn:
      (has('ArrowRight', 'KeyD') ? 1 : 0) - (has('ArrowLeft', 'KeyA') ? 1 : 0),
    thrust: has('ArrowUp', 'KeyW'),
    fire: has('Space'),
    target: touchTarget,
  };
}

function loop(time) {
  frame = requestAnimationFrame(loop);
  // A long gap (a background tab, a debugger) shouldn't teleport anything
  const dt = Math.min(0.05, (time - lastTime) / 1000 || 0);
  lastTime = time;
  elapsed += dt;
  const starAlpha = Math.min(1, elapsed / 0.8);
  // Paused, or in the Shop, nothing moves: skip drawing an identical frame.
  // After game over, Earth's explosion and the last blasts still play out.
  if (isFlying() || isEnding(game)) {
    step(game, dt, input());
  } else if (!needsDraw && starAlpha === 1) {
    return;
  }
  needsDraw = false;
  draw(ctx, game, colors, stars, starAlpha);
  syncHud();
}

function fitCanvas() {
  const { innerWidth: width, innerHeight: height } = window;
  const ratio = pixelRatio();
  canvas.value.width = width * ratio;
  canvas.value.height = height * ratio;
  stars = makeStars(width, height, colors);
  if (game) resize(game, width, height);
  needsDraw = true;
}

const isFlying = () =>
  game.status === 'wave' && !isMenuOpen.value && !isIntro.value;

// During a Wave and in the Shop; not on the help or end screen
const canOpenMenu = () =>
  !isIntro.value && (game.status === 'wave' || game.status === 'shop');

function openMenu() {
  if (canOpenMenu()) isMenuOpen.value = true;
}

function startGame() {
  isIntro.value = false;
  root.value.focus();
}

function onKeyDown(event) {
  if (event.code === 'Escape') {
    if (game.status === 'over' || isIntro.value) emit('close');
    else if (isScoreboardOpen.value) isScoreboardOpen.value = false;
    else if (isMenuOpen.value) isMenuOpen.value = false;
    else openMenu();
    return;
  }
  keys.add(event.code);
  // Arrows and Space would otherwise scroll or press a focused button
  if (isFlying()) event.preventDefault();
}
const onKeyUp = (event) => keys.delete(event.code);
// Nobody loses Population while looking at another tab or window
function onAway() {
  if (game.status === 'wave') openMenu();
}
const onVisibility = () => document.hidden && onAway();
// Keys held when the window lost focus never get their keyup
function onBlur() {
  keys.clear();
  onAway();
}

// Touch steers the Ship towards the finger; a mouse uses the keyboard
function onPointer(event) {
  if (event.pointerType !== 'touch') return;
  touchTarget =
    event.type === 'pointerup' || event.type === 'pointercancel'
      ? null
      : { x: event.clientX, y: event.clientY };
}

function onBuy(id) {
  buy(game, id);
  syncHud();
}

function onNext() {
  nextWave(game);
  syncHud();
  root.value.focus();
}

// The Population bar goes from green to orange to red as people are lost
const populationShare = computed(
  () => (hud.value.population ?? POPULATION_START) / POPULATION_START
);
const populationLevel = computed(() =>
  populationShare.value > 0.6
    ? 'good'
    : populationShare.value > 0.3
      ? 'warn'
      : 'bad'
);

onMounted(() => {
  ctx = canvas.value.getContext('2d');
  colors = readColors(root.value);
  fitCanvas();
  newGame();
  // The help screen focuses its Start button itself
  if (!isIntro.value) root.value.focus();
  draw(ctx, game, colors, stars, 0);
  // Fetch the Wave title's font while the help screen is up, so the title
  // doesn't first show in the fallback font
  document.fonts?.load('700 1em Orbitron');
  emit('ready');
  frame = requestAnimationFrame((time) => {
    lastTime = time;
    loop(time);
  });
  window.addEventListener('resize', fitCanvas);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('blur', onBlur);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  window.removeEventListener('resize', fitCanvas);
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  document.removeEventListener('visibilitychange', onVisibility);
  window.removeEventListener('blur', onBlur);
  if (window.Cypress) delete window.__game;
});
</script>

<template>
  <div ref="root" class="game-screen" tabindex="-1" data-cy="gameScreen">
    <canvas
      ref="canvas"
      class="game-screen__canvas"
      @pointerdown="onPointer"
      @pointermove="onPointer"
      @pointerup="onPointer"
      @pointercancel="onPointer"
    ></canvas>

    <!-- Keyed by Wave, so each new Wave plays the animation again -->
    <div
      v-if="hud.status === 'wave' && !isIntro"
      :key="hud.wave"
      class="game-screen__wave"
      :class="{ 'game-screen__wave--paused': isMenuOpen }"
      :style="{ '--wave-title-time': `${WAVE_TITLE}s` }"
      data-cy="waveTitle"
    >
      <span class="game-screen__wave-text">Wave {{ hud.wave }}</span>
    </div>

    <div class="game-screen__hud">
      <div
        class="game-screen__population"
        :class="`game-screen__population--${populationLevel}`"
        data-cy="hudPopulationBar"
      >
        <span
          class="game-screen__population-fill"
          :style="{ width: `${populationShare * 100}%` }"
        ></span>
        <span class="game-screen__population-text" data-cy="hudPopulation">
          {{ hud.population?.toFixed(1) }} billion people
        </span>
      </div>
      <span class="game-screen__ore game-hint" data-cy="hudOre">
        <Icon name="ore" :icon="false" class="game-screen__ore-icon" />
        {{ hud.ore }}
        <span class="game-hint__tip" role="tooltip">
          <strong>Ore</strong>, mined from destroyed Asteroids. Spend it in the
          Shop between Waves.
        </span>
      </span>
    </div>

    <button
      v-if="(hud.status === 'wave' || hud.status === 'shop') && !isIntro"
      type="button"
      class="game-screen__menu-button"
      aria-label="Menu"
      data-cy="gameMenuButton"
      @click="isMenuOpen = !isMenuOpen"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <div
      v-if="isIntro || isMenuOpen || hud.status === 'shop' || hud.ended"
      class="game-screen__overlay"
    >
      <GameIntro v-if="isIntro" :touch="isTouch" @start="startGame" />
      <GameScoreboard
        v-else-if="isMenuOpen && isScoreboardOpen"
        @back="isScoreboardOpen = false"
      />
      <GameMenu
        v-else-if="isMenuOpen"
        @resume="isMenuOpen = false"
        @scoreboard="isScoreboardOpen = true"
        @end="emit('close')"
      />
      <GameShop
        v-else-if="hud.status === 'shop'"
        :ore="hud.ore"
        :wave="hud.wave"
        :items="shopItems"
        @buy="onBuy"
        @next="onNext"
      />
      <GameEnd
        v-else-if="hud.ended"
        :score="hud.score"
        :wave="hud.wave"
        :time="game.time"
        @again="newGame"
        @close="emit('close')"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.game-screen {
  position: fixed;
  inset: 0;
  z-index: 1001;
  overflow: hidden;
  background-color: var(--color-game-space);
  color: var(--color-game-text);
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.6;
  outline: none;
  /* The Ship is steered by touch; don't let the browser pan or zoom */
  touch-action: none;
  user-select: none;
}
.game-screen__canvas {
  display: block;
  width: 100%;
  height: 100%;
}
.game-screen__hud {
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 4.5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1.25rem;
  font-weight: 600;
  pointer-events: none;
}
/* "Wave N" in big letters above the Ship, which starts 1.8 Earth radii
   (7.5% of the screen's shorter side each) above Earth's centre. On a short
   screen it stops below the HUD instead. Gone before the first Asteroid. */
.game-screen__wave {
  position: absolute;
  top: max(
    calc(3.5rem + clamp(2rem, 7vw, 4.5rem)),
    calc(50% - min(13.5vw, 13.5vh) - 12px - 1.5rem)
  );
  left: 50%;
  transform: translate(-50%, -100%);
  pointer-events: none;
}
.game-screen__wave-text {
  display: block;
  /* Letter spacing also trails the last letter; this keeps it centred */
  padding-left: 0.35em;
  color: var(--color-game-text);
  font-family: Orbitron, var(--font-body);
  font-size: clamp(2rem, 7vw, 4.5rem);
  font-weight: 700;
  letter-spacing: 0.35em;
  line-height: 1;
  text-shadow: 0 0 1.5rem var(--color-game-title-glow);
  text-transform: uppercase;
  white-space: nowrap;
  animation: game-screen-wave var(--wave-title-time) ease-out both;
}
.game-screen__wave--paused .game-screen__wave-text {
  animation-play-state: paused;
}
/* The letters close in out of a blur, hold, then drift up and fade */
@keyframes game-screen-wave {
  0% {
    opacity: 0;
    filter: blur(0.5rem);
    letter-spacing: 0.9em;
  }
  25% {
    opacity: 1;
    filter: blur(0);
    letter-spacing: 0.35em;
  }
  75% {
    opacity: 1;
    transform: none;
  }
  100% {
    opacity: 0;
    transform: translateY(-1.5rem) scale(1.08);
  }
}
@font-face {
  font-family: Orbitron;
  font-weight: 500 800;
  font-display: swap;
  /* Latin subset, self-hosted (SIL Open Font License, see orbitron-OFL.txt).
     It only downloads with the game. */
  src: url('../assets/fonts/orbitron.woff2') format('woff2');
}
/* Population as a health bar, with the number inside */
.game-screen__population {
  position: relative;
  width: min(16rem, 45vw);
  height: 1.75rem;
  overflow: hidden;
  border: 1px solid var(--color-game-panel-border);
  border-radius: 0.4rem;
  background: var(--color-game-panel);
}
.game-screen__population-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--population-color);
  transition:
    width 0.4s ease,
    background-color 0.4s ease;
}
.game-screen__population--good {
  --population-color: var(--color-game-health-good);
}
.game-screen__population--warn {
  --population-color: var(--color-game-health-warn);
}
.game-screen__population--bad {
  --population-color: var(--color-game-health-bad);
}
.game-screen__population-text {
  position: relative;
  display: block;
  padding: 0 0.6rem;
  color: var(--color-game-health-text);
  text-shadow: 0 1px 2px var(--color-game-space);
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.75rem;
  white-space: nowrap;
}
.game-screen__ore {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  line-height: 1.75rem;
  /* The rest of the HUD lets clicks through; this one has a tooltip */
  pointer-events: auto;
}
.game-screen__ore-icon {
  width: 1.4rem;
  height: 1.4rem;
  color: var(--color-game-ore);
}
.game-screen__menu-button {
  position: absolute;
  /* Above the Shop's overlay, which covers the whole screen */
  z-index: 1;
  top: 0.75rem;
  right: 0.75rem;
  display: grid;
  align-content: center;
  gap: 5px;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0 0.7rem;
  border: 1px solid var(--color-game-panel-border);
  border-radius: 0.5rem;
  background: var(--color-game-panel);
  cursor: pointer;

  span {
    height: 2px;
    border-radius: 1px;
    background: var(--color-game-text);
  }
}
.game-screen__overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
}
</style>

<style lang="scss">
/* Shared by the Shop, the Menu and the end screen */
.game-panel {
  width: min(100%, 24rem);
  max-height: 100%;
  overflow: auto;
  box-sizing: border-box;
  padding: 1.5rem;
  border: 1px solid var(--color-game-panel-border);
  border-radius: 0.75rem;
  background: var(--color-game-panel);
  color: var(--color-game-text);
}
.game-panel__title {
  margin: 0 0 0.75rem;
  font-size: 1.3rem;
}
.game-button {
  display: block;
  width: 100%;
  padding: 0.65rem 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--color-game-button);
  color: var(--color-game-button-text);
  font: inherit;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}
.game-button:hover:not(:disabled) {
  background: var(--color-game-button-hover);
}
.game-button:disabled {
  opacity: 0.4;
  cursor: default;
}
.game-button--quiet {
  background: transparent;
  border: 1px solid var(--color-game-panel-border);
  color: var(--color-game-text);
}
.game-button--quiet:hover:not(:disabled) {
  background: var(--color-game-key);
}
.game-button--small {
  width: auto;
  min-width: 6.5rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.9em;
}
/* Hover for a tooltip. Hidden with display, not visibility, so a hidden tip
   can't make a panel scroll. */
.game-hint {
  position: relative;
}
.game-hint__tip {
  position: absolute;
  top: calc(100% + 0.4rem);
  left: 0;
  z-index: 2;
  display: none;
  width: 14rem;
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--color-game-panel-border);
  border-radius: 0.4rem;
  background: var(--color-game-panel);
  color: var(--color-game-text);
  font-size: 0.85rem;
  font-weight: 400;
  line-height: 1.4;
  text-align: left;
}
.game-hint:hover .game-hint__tip {
  display: block;
}
</style>
