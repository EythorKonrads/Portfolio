<script setup>
import { onBeforeUnmount, ref } from 'vue';

// On-screen controls for touch screens: a joystick bottom right that points
// where to fly, and a shoot button bottom left that fires while held. Each
// follows its own finger, so both thumbs work at once.
const emit = defineEmits([
  // { heading: radians, push: 0..1 }, or null when let go
  'stick',
  // true while the shoot button is held
  'fire',
]);

const base = ref(null);
const knob = ref({ x: 0, y: 0 });
const isFiring = ref(false);
let stickPointer = null;

// The finger may already have lifted, which makes capturing it throw
function capture(element, event) {
  try {
    element.setPointerCapture(event.pointerId);
  } catch {
    // Nothing to follow
  }
}

function moveStick(event) {
  const rect = base.value.getBoundingClientRect();
  const dx = event.clientX - (rect.left + rect.width / 2);
  const dy = event.clientY - (rect.top + rect.height / 2);
  const reach = rect.width / 2;
  const distance = Math.hypot(dx, dy);
  // The knob stops at the rim, however far the thumb goes
  const scale = distance > reach ? reach / distance : 1;
  knob.value = { x: dx * scale, y: dy * scale };
  emit('stick', {
    heading: Math.atan2(dy, dx),
    push: Math.min(1, distance / reach),
  });
}

function onStickDown(event) {
  stickPointer = event.pointerId;
  capture(base.value, event);
  moveStick(event);
}
function onStickMove(event) {
  if (event.pointerId === stickPointer) moveStick(event);
}
function onStickUp(event) {
  if (event.pointerId !== stickPointer) return;
  stickPointer = null;
  knob.value = { x: 0, y: 0 };
  emit('stick', null);
}

function setFiring(firing, event) {
  if (firing) capture(event.currentTarget, event);
  isFiring.value = firing;
  emit('fire', firing);
}

// Hidden mid-press (the Menu opened, the Wave ended): let go of everything
onBeforeUnmount(() => {
  emit('stick', null);
  emit('fire', false);
});
</script>

<template>
  <div class="game-touch-controls" data-cy="touchControls">
    <button
      type="button"
      class="game-touch-controls__fire"
      :class="{ 'game-touch-controls__fire--held': isFiring }"
      aria-label="Shoot"
      data-cy="touchFire"
      @pointerdown.prevent="setFiring(true, $event)"
      @pointerup="setFiring(false, $event)"
      @pointercancel="setFiring(false, $event)"
      @contextmenu.prevent
    >
      Fire
    </button>
    <div
      ref="base"
      class="game-touch-controls__stick"
      data-cy="touchStick"
      @pointerdown.prevent="onStickDown"
      @pointermove="onStickMove"
      @pointerup="onStickUp"
      @pointercancel="onStickUp"
      @contextmenu.prevent
    >
      <span
        class="game-touch-controls__knob"
        :style="{ transform: `translate(${knob.x}px, ${knob.y}px)` }"
      ></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Thumbs rest near the bottom corners; the notch and home bar get room */
.game-touch-controls {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 max(1.25rem, env(safe-area-inset-right))
    max(1rem, env(safe-area-inset-bottom))
    max(1.25rem, env(safe-area-inset-left));
  /* Only the controls themselves catch touches */
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.game-touch-controls__fire,
.game-touch-controls__stick {
  pointer-events: auto;
  touch-action: none;
  border: 2px solid var(--color-game-panel-border);
  border-radius: 50%;
  background: var(--color-game-key);
}
.game-touch-controls__fire {
  width: 4.5rem;
  height: 4.5rem;
  padding: 0;
  color: var(--color-game-text);
  font-family: Orbitron, var(--font-body);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.game-touch-controls__fire--held {
  background: var(--color-game-button);
  color: var(--color-game-button-text);
}
.game-touch-controls__stick {
  position: relative;
  display: grid;
  place-items: center;
  width: 7rem;
  height: 7rem;
  box-sizing: border-box;
}
.game-touch-controls__knob {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--color-game-button);
  opacity: 0.85;
  pointer-events: none;
}
</style>
