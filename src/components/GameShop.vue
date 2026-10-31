<script setup>
import { computed, ref } from 'vue';
import { SHOP_ITEMS } from '@/game/config';
import Icon from './Icon.vue';

// One entry per Shop item: { id, owned, price, blocked } (see game.js)
const props = defineProps({
  ore: { type: Number, required: true },
  wave: { type: Number, required: true },
  items: { type: Array, required: true },
});
const emit = defineEmits(['buy', 'next']);

// A row per thing being improved. Its first, bigger card is the thing itself:
// the Ship, which can't be bought, or a Turret or Satellite, which can.
const ROWS = [
  {
    head: 'ship',
    label: 'Ship',
    info: 'Your Ship. Upgrades in this row make it stronger.',
    upgrades: ['shipRate', 'shipWeapon', 'shipEngine'],
  },
  { head: 'turret', upgrades: ['turretRate', 'turretDamage'] },
  { head: 'satellite', upgrades: ['satelliteRate', 'satelliteDamage'] },
];

const byId = computed(() =>
  Object.fromEntries(props.items.map((item) => [item.id, item]))
);

// shipWeapon → game-ship-weapon.svg
const iconName = (id) =>
  `game-${id.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
const isLocked = (id) => byId.value[id]?.blocked === 'needs';
// The whole card buys. Its button has no click handler of its own: a click
// or Enter on the button reaches the card, so it never buys twice.
const canBuy = (id) => !!byId.value[id] && !byId.value[id].blocked;

// One tooltip for the whole Shop, placed on screen over the hovered card.
// Fixed positioning keeps it from being cut off by the scrolling panel.
const TIP_WIDTH = 224;
const tip = ref(null);

function showTip(id, event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const half = TIP_WIDTH / 2 + 8;
  const x = Math.min(
    window.innerWidth - half,
    Math.max(half, rect.left + rect.width / 2)
  );
  // Above the card, unless it's too near the top of the screen
  const above = rect.top > 140;
  tip.value = {
    id,
    style: {
      left: `${x}px`,
      top: `${above ? rect.top : rect.bottom}px`,
      width: `${TIP_WIDTH}px`,
      transform: above
        ? 'translate(-50%, calc(-100% - 0.4rem))'
        : 'translate(-50%, 0.4rem)',
    },
  };
}
const hideTip = () => (tip.value = null);

// Touch has no hover, so the first tap on a card shows its tip and the next
// tap on that card buys it (and keeps buying more levels). A mouse click or
// the keyboard buys straight away.
let pointer = null;
const tapped = ref(null);
const onPointerDown = (event) => (pointer = event.pointerType);

function onCardClick(id, event) {
  const isTouch = pointer === 'touch';
  pointer = null;
  if (isTouch && tapped.value !== id) {
    tapped.value = id;
    showTip(id, event);
    return;
  }
  if (canBuy(id)) emit('buy', id);
}

// Read from the items each time, so buying a Turret unlocks its upgrades
// (and the tip under the pointer) straight away
const tipText = computed(() => {
  const id = tip.value?.id;
  if (!id) return null;
  const row = ROWS.find((r) => r.head === id && !SHOP_ITEMS[id]);
  if (row) return { title: row.label, body: row.info };
  if (isLocked(id)) {
    const needs = SHOP_ITEMS[SHOP_ITEMS[id].needs].label;
    return {
      title: 'Locked',
      body: `Buy a ${needs} first to unlock this upgrade.`,
    };
  }
  return { title: SHOP_ITEMS[id].label, body: SHOP_ITEMS[id].info };
});
</script>

<template>
  <div class="game-shop game-panel" data-cy="gameShop">
    <h2 class="game-panel__title game-shop__title">Wave {{ wave }} survived</h2>
    <p class="game-shop__ore" data-cy="gameShopOre">
      <Icon name="ore" :icon="false" class="game-shop__ore-icon" />
      {{ ore }}
    </p>
    <ul class="game-shop__items">
      <template v-for="row in ROWS" :key="row.head">
        <li
          v-for="id in [row.head, ...row.upgrades]"
          :key="id"
          class="game-shop__item"
          :class="{
            'game-shop__item--head': id === row.head,
            'game-shop__item--display': !byId[id],
            'game-shop__item--locked': isLocked(id),
            'game-shop__item--buyable': canBuy(id),
          }"
          :data-cy="`shopItem-${id}`"
          @pointerdown="onPointerDown"
          @click="onCardClick(id, $event)"
          @mouseenter="showTip(id, $event)"
          @mouseleave="hideTip"
          @focusin="showTip(id, $event)"
          @focusout="hideTip"
        >
          <!-- Keyed by name: Icon loads its SVG once, so a new name needs a
               new Icon. Locked upgrades don't say what they are. -->
          <Icon
            :key="isLocked(id) ? 'locked' : id"
            :name="isLocked(id) ? 'game-locked' : iconName(id)"
            :icon="false"
            class="game-shop__icon"
          />
          <template v-if="byId[id]">
            <span class="game-shop__owned">
              {{ byId[id].owned }}/{{ SHOP_ITEMS[id].max }}
            </span>
            <button
              type="button"
              class="game-button game-button--small game-shop__buy"
              :disabled="!!byId[id].blocked"
              :aria-label="`Buy ${SHOP_ITEMS[id].label}`"
              data-cy="shopBuy"
            >
              <template v-if="byId[id].blocked === 'max'">Max</template>
              <Icon
                v-else-if="isLocked(id)"
                :name="iconName(SHOP_ITEMS[id].needs)"
                :icon="false"
                class="game-shop__price-icon"
              />
              <template v-else>
                {{ byId[id].price }}
                <Icon name="ore" :icon="false" class="game-shop__price-icon" />
              </template>
            </button>
          </template>
        </li>
      </template>
    </ul>
    <button
      type="button"
      class="game-button"
      data-cy="shopNext"
      @click="$emit('next')"
    >
      Start Wave {{ wave + 1 }}
    </button>

    <span
      v-if="tipText"
      class="game-hint__tip game-shop__tip"
      :style="tip.style"
      role="tooltip"
      data-cy="shopInfo"
    >
      <strong>{{ tipText.title }}</strong>
      {{ tipText.body }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.game-shop {
  width: min(100%, 23rem);
}
.game-shop__title {
  text-align: center;
}
.game-shop__ore {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0 0 1rem;
  font-size: 1.2rem;
  font-weight: 700;
}
.game-shop__ore-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-game-ore);
}
.game-shop__items {
  display: grid;
  /* The first card in each row is a little bigger */
  grid-template-columns: 1.3fr repeat(3, 1fr);
  /* Every card the same height, whatever its button says */
  grid-auto-rows: 1fr;
  gap: 0.5rem;
  margin: 0 0 1.25rem;
  padding: 0;
  list-style: none;
}
.game-shop__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
  padding: 0.6rem 0.3rem 0.4rem;
  border: 1px solid var(--color-game-panel-border);
  border-radius: 0.5rem;
}
/* Hovering a card shows its button as hovered, since the card buys too */
.game-shop__item--buyable {
  cursor: pointer;

  &:hover {
    border-color: var(--color-game-button);

    .game-shop__buy {
      background: var(--color-game-button-hover);
    }
  }
}
/* Starts a new row, leaving any spare cells in the row before empty */
.game-shop__item--head {
  grid-column: 1;
  background: var(--color-game-key);

  .game-shop__icon {
    width: 2.75rem;
    height: 2.75rem;
  }
}
/* The Ship's card has no button, so its icon takes the whole card */
.game-shop__item--display {
  justify-content: center;

  .game-shop__icon {
    width: 3.25rem;
    height: 3.25rem;
  }
}
.game-shop__item--locked {
  border-style: dashed;

  .game-shop__icon {
    opacity: 0.45;
  }
  .game-shop__owned {
    visibility: hidden;
  }
}
.game-shop__icon {
  flex: none;
  width: 2.25rem;
  height: 2.25rem;
  color: var(--color-game-defence);
}
.game-shop__owned {
  opacity: 0.6;
  font-size: 0.8em;
  line-height: 1;
}
.game-shop__buy {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  width: 100%;
  min-width: 0;
  height: 1.75rem;
  /* Pushed to the bottom, so buttons line up across cards */
  margin-top: auto;
  padding: 0 0.2rem;
  font-size: 0.8em;
  white-space: nowrap;
}
.game-shop__price-icon {
  flex: none;
  width: 1rem;
  height: 1rem;
}
.game-shop__tip {
  position: fixed;
  display: block;
  pointer-events: none;

  strong {
    display: block;
  }
}
</style>
