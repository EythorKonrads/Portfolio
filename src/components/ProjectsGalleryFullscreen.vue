<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

// A project's gallery over the whole screen: one item at a time, arrows and
// a strip of thumbnails to move between them. Our own overlay rather than
// the Fullscreen API, which iPhones only allow for videos.
const props = defineProps({
  media: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  label: {
    type: Function,
    required: true,
  },
});
const emit = defineEmits(['close']);
// Shared with the small gallery, so both show the same item
const index = defineModel('index', { type: Number, required: true });

const active = computed(() => props.media[index.value]);
const hasMany = computed(() => props.media.length > 1);
const closeButton = ref(null);

// Past either end, carry on from the other
function step(by) {
  const count = props.media.length;
  index.value = (index.value + by + count) % count;
}

// Captured on window, so Esc closes this before the popup behind sees it
function onKeydown(event) {
  if (event.key === 'Escape') {
    event.stopPropagation();
    emit('close');
  } else if (hasMany.value && event.key === 'ArrowRight') {
    event.preventDefault();
    step(1);
  } else if (hasMany.value && event.key === 'ArrowLeft') {
    event.preventDefault();
    step(-1);
  }
}

// A sideways swipe moves on; a mostly upright one is left alone
const SWIPE = 50;
let swipeStart = null;
function onTouchStart(event) {
  const { clientX, clientY } = event.changedTouches[0];
  swipeStart = { x: clientX, y: clientY };
}
function onTouchEnd(event) {
  if (!swipeStart || !hasMany.value) return;
  const { clientX, clientY } = event.changedTouches[0];
  const dx = clientX - swipeStart.x;
  const dy = clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) {
    step(dx < 0 ? 1 : -1);
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown, true);
  closeButton.value.focus();
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown, true);
});
</script>

