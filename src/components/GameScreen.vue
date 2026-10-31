<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { SHOP_ITEMS } from '@/game/config';
import {
  blockedReason,
  buy,
  createGame,
  nextWave,
  price,
  resize,
  step,
} from '@/game/game';
import { POPULATION_START } from '@/game/config';
import { draw, makeStars, pixelRatio, readColors } from '@/game/draw';
import Icon from './Icon.vue';
import GameShop from './GameShop.vue';
import GameMenu from './GameMenu.vue';
import GameEnd from './GameEnd.vue';

const emit = defineEmits(['ready', 'close']);

const root = ref(null);
const canvas = ref(null);
const isMenuOpen = ref(false);
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
  if (window.Cypress) window.__game = game;
  isMenuOpen.value = false;
  needsDraw = true;
  syncHud();
}

function syncHud() {
  const { status, wave, population, ore, score } = game;
  const next = { status, wave, population, ore, score };
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
  // Paused, or in the Shop, nothing moves: skip drawing an identical frame
  if (isFlying()) {
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

const isFlying = () => game.status === 'wave' && !isMenuOpen.value;

// During a Wave and in the Shop; not on the end screen
const canOpenMenu = () => game.status === 'wave' || game.status === 'shop';

function openMenu() {
  if (canOpenMenu()) isMenuOpen.value = true;
}

function onKeyDown(event) {
  if (event.code === 'Escape') {
    if (game.status === 'over') emit('close');
    else if (isMenuOpen.value) isMenuOpen.value = false;
    else openMenu();
    return;
  }
  keys.add(event.code);
  // Arrows and Space would otherwise scroll or press a focused button
  if (isFlying()) event.preventDefault();
}
const onKeyUp = (event) => keys.delete(event.code);
// Nobody loses Population while looking at another tab
const onVisibility = () =>
  document.hidden && game.status === 'wave' && openMenu();

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
  root.value.focus();
  draw(ctx, game, colors, stars, 0);
  emit('ready');
  frame = requestAnimationFrame((time) => {
    lastTime = time;
    loop(time);
  });
  window.addEventListener('resize', fitCanvas);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  document.addEventListener('visibilitychange', onVisibility);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  window.removeEventListener('resize', fitCanvas);
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  document.removeEventListener('visibilitychange', onVisibility);
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

    <div class="game-screen__hud">
      <span class="game-screen__wave" data-cy="hudWave">
        Wave {{ hud.wave }}
      </span>
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
      v-if="hud.status === 'wave' || hud.status === 'shop'"
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
      v-if="isMenuOpen || hud.status !== 'wave'"
      class="game-screen__overlay"
    >
      <GameMenu
        v-if="isMenuOpen"
        @resume="isMenuOpen = false"
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
        v-else-if="hud.status === 'over'"
        :score="hud.score"
        :wave="hud.wave"
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
.game-screen__wave {
  line-height: 1.75rem;
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
.game-button:disabled {
  opacity: 0.4;
  cursor: default;
}
.game-button--quiet {
  background: transparent;
  border: 1px solid var(--color-game-panel-border);
  color: var(--color-game-text);
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
  cursor: help;
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
