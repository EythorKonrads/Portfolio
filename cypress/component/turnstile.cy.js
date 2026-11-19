// The Turnstile composable, against a stubbed window.turnstile. The script
// request is intercepted, so no test loads the real script.
import { effectScope } from 'vue';
import { useTurnstile } from '../../src/composables/useTurnstile.js';

const SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// A fake Turnstile. `mode` sets what a run does: 'pass' calls back with a new
// token, 'error' calls the error callback, 'interactive' asks for a visible
// check, 'hang' never answers, 'throw' makes render throw.
function stubTurnstile(win, mode = 'pass') {
  const widgets = {};
  let tokens = 0;
  const run = (id) =>
    queueMicrotask(() => {
      const options = widgets[id].options;
      if (mode === 'pass') options.callback(`token-${++tokens}`);
      if (mode === 'error') options['error-callback']('110100');
      if (mode === 'interactive') options['before-interactive-callback']();
    });
  const turnstile = {
    render: cy.stub().callsFake((container, options) => {
      if (mode === 'throw') throw new Error('Invalid sitekey');
      const id = `widget-${Object.keys(widgets).length + 1}`;
      widgets[id] = { container, options };
      // An interactive widget runs as soon as it's rendered
      if (options.execution !== 'execute') run(id);
      return id;
    }),
    execute: cy.stub().callsFake(run),
    reset: cy.stub(),
    remove: cy.stub(),
  };
  win.turnstileStub = turnstile;
  return turnstile;
}

// The script's response puts the stub in place, as the real script would
const serveScript = () =>
  cy
    .intercept(SCRIPT_URL, {
      body: 'window.turnstile = window.turnstileStub;',
      headers: { 'content-type': 'application/javascript' },
    })
    .as('script');

describe('Turnstile', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      delete win.turnstile;
      win.document
        .querySelectorAll(`script[src="${SCRIPT_URL}"]`)
        .forEach((script) => script.remove());
    });
  });

  it('loads the script only on the first call and returns a token', () => {
    serveScript();
    cy.window().then((win) => {
      stubTurnstile(win);
      const { getToken } = useTurnstile();
      expect(win.document.querySelector(`script[src="${SCRIPT_URL}"]`)).to.be
        .null;
      cy.wrap(getToken()).should('equal', 'token-1');
    });
    cy.get('@script.all').should('have.length', 1);
  });

  it('resets the widget for a fresh token on the next call', () => {
    serveScript();
    cy.window().then((win) => {
      const turnstile = stubTurnstile(win);
      const { getToken } = useTurnstile();
      cy.wrap(getToken()).should('equal', 'token-1');
      cy.then(() => getToken()).should('equal', 'token-2');
      cy.then(() => {
        expect(turnstile.render).to.have.been.calledOnce;
        expect(turnstile.reset).to.have.been.calledOnceWith('widget-1');
      });
    });
    cy.get('@script.all').should('have.length', 1);
  });

  // Resolves with the error's reason, or fails if the promise resolves
  const reasonOf = (promise) =>
    promise.then(
      () => {
        throw new Error('expected a rejection');
      },
      (error) => error.reason
    );

  it('rejects when the script fails to load', () => {
    cy.intercept(SCRIPT_URL, { forceNetworkError: true });
    cy.window().then((win) => {
      stubTurnstile(win);
      const { getToken } = useTurnstile();
      cy.wrap(reasonOf(getToken())).should('equal', 'load');
    });
  });

  it('rejects on a widget error', () => {
    serveScript();
    cy.window().then((win) => {
      stubTurnstile(win, 'error');
      const { getToken } = useTurnstile();
      cy.wrap(reasonOf(getToken())).should('equal', 'widget');
    });
  });

  it('rejects when the widget fails to render', () => {
    serveScript();
    cy.window().then((win) => {
      const turnstile = stubTurnstile(win, 'throw');
      const slot = win.document.createElement('div');
      win.document.body.append(slot);
      const { getToken, getInteractiveToken } = useTurnstile();
      cy.wrap(reasonOf(getToken())).should('equal', 'widget');
      cy.then(() => reasonOf(getInteractiveToken(slot))).should(
        'equal',
        'widget'
      );
      cy.then(() => expect(turnstile.remove).not.to.have.been.called);
    });
  });

  it('rejects when Turnstile takes too long', () => {
    serveScript();
    cy.clock();
    cy.window().then((win) => {
      const turnstile = stubTurnstile(win, 'hang');
      const { getToken } = useTurnstile();
      const reason = reasonOf(getToken());
      // Wait for the run to start, then jump past the timeout
      cy.wrap(turnstile.execute).should('have.been.called');
      cy.tick(15_000);
      cy.wrap(reason).should('equal', 'timeout');
    });
  });

  it('rejects when Turnstile needs a visible check', () => {
    serveScript();
    cy.window().then((win) => {
      stubTurnstile(win, 'interactive');
      const { getToken } = useTurnstile();
      cy.wrap(reasonOf(getToken())).should('equal', 'interactive');
    });
  });

  it('renders the visible check into the slot and resolves once it passes', () => {
    serveScript();
    cy.window().then((win) => {
      const turnstile = stubTurnstile(win);
      const slot = win.document.createElement('div');
      win.document.body.append(slot);
      const { getInteractiveToken } = useTurnstile();
      cy.wrap(getInteractiveToken(slot)).should('equal', 'token-1');
      cy.then(() => {
        expect(turnstile.render).to.have.been.calledOnce;
        const [container, options] = turnstile.render.firstCall.args;
        expect(container).to.equal(slot);
        expect(options.sitekey).to.equal('1x00000000000000000000AA');
        expect(options.execution).to.be.undefined;
      });
    });
  });

  it('rejects when the visible check errors', () => {
    serveScript();
    cy.window().then((win) => {
      stubTurnstile(win, 'error');
      const slot = win.document.createElement('div');
      win.document.body.append(slot);
      const { getInteractiveToken } = useTurnstile();
      cy.wrap(reasonOf(getInteractiveToken(slot))).should('equal', 'widget');
    });
  });

  it('removes its hidden widget when the component using it unmounts', () => {
    serveScript();
    cy.window().then((win) => {
      const turnstile = stubTurnstile(win);
      const scope = effectScope();
      const { getToken } = scope.run(() => useTurnstile());
      cy.wrap(getToken()).should('equal', 'token-1');
      cy.then(() => {
        const container = turnstile.render.firstCall.args[0];
        scope.stop();
        expect(turnstile.remove).to.have.been.calledOnceWith('widget-1');
        expect(container.isConnected).to.be.false;
      });
    });
  });
});
