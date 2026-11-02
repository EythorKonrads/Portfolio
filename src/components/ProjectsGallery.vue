<script setup>
import { computed, nextTick, ref } from 'vue';

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

const isFullscreen = ref(false);
const fullscreenButton = ref(null);
// Back to where keyboard users left off
async function closeFullscreen() {
  isFullscreen.value = false;
  await nextTick();
  fullscreenButton.value.focus();
}
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
      <button
        ref="fullscreenButton"
        type="button"
        class="projects-gallery__fullscreen"
        aria-label="Show fullscreen"
        data-cy="galleryFullscreenOpen"
        @click="isFullscreen = true"
      >
        <Icon name="expand" class="projects-gallery__fullscreen-icon" />
      </button>
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
    <!-- On <body>: the popup's transform would pin it inside the popup -->
    <Teleport v-if="isFullscreen" to="body">
      <ProjectsGalleryFullscreen
        v-model:index="activeIndex"
        :media="media"
        :title="title"
        :label="label"
        @close="closeFullscreen"
      />
    </Teleport>
  </div>
</template>

<style scoped>
.projects-gallery {
  width: 100%;
  flex-shrink: 0;
}
.projects-gallery__stage {
  position: relative;
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
.projects-gallery__fullscreen {
  /* Top left: the video's controls take the bottom, the popup's close the
     top right. Same size and inset as that close button. */
  position: absolute;
  top: 1.75rem;
  left: 1.75rem;
  display: grid;
  place-items: center;
  padding: 0.4rem;
  border: 0;
  border-radius: 50%;
  background-color: var(--color-popup-button);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  line-height: 0;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.projects-gallery__fullscreen:hover {
  background-color: var(--color-popup-button-hover);
}
.projects-gallery__fullscreen-icon {
  width: 1.5rem;
  height: 1.5rem;
}
.projects-gallery__fullscreen-icon :deep(path) {
  fill: var(--color-popup-button-icon);
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
