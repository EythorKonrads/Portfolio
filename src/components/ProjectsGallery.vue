<script setup>
import { computed, ref } from 'vue';

// A project's images and videos in its popup: one large item, with
// thumbnails to switch between them when there's more than one
const props = defineProps({
  media: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
});

const activeIndex = ref(0);
const active = computed(() => props.media[activeIndex.value]);
// A looping clip that starts by itself is motion, so wait for a click
const autoplay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const label = (item, index) =>
  item.alt || `${props.title}, ${item.type} ${index + 1}`;
</script>

<template>
  <div class="projects-gallery" data-cy="gallery">
    <div class="projects-gallery__stage">
      <!-- Keyed, so switching to another video starts it from the top -->
      <video
        v-if="active.type === 'video'"
        :key="activeIndex"
        :src="active.src"
        :poster="active.poster"
        :autoplay="autoplay"
        :aria-label="label(active, activeIndex)"
        class="projects-gallery__item"
        data-cy="galleryVideo"
        muted
        loop
        playsinline
        controls
      ></video>
      <img
        v-else
        :key="activeIndex"
        :src="active.src"
        :alt="label(active, activeIndex)"
        class="projects-gallery__item"
        data-cy="galleryImage"
      />
    </div>
    <div
      v-if="media.length > 1"
      class="projects-gallery__thumbs"
      data-cy="galleryThumbs"
    >
      <button
        v-for="(item, index) in media"
        :key="item.src"
        type="button"
        class="projects-gallery__thumb"
        :class="{
          'projects-gallery__thumb--active': index === activeIndex,
          'projects-gallery__thumb--video': item.type === 'video',
        }"
        :aria-label="`Show ${label(item, index)}`"
        :aria-current="index === activeIndex"
        data-cy="galleryThumb"
        @click="activeIndex = index"
      >
        <img
          :src="item.type === 'video' ? item.poster : item.src"
          alt=""
          class="projects-gallery__thumb-img"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.projects-gallery {
  width: 100%;
  flex-shrink: 0;
}
.projects-gallery__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  height: clamp(200px, 45vw, 450px);
  background-color: var(--color-accent-soft);
}
.projects-gallery__item {
  display: block;
  max-width: 100%;
  height: 100%;
  object-fit: contain;
}
.projects-gallery__thumbs {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 2rem 0;
  overflow-x: auto;
}
.projects-gallery__thumb {
  position: relative;
  flex-shrink: 0;
  width: 80px;
  height: 50px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--color-accent-soft);
  cursor: pointer;
  opacity: 0.7;
  transition:
    opacity 0.2s ease,
    border-color 0.2s ease;
}
.projects-gallery__thumb:hover,
.projects-gallery__thumb--active {
  opacity: 1;
}
.projects-gallery__thumb--active {
  border-color: var(--color-accent);
}
/* A play triangle marks the videos */
.projects-gallery__thumb--video::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-40%, -50%);
  border-style: solid;
  border-width: 8px 0 8px 13px;
  border-color: transparent transparent transparent var(--color-white);
  filter: drop-shadow(0 0 3px var(--color-black));
}
.projects-gallery__thumb-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
