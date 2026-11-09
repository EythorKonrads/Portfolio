<script>
import Icon from './Icon.vue';

// Modal shell shared by all popups: masking backdrop, slide-up animation,
// sticky close button and body scroll lock. Content goes in the default slot.
export default {
  name: 'BasePopup',
  components: {
    Icon,
  },
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
    size: {
      type: String,
      default: 'large',
      validator: (value) => ['large', 'small'].includes(value),
    },
    label: {
      type: String,
      default: undefined,
    },
    // Prefix for the data-cy attributes: <cy>, <cy>Backdrop, <cy>Close
    cy: {
      type: String,
      default: 'popup',
    },
  },
  emits: ['close'],
  data() {
    return {
      isAnimating: false,
    };
  },
  watch: {
    isOpen(newValue) {
      if (newValue) {
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', this.handleKeydown);
        this.$nextTick(() => {
          setTimeout(() => {
            this.isAnimating = true;
          }, 10);
        });
      } else {
        this.isAnimating = false;
        document.body.style.overflow = '';
        window.removeEventListener('keydown', this.handleKeydown);
      }
    },
  },
  beforeUnmount() {
    document.body.style.overflow = '';
    window.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    close() {
      this.isAnimating = false;
      setTimeout(() => {
        this.$emit('close');
        document.body.style.overflow = '';
      }, 400);
    },
    handleKeydown(event) {
      if (event.key === 'Escape') this.close();
    },
  },
};
</script>

<template>
  <div
    v-if="isOpen"
    class="base-popup__backdrop"
    :data-cy="`${cy}Backdrop`"
    :class="{ 'base-popup__backdrop--visible': isAnimating }"
    @click="close"
  >
    <div
      class="base-popup"
      role="dialog"
      aria-modal="true"
      :aria-label="label"
      :data-cy="cy"
      :class="[`base-popup--${size}`, { 'base-popup--visible': isAnimating }]"
      @click.stop
    >
      <button
        type="button"
        class="base-popup__close"
        aria-label="Close"
        :data-cy="`${cy}Close`"
        @click="close"
      >
        <Icon name="close" class="social__icon o-icon" />
      </button>
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.base-popup__backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: transparent;
  z-index: 998;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}
.base-popup__backdrop--visible {
  background-color: var(--color-popup-backdrop);
}
.base-popup {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90vw;
  background-color: var(--color-surface);
  transform: translateY(100vh);
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border-radius: 8px;
  box-shadow: 0 0 50px var(--color-popup-shadow);
  overflow-y: auto;
  overflow-x: hidden;
  cursor: default;
}
.base-popup--large {
  max-width: 1200px;
  height: 90vh;
  max-height: 800px;
}
.base-popup--small {
  max-width: 600px;
  max-height: 80vh;
}
.base-popup--visible {
  transform: translateY(0);
}
.base-popup__close {
  position: sticky;
  top: 1.75rem;
  align-self: flex-end;
  margin-right: 1.75rem;
  border: 0;
  color: inherit;
  font: inherit;
  line-height: 0;
  background-color: var(--color-popup-button);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: 0.4rem;
  border-radius: 50%;
  transition: 0.3s ease;
  z-index: 1000;
  cursor: pointer;
}
.base-popup__close:hover {
  background-color: var(--color-popup-button-hover);
}
.base-popup__close .icon {
  width: 1.5rem;
  height: 1.5rem;
}
.base-popup__close :deep(path) {
  fill: var(--color-popup-button-icon);
}
</style>
