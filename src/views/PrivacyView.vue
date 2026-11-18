<script setup>
import { RouterLink } from 'vue-router';
import { useTheme } from '@/composables/useTheme';

// Colors the mobile browser bar for the saved theme, as the home page does
useTheme();

const EMAIL = 'hello@eythorkonrads.com';
</script>

<template>
  <main class="privacy" data-cy="privacy">
    <RouterLink to="/" class="privacy__back" data-cy="privacyBack"
      >← Back</RouterLink
    >
    <h1 class="privacy__hdln">Privacy</h1>
    <p>
      This site is run by Eythor Konradsson in Denmark. Questions about your
      data: <a :href="`mailto:${EMAIL}`">{{ EMAIL }}</a
      >.
    </p>

    <h2>Ask</h2>
    <p>When you send a question:</p>
    <ul>
      <li>
        <strong>The question goes to Anthropic</strong>, which runs Claude, the
        AI that writes the answer. Anthropic processes it in the US under the EU
        Standard Contractual Clauses and keeps it for up to 30 days (longer if
        flagged for misuse).
        <a
          href="https://www.anthropic.com/legal/privacy"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Anthropic's privacy policy (opens in a new tab)"
          >Anthropic's privacy policy</a
        >
      </li>
      <li>
        <strong>Questions it can't answer are kept for 90 days</strong>, with
        the date, so I can add what's missing to this site. Answered questions
        aren't kept. Please don't include personal details.
      </li>
      <li>
        <strong>A keyed hash of your IP address is kept for one hour</strong>
        to limit how many questions one visitor can send. Your IP address itself
        isn't stored.
      </li>
      <li>
        <strong>Cloudflare Turnstile checks you're not a bot</strong> when you
        send. Cloudflare also uses those signals to improve its bot detection.
        <a
          href="https://www.cloudflare.com/turnstile-privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Turnstile privacy addendum (opens in a new tab)"
          >Turnstile privacy addendum</a
        >
      </li>
    </ul>
    <p>
      The legal basis is my legitimate interest in answering questions, keeping
      the site's answers useful, and protecting it from abuse and cost (GDPR
      Art. 6(1)(f)). Ask is optional, and no decisions are made about you.
    </p>
    <p>
      Your questions and answers are kept in your browser's session storage
      until you close the tab or press Clear chat. They aren't sent anywhere
      else.
    </p>

    <h2>The rest of the site</h2>
    <ul>
      <li>
        <strong>Theme</strong>: your light or dark choice is kept in your
        browser's local storage.
      </li>
      <li>
        <strong>Scoreboard</strong>: if your game score makes the top 10, the
        initials you enter are shown publicly with the score and date, and kept
        for good.
      </li>
    </ul>

    <h2>Hosting</h2>
    <p>
      The site runs on Cloudflare, which stores the data above in the EU.
      Deleted data can stay in Cloudflare's database backups for up to 30 days.
      Cloudflare is covered by the EU-US Data Privacy Framework and the Standard
      Contractual Clauses.
    </p>

    <h2>Your rights</h2>
    <p>
      You can ask to see, correct or delete your data, or object to how it's
      used, by emailing <a :href="`mailto:${EMAIL}`">{{ EMAIL }}</a
      >. For a saved question, quote it so I can find it. You can also complain
      to Datatilsynet (<a
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

  h2 {
    margin: 2rem 0 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-hdln);
  }
  p,
  li {
    margin: 0 0 0.75rem;
  }
  ul {
    margin: 0 0 0.75rem;
    padding-left: 1.25rem;
    list-style: disc;
  }
  strong {
    font-weight: 600;
    color: var(--color-hdln);
  }
  a {
    color: var(--color-accent);
    text-decoration: underline;
  }
  a:hover {
    color: var(--color-link-hover);
  }
}
.privacy__hdln {
  margin: 1.5rem 0 1rem;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-hdln);
}
.privacy .privacy__back {
  font-weight: 500;
  color: var(--color-link-muted);
  text-decoration: none;
}
</style>
