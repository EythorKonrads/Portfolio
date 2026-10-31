<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import GameLaunchButton from './GameLaunchButton.vue';

// Each entry matches the id on the section component's root element
const sections = [
  { id: 'experience', title: 'Experience' },
  { id: 'education', title: 'Education' },
  { id: 'projects', title: 'Projects' },
];
// How far below the nav a section top can sit and still count as current
const ACTIVE_TOLERANCE_PX = 8;
const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'];

const nav = ref(null);
const activeId = ref(sections[0].id);
// Set after a click: the clicked link stays active while we scroll to it,
// since sections near the end can't scroll all the way up to the nav
let isLocked = false;

function unlock() {
  isLocked = false;
}

function scrollToSection(id) {
  activeId.value = id;
  isLocked = true;
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  // scroll-margin-top on the sections keeps them clear of the sticky header
  document.getElementById(id)?.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start',
  });
}

// The current section is the last one whose top has reached the nav.
// At the very bottom it's the last section, even if it can't reach the nav.
function updateActive(event) {
  if (isLocked) return;
  const target = event?.target;
  const isPageScroll = !target || target === document;
  // Ignore other scrollers, e.g. an open popup
  if (!isPageScroll && !target.contains?.(nav.value)) return;

  const scroller = isPageScroll ? document.scrollingElement : target;
  const isAtBottom =
    scroller.scrollTop > 0 &&
    scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
  if (isAtBottom) {
    activeId.value = sections[sections.length - 1].id;
    return;
  }

  const line = nav.value.getBoundingClientRect().bottom + ACTIVE_TOLERANCE_PX;
  activeId.value = sections.reduce((current, { id }) => {
    const top = document.getElementById(id)?.getBoundingClientRect().top;
    return top !== undefined && top <= line ? id : current;
  }, sections[0].id);
}

onMounted(() => {
  // Capture so scrolls of the content column reach us as well as the page's
  document.addEventListener('scroll', updateActive, {
    capture: true,
    passive: true,
  });
  window.addEventListener('resize', updateActive, { passive: true });
  // Any scrolling the user does themselves hands control back to the scroll spy
  USER_SCROLL_EVENTS.forEach((type) =>
    window.addEventListener(type, unlock, { passive: true })
  );
  updateActive();
});

onBeforeUnmount(() => {
  document.removeEventListener('scroll', updateActive, { capture: true });
  window.removeEventListener('resize', updateActive);
  USER_SCROLL_EVENTS.forEach((type) =>
    window.removeEventListener(type, unlock)
  );
});
</script>

<template>
  <nav ref="nav" class="section-nav" aria-label="Sections" data-cy="sectionNav">
    <ul v-reveal class="section-nav__list">
      <li v-for="{ id, title } in sections" :key="id">
        <a
          :href="`#${id}`"
          class="section-nav__link"
          :class="{ 'section-nav__link--active': activeId === id }"
          :aria-current="activeId === id ? 'location' : undefined"
          data-cy="navLink"
          :data-section="id"
          @click.prevent="scrollToSection(id)"
        >
          {{ title }}
        </a>
      </li>
      <li>
        <GameLaunchButton class="section-nav__link" />
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.section-nav {
  /* Fill the header's height so its bottom edge is the header's */
  align-self: stretch;
  display: flex;
  align-items: center;
  min-width: 0;
}
.section-nav__list {
  display: flex;
  gap: 1.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
  white-space: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
}
.section-nav__link {
  position: relative;
  display: inline-block;
  padding: 0.25em 0;
  font-weight: 500;
  color: var(--color-link);
  transition: color 0.25s ease;
}
.section-nav__link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 1px;
  background-color: var(--color-link-hover);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.3s var(--anim-ease);
}
.section-nav__link:hover,
.section-nav__link--active {
  color: var(--color-link-hover);
}
.section-nav__link--active::after {
  transform: scaleX(1);
}
@media (prefers-reduced-motion: reduce) {
  .section-nav__link::after {
    transition: none;
  }
}
@media screen and (max-width: 600px) {
  .section-nav__list {
    gap: 1rem;
    font-size: 0.875rem;
  }
}
/* Room for the theme toggle and filter on the smallest phones */
@media screen and (max-width: 360px) {
  .section-nav__list {
    gap: 0.75rem;
    font-size: 0.8125rem;
  }
}
</style>
