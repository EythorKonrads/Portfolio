// Cloudflare Turnstile for Ask. The script loads on the first call, never on
// page load, and each call gets a fresh token for one submit.
//
// getToken() runs an invisible widget. When Turnstile needs a visible check it
// rejects with reason 'interactive'; the caller then shows a slot (as it does
// after a 403) and calls getInteractiveToken(slot), which renders the visible
// widget (300x65) there and resolves once it passes. Other failures reject with
// reason 'load', 'widget' or 'timeout', so the caller can show Unavailable.
import { getCurrentScope, onScopeDispose } from 'vue';

const SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TIMEOUT_MS = 15_000;

// Cloudflare's always-pass test key
const TEST_SITE_KEY = '1x00000000000000000000AA';
// TODO: the production site key isn't posted on issue 159 (Ask: account
// setup) yet. Until it is, production renders fail, so Ask shows Unavailable.
const PRODUCTION_SITE_KEY = 'PRODUCTION_SITE_KEY_NOT_SET';
const SITE_KEY = import.meta.env.DEV ? TEST_SITE_KEY : PRODUCTION_SITE_KEY;

const failure = (reason) =>
  Object.assign(new Error(`Turnstile: ${reason}`), { reason });

function loadScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve, reject) => {
    // Calls made while the script loads share its tag
    let script = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      document.head.append(script);
    }
    script.addEventListener('load', () =>
      window.turnstile ? resolve(window.turnstile) : reject(failure('load'))
    );
    script.addEventListener('error', () => {
      // So the next call tries again
      script.remove();
      reject(failure('load'));
    });
  });
}

function withTimeout(promise) {
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(failure('timeout')), TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export function useTurnstile() {
  let widgetId = null;
  let container = null;
  // The current call's resolve and reject, which the widget's callbacks settle
  let pending = null;
  const settle = (outcome, value) => {
    pending?.[outcome](value);
    pending = null;
  };

  async function run() {
    const turnstile = await loadScript();
    return new Promise((resolve, reject) => {
      pending = { resolve, reject };
      if (widgetId === null) {
        container = document.createElement('div');
        document.body.append(container);
        widgetId = turnstile.render(container, {
          sitekey: SITE_KEY,
          execution: 'execute',
          appearance: 'interaction-only',
          // Errors reject at once instead of Turnstile retrying
          retry: 'never',
          callback: (token) => settle('resolve', token),
          'error-callback': () => {
            settle('reject', failure('widget'));
            // Tells Turnstile the error is handled
            return true;
          },
          'before-interactive-callback': () => {
            settle('reject', failure('interactive'));
            // Keeps the hidden widget from showing its check
            turnstile.reset(widgetId);
          },
        });
      } else {
        // A token is good for one submit
        turnstile.reset(widgetId);
      }
      turnstile.execute(widgetId);
    });
  }

  const getToken = () =>
    withTimeout(run()).finally(() => {
      pending = null;
    });

  async function getInteractiveToken(slot) {
    const turnstile = await withTimeout(loadScript());
    let id;
    return new Promise((resolve, reject) => {
      id = turnstile.render(slot, {
        sitekey: SITE_KEY,
        retry: 'never',
        callback: resolve,
        'error-callback': () => {
          reject(failure('widget'));
          return true;
        },
        // The visitor didn't finish the check in time
        'timeout-callback': () => reject(failure('timeout')),
      });
    }).finally(() => turnstile.remove(id));
  }

  // So a remounted Ask section doesn't leave hidden widgets behind
  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (widgetId !== null) window.turnstile?.remove(widgetId);
      container?.remove();
    });
  }

  return { getToken, getInteractiveToken };
}
