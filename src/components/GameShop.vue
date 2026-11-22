<script setup>
import { computed, ref } from 'vue';
import { SHOP_ITEMS } from '@/game/config';
import Icon from './Icon.vue';

// One entry per Shop item: { id, owned, price, blocked } (see game.js)
const props = defineProps({
  ore: { type: Number, required: true },
  wave: { type: Number, required: true },
  items: { type: Array, required: true },
  // Touch screens have no hover for tooltips, so each card shows its name
  // instead, and one tap buys
  touch: { type: Boolean, default: false },
});
const emit = defineEmits(['buy', 'next']);

// A section per thing being improved, under a headline naming it
const SECTIONS = [
  {
    id: 'ship',
    label: 'Ship',
    items: ['shipRate', 'shipWeapon', 'shipEngine'],
  },
  {
    id: 'turret',
    label: 'Turret',
    items: ['turret', 'turretRate', 'turretDamage'],
  },
  {
    id: 'satellite',
    label: 'Satellite',
    items: ['satellite', 'satelliteRate', 'satelliteDamage'],
  },
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
  if (props.touch) return;
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

function onCardClick(id) {
  if (canBuy(id)) emit('buy', id);
}

// A card's name, shown on touch screens. Locked ones still don't say what
// they are.
function cardName(id) {
  return isLocked(id) ? 'Locked' : SHOP_ITEMS[id].label;
}

// Read from the items each time, so buying a Turret unlocks its upgrades
// (and the tip under the pointer) straight away
const tipText = computed(() => {
  const id = tip.value?.id;
  if (!id) return null;
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
    <section
      v-for="section in SECTIONS"
      :key="section.id"
      class="game-shop__section"
    >
      <h3 class="game-shop__headline" :data-cy="`shopHeadline-${section.id}`">
        {{ section.label }}
      </h3>
      <ul class="game-shop__items">
        <li
          v-for="id in section.items"
          :key="id"
          class="game-shop__item"
          :class="{
            'game-shop__item--locked': isLocked(id),
            'game-shop__item--buyable': canBuy(id),
          }"
          :data-cy="`shopItem-${id}`"
          @click="onCardClick(id)"
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
          <span v-if="touch" class="game-shop__name" data-cy="shopName">
            {{ cardName(id) }}
          </span>
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
      </ul>
    </section>
    <button
      type="button"
      class="game-button game-shop__next"
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
/* The title and Ore share the top line, with everything else below */
.game-shop {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.75rem 1rem;
  width: min(100%, 31rem);
}
.game-shop__title {
  margin: 0;
}
.game-shop__ore {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
}
.game-shop__ore-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-game-ore);
}
/* Lets its cards size their height from the section's width */
.game-shop__section {
  grid-column: 1 / -1;
  container-type: inline-size;
}
/* As far from its cards as sections are from each other */
.game-shop__headline {
  margin: 0 0 0.75rem;
  padding: 0.45rem 0.5rem;
  border: 1px solid var(--color-game-defence);
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
}
.game-shop__items {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  /* Cards are square, unless one's content needs more height, and every
     card in a row is as tall as the tallest */
  grid-auto-rows: minmax(calc((100cqi - 3 * 0.5rem) / 4), auto);
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.game-shop__item {
  position: relative;
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
  position: absolute;
  top: 0.35rem;
  right: 0.4rem;
  opacity: 0.6;
  font-size: 0.7em;
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
.game-shop__next {
  grid-column: 1 / -1;
}
.game-shop__tip {
  position: fixed;
  display: block;
  pointer-events: none;

  strong {
    display: block;
  }
}
.game-shop__name {
  font-size: 0.75em;
  font-weight: 600;
  line-height: 1.15;
  text-align: center;
}
/* Phones held sideways: flatter, scrolling to the Start button if it must.
   Each card puts its icon beside its name, with the buy button
   underneath. */
@media (orientation: landscape) and (max-height: 500px) {
  .game-shop {
    gap: 0.5rem 1rem;
    width: min(100%, 28rem);
  }
  .game-shop__ore {
    font-size: 1rem;
  }
  .game-shop__ore-icon {
    width: 1.2rem;
    height: 1.2rem;
  }
  .game-shop__headline {
    margin-bottom: 0.5rem;
    padding: 0.3rem 0.4rem;
    font-size: 0.75rem;
  }
  .game-shop__items {
    grid-auto-rows: auto;
    gap: 0.3rem;
  }
  .game-shop__item {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: 0.4rem;
    row-gap: 0.3rem;
    padding: 0.35rem;
  }
  .game-shop__icon {
    width: 1.6rem;
    height: 1.6rem;
  }
  /* Clear of the level in the corner */
  .game-shop__name {
    padding-right: 1.5rem;
    font-size: 0.7em;
    text-align: left;
  }
  .game-shop__buy {
    grid-column: 1 / -1;
    height: 1.4rem;
    margin-top: 0;
  }
  .game-shop__next {
    padding: 0.5rem 1rem;
  }
}
</style>
