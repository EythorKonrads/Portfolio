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

// Options both widgets share. `onToken` and `fail` settle the current call.
const widgetOptions = (onToken, fail) => ({
  sitekey: SITE_KEY,
  // Errors reject at once instead of Turnstile retrying
  retry: 'never',
  callback: onToken,
  'error-callback': () => {
    fail(failure('widget'));
    // Tells Turnstile the error is handled
    return true;
  },
});

export function useTurnstile() {
  let widgetId = null;
  let container = null;
  // The hidden widget's callbacks outlive one call, so they settle this one
  let pending = null;

  async function executeHiddenWidget() {
    const turnstile = await loadScript();
    return new Promise((resolve, reject) => {
      pending = { resolve, reject };
      try {
        if (widgetId === null) {
          container ??= document.body.appendChild(
            document.createElement('div')
          );
          widgetId = turnstile.render(container, {
            ...widgetOptions(
              (token) => pending?.resolve(token),
              (error) => pending?.reject(error)
            ),
            execution: 'execute',
            appearance: 'interaction-only',
            'before-interactive-callback': () => {
              pending?.reject(failure('interactive'));
              // Keeps the hidden widget from showing its check
              turnstile.reset(widgetId);
            },
          });
        } else {
          // A token is good for one submit
          turnstile.reset(widgetId);
        }
        turnstile.execute(widgetId);
      } catch {
        // Turnstile throws on bad input, such as an unknown site key
        reject(failure('widget'));
      }
    });
  }

  const getToken = () =>
    withTimeout(executeHiddenWidget()).finally(() => {
      pending = null;
    });

  async function getInteractiveToken(slot) {
    const turnstile = await withTimeout(loadScript());
    let id;
    return new Promise((resolve, reject) => {
      try {
        id = turnstile.render(slot, {
          ...widgetOptions(resolve, reject),
          // The visitor didn't finish the check in time
          'timeout-callback': () => reject(failure('timeout')),
        });
      } catch {
        reject(failure('widget'));
      }
    }).finally(() => {
      if (id !== undefined) turnstile.remove(id);
    });
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
