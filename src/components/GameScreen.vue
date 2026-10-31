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
import { draw, makeStars, readColors } from '@/game/draw';
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
let stars = [];
let frame = 0;
let lastTime = 0;

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
  if (!isMenuOpen.value) step(game, dt, input());
  draw(ctx, game, colors, stars);
  syncHud();
}

function fitCanvas() {
  const { innerWidth: width, innerHeight: height } = window;
  const ratio = window.devicePixelRatio || 1;
  canvas.value.width = width * ratio;
  canvas.value.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  stars = makeStars(width, height);
  if (game) resize(game, width, height);
}

function openMenu() {
  if (game.status === 'wave') isMenuOpen.value = true;
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
  if (game.status === 'wave' && !isMenuOpen.value) event.preventDefault();
}
const onKeyUp = (event) => keys.delete(event.code);
// Nobody loses Population while looking at another tab
const onVisibility = () => document.hidden && openMenu();

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

onMounted(() => {
  ctx = canvas.value.getContext('2d');
  colors = readColors(root.value);
  fitCanvas();
  newGame();
  root.value.focus();
  draw(ctx, game, colors, stars);
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
      <span data-cy="hudWave">Wave {{ hud.wave }}</span>
      <span data-cy="hudPopulation">
        {{ hud.population?.toFixed(1) }} billion people
      </span>
      <span data-cy="hudOre">{{ hud.ore }} Ore</span>
    </div>

    <button
      v-if="hud.status === 'wave'"
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
  gap: 0.25rem 1.25rem;
  font-weight: 600;
  pointer-events: none;
}
.game-screen__menu-button {
  position: absolute;
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
  backdrop-filter: blur(6px);
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
</style>