<template>
  <div
    class="projects-gallery-fullscreen"
    role="dialog"
    aria-modal="true"
    :aria-label="`${title} gallery`"
    data-cy="galleryFullscreen"
  >
    <button
      ref="closeButton"
      type="button"
      class="projects-gallery-fullscreen__control projects-gallery-fullscreen__close"
      aria-label="Close fullscreen"
      data-cy="galleryFullscreenClose"
      @click="emit('close')"
    >
      <Icon name="close" class="projects-gallery-fullscreen__icon" />
    </button>

    <div
      class="projects-gallery-fullscreen__stage"
      @touchstart.passive="onTouchStart"
      @touchend="onTouchEnd"
    >
      <!-- Sound and controls here; keyed so another video starts at the top -->
      <video
        v-if="active.type === 'video'"
        :key="index"
        :src="active.src"
        :poster="active.poster"
        :aria-label="label(active, index)"
        class="projects-gallery-fullscreen__item"
        data-cy="galleryFullscreenVideo"
        autoplay
        loop
        playsinline
        controls
      ></video>
      <img
        v-else
        :key="index"
        :src="active.src"
        :alt="label(active, index)"
        class="projects-gallery-fullscreen__item"
        data-cy="galleryFullscreenImage"
      />
    </div>

    <template v-if="hasMany">
      <button
        type="button"
        class="projects-gallery-fullscreen__control projects-gallery-fullscreen__arrow projects-gallery-fullscreen__arrow--prev"
        aria-label="Previous"
        data-cy="galleryPrev"
        @click="step(-1)"
      >
        <Icon name="chevron" class="projects-gallery-fullscreen__icon" />
      </button>
      <button
        type="button"
        class="projects-gallery-fullscreen__control projects-gallery-fullscreen__arrow projects-gallery-fullscreen__arrow--next"
        aria-label="Next"
        data-cy="galleryNext"
        @click="step(1)"
      >
        <Icon name="chevron" class="projects-gallery-fullscreen__icon" />
      </button>

      <div
        class="projects-gallery-fullscreen__thumbs"
        data-cy="galleryFullscreenThumbs"
      >
        <button
          v-for="(item, i) in media"
          :key="item.src"
          type="button"
          class="projects-gallery-fullscreen__thumb"
          :class="{
            'projects-gallery-fullscreen__thumb--active': i === index,
            'projects-gallery-fullscreen__thumb--video': item.type === 'video',
          }"
          :aria-label="`Show ${label(item, i)}`"
          :aria-current="i === index"
          data-cy="galleryFullscreenThumb"
          @click="index = i"
        >
          <img
            :src="item.type === 'video' ? item.poster : item.src"
            alt=""
            class="projects-gallery-fullscreen__thumb-img"
          />
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.projects-gallery-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  background-color: var(--color-gallery-backdrop);
}
.projects-gallery-fullscreen__stage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3.5rem 4.5rem 0.5rem;
}
.projects-gallery-fullscreen__item {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.projects-gallery-fullscreen__control {
  position: absolute;
  z-index: 1;
  display: grid;
  place-items: center;
  padding: 0.6rem;
  border: 0;
  border-radius: 50%;
  background-color: var(--color-gallery-control);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  line-height: 0;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.projects-gallery-fullscreen__control:hover {
  background-color: var(--color-gallery-control-hover);
}
.projects-gallery-fullscreen__icon {
  width: 1.5rem;
  height: 1.5rem;
}
.projects-gallery-fullscreen__icon :deep(path) {
  fill: var(--color-white);
}
.projects-gallery-fullscreen__close {
  top: max(0.75rem, env(safe-area-inset-top));
  right: max(0.75rem, env(safe-area-inset-right));
}
.projects-gallery-fullscreen__arrow {
  top: 50%;
  transform: translateY(-50%);
}
.projects-gallery-fullscreen__arrow--prev {
  left: max(0.75rem, env(safe-area-inset-left));
}
.projects-gallery-fullscreen__arrow--prev .projects-gallery-fullscreen__icon {
  transform: rotate(180deg);
}
.projects-gallery-fullscreen__arrow--next {
  right: max(0.75rem, env(safe-area-inset-right));
}
.projects-gallery-fullscreen__thumbs {
  --thumb-width: 48px;
  --thumb-height: 30px;
  --thumb-grow: 2.5;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem max(0.75rem, env(safe-area-inset-bottom));
}
/* Grown by size, not scale, so the others slide aside in the same motion */
.projects-gallery-fullscreen__thumb {
  position: relative;
  flex-shrink: 0;
  width: var(--thumb-width);
  height: var(--thumb-height);
  padding: 0;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--color-gallery-control);
  cursor: pointer;
  opacity: 0.6;
  transition:
    width 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    border-radius 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.3s ease,
    border-color 0.3s ease;
}
.projects-gallery-fullscreen__thumb--active {
  border-color: var(--color-accent);
  opacity: 1;
}
/* Grows on hover for a better look before switching to it */
@media (hover: hover) {
  /* Always room for a grown thumbnail, so the picture above never jumps */
  .projects-gallery-fullscreen__thumbs {
    box-sizing: content-box;
    height: calc(var(--thumb-height) * var(--thumb-grow));
  }
  .projects-gallery-fullscreen__thumb:hover {
    width: calc(var(--thumb-width) * var(--thumb-grow));
    height: calc(var(--thumb-height) * var(--thumb-grow));
    border-radius: 6px;
    opacity: 1;
  }
}
.projects-gallery-fullscreen__thumb--video::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-40%, -50%);
  border-style: solid;
  border-width: 5px 0 5px 8px;
  border-color: transparent transparent transparent var(--color-white);
  filter: drop-shadow(0 0 2px var(--color-black));
}
.projects-gallery-fullscreen__thumb-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* Phones: the picture gets the width, with the arrows over its edges */
@media (max-width: 600px) {
  .projects-gallery-fullscreen__stage {
    padding: 3.5rem 0.5rem 0.5rem;
  }
}
</style>
