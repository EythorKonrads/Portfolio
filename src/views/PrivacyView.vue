<script setup>
import { RouterLink } from 'vue-router';
// Importing it colors the mobile browser bar for the saved theme
import '@/composables/useTheme';

const EMAIL = 'hello@eythorkonrads.com';
</script>

<template>
  <main class="privacy anim-fade-up" data-cy="privacy">
    <RouterLink to="/" class="privacy__back" data-cy="privacyBack"
      >← Back</RouterLink
    >
    <h1 class="privacy__hdln">Privacy</h1>
    <p class="privacy__text">
      This site is run by Eythor Konradsson in Denmark. Questions about your
      data: <a class="privacy__link" :href="`mailto:${EMAIL}`">{{ EMAIL }}</a
      >.
    </p>

    <h2 class="privacy__section-hdln">Ask</h2>
    <p class="privacy__text">When you send a question:</p>
    <ul class="privacy__list">
      <li class="privacy__item">
        <strong class="privacy__lead">The question goes to Anthropic</strong>,
        which runs Claude, the AI that writes the answer. Anthropic processes it
        in the US under the EU Standard Contractual Clauses and keeps it for up
        to 30 days (longer if flagged for misuse).
        <a
          class="privacy__link"
          href="https://www.anthropic.com/legal/privacy"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Anthropic's privacy policy (opens in a new tab)"
          >Anthropic's privacy policy</a
        >
      </li>
      <li class="privacy__item">
        <strong class="privacy__lead"
          >Questions it can't answer are kept for 90 days</strong
        >, with the date, so I can add what's missing to this site. Answered
        questions aren't kept. Please don't include personal details.
      </li>
      <li class="privacy__item">
        <strong class="privacy__lead"
          >A keyed hash of your IP address is kept for one hour</strong
        >
        to limit how many questions one visitor can send. Your IP address itself
        isn't stored.
      </li>
      <li class="privacy__item">
        <strong class="privacy__lead"
          >Cloudflare Turnstile checks you're not a bot</strong
        >
        when you send. Cloudflare also uses those signals to improve its bot
        detection.
        <a
          class="privacy__link"
          href="https://www.cloudflare.com/turnstile-privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Turnstile privacy addendum (opens in a new tab)"
          >Turnstile privacy addendum</a
        >
      </li>
    </ul>
    <p class="privacy__text">
      The legal basis is my legitimate interest in answering questions, keeping
      the site's answers useful, and protecting it from abuse and cost (GDPR
      Art. 6(1)(f)). Ask is optional, and no decisions are made about you.
    </p>
    <p class="privacy__text">
      Your questions and answers are kept in your browser's session storage
      until you close the tab or press Clear chat. They aren't sent anywhere
      else.
    </p>

    <h2 class="privacy__section-hdln">The rest of the site</h2>
    <ul class="privacy__list">
      <li class="privacy__item">
        <strong class="privacy__lead">Theme</strong>: your light or dark choice
        is kept in your browser's local storage.
      </li>
      <li class="privacy__item">
        <strong class="privacy__lead">Scoreboard</strong>: if your game score
        makes the top 10, the initials you enter are shown publicly with the
        score and date, and kept for good.
      </li>
    </ul>

    <h2 class="privacy__section-hdln">Hosting</h2>
    <p class="privacy__text">
      The site runs on Cloudflare, which stores the data above in the EU.
      Deleted data can stay in Cloudflare's database backups for up to 30 days.
      Cloudflare is covered by the EU-US Data Privacy Framework and the Standard
      Contractual Clauses.
    </p>

    <h2 class="privacy__section-hdln">Your rights</h2>
    <p class="privacy__text">
      You can ask to see, correct or delete your data, or object to how it's
      used, by emailing
      <a class="privacy__link" :href="`mailto:${EMAIL}`">{{ EMAIL }}</a
      >. For a saved question, quote it so I can find it. You can also complain
      to Datatilsynet (<a
        class="privacy__link"
        href="https://www.datatilsynet.dk/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="datatilsynet.dk (opens in a new tab)"
        >datatilsynet.dk</a
      >).
    </p>
  </main>
</template>

<style lang="scss" scoped>
/* A comfortable reading width, with the phone gutter the home page uses */
.privacy {
  max-width: 40rem;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}
.privacy__back {
  font-weight: 500;
  color: var(--color-link-muted);
  text-decoration: none;

  &:hover {
    color: var(--color-link-hover);
  }
}
.privacy__hdln {
  margin: 1.5rem 0 1rem;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-hdln);
}
.privacy__section-hdln {
  margin: 2rem 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-hdln);
}
.privacy__text,
.privacy__item {
  margin: 0 0 0.75rem;
}
.privacy__list {
  margin: 0 0 0.75rem;
  padding-left: 1.25rem;
  list-style: disc;
}
.privacy__lead {
  font-weight: 600;
  color: var(--color-hdln);
}
.privacy__link {
  color: var(--color-accent);
  text-decoration: underline;

  &:hover {
    color: var(--color-link-hover);
  }
}
</style>
