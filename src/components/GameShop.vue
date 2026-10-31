<script setup>
import { SHOP_ITEMS } from '@/game/config';

// One row per Shop item: { id, owned, price, blocked } (see game.js)
defineProps({
  ore: { type: Number, required: true },
  wave: { type: Number, required: true },
  items: { type: Array, required: true },
});
defineEmits(['buy', 'next']);

// Why an item can't be bought; upgrades name what they need first
const reason = (item) =>
  item.blocked === 'needs'
    ? `Needs a ${SHOP_ITEMS[SHOP_ITEMS[item.id].needs].label}`
    : 'Maxed out';
</script>

<template>
  <div class="game-shop game-panel" data-cy="gameShop">
    <h2 class="game-panel__title">Wave {{ wave }} survived</h2>
    <p class="game-shop__ore" data-cy="gameShopOre">{{ ore }} Ore to spend</p>
    <ul class="game-shop__items">
      <li
        v-for="item in items"
        :key="item.id"
        class="game-shop__item"
        :data-cy="`shopItem-${item.id}`"
      >
        <span class="game-shop__name">
          {{ SHOP_ITEMS[item.id].label }}
          <span class="game-shop__owned">
            {{ item.owned }}/{{ SHOP_ITEMS[item.id].max }}
          </span>
        </span>
        <button
          type="button"
          class="game-button game-button--small"
          :disabled="!!item.blocked"
          data-cy="shopBuy"
          @click="$emit('buy', item.id)"
        >
          {{ item.blocked ? reason(item) : `${item.price} Ore` }}
        </button>
      </li>
    </ul>
    <button
      type="button"
      class="game-button"
      data-cy="shopNext"
      @click="$emit('next')"
    >
      Start Wave {{ wave + 1 }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.game-shop__ore {
  margin: 0 0 1rem;
  font-weight: 700;
}
.game-shop__items {
  display: grid;
  gap: 0.5rem;
  margin: 0 0 1.25rem;
  padding: 0;
  list-style: none;
}
.game-shop__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.game-shop__owned {
  margin-left: 0.4rem;
  opacity: 0.6;
  font-size: 0.85em;
}
</style>
