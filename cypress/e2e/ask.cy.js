import pool from '../../src/assets/ask-suggestions.json';

// The Ask section, with /api/ask stubbed by cy.intercept and window.turnstile
// stubbed, so no test calls Claude or Turnstile
const UNKNOWN =
  "I don't know that one. Ask Eythor directly at hello@eythorkonrads.com.";

// A fake Turnstile. Its invisible widget passes at once, or with
// `interactive` asks for a visible check instead. A visible widget waits
// until the test calls window.passTurnstileCheck().
function stubTurnstile({ interactive = false } = {}) {
  cy.window().then((win) => {
    let tokens = 0;
    const widgets = {};
    const pass = (id) =>
      queueMicrotask(() => widgets[id].callback(`token-${++tokens}`));
    win.turnstile = {
      render: cy.stub().callsFake((container, options) => {
        const id = `widget-${Object.keys(widgets).length + 1}`;
        widgets[id] = options;
        if (options.execution !== 'execute') {
          container.setAttribute('data-cy', 'turnstileWidget');
          win.passTurnstileCheck = () => pass(id);
        }
        return id;
      }),
      execute: cy.stub().callsFake((id) => {
        if (interactive) widgets[id]['before-interactive-callback']();
        else pass(id);
      }),
      reset: cy.stub(),
      remove: cy.stub(),
    };
  });
}

const visitAsk = (options, turnstile) => {
  cy.visitHome(options);
  stubTurnstile(turnstile);
};

// Puts a chat in sessionStorage and reloads, as if asked earlier in the tab
const seedHistory = (entries) => {
  cy.window().then((win) =>
    win.sessionStorage.setItem('ask-history', JSON.stringify(entries))
  );
  cy.reload();
  stubTurnstile();
};

const answer = (body, delay = 0) =>
  cy.intercept('POST', '/api/ask', { statusCode: 200, body, delay }).as('ask');

const type = (text) => cy.get('[data-cy="askInput"]').type(text);
const send = (text) => type(`${text}{enter}`);

const UNAVAILABLE =
  "Ask isn't working right now. Try again later, or email hello@eythorkonrads.com.";
const expectUnavailable = (question) => {
  cy.get('[data-cy="askAlert"]')
    .should('contain.text', UNAVAILABLE)
    .find('a')
    .should('have.attr', 'href', 'mailto:hello@eythorkonrads.com');
  cy.get('[data-cy="askThinking"]').should('not.exist');
  cy.get('[data-cy="askAnswer"]').should('not.exist');
  cy.get('[data-cy="askInput"]').should('have.value', question);
};

const rect = ($el) => $el[0].getBoundingClientRect();
const isAtBottom = ($el) =>
  $el[0].scrollTop + $el[0].clientHeight >= $el[0].scrollHeight - 2;

describe('Ask', () => {
  it('shows the answer to a question', () => {
    answer({ status: 'answered', answer: 'Eythor works mostly with Vue.' });
    visitAsk();
    send('What is his strongest stack?');
    cy.wait('@ask').its('request.body').should('deep.eq', {
      question: 'What is his strongest stack?',
      token: 'token-1',
    });
    cy.get('[data-cy="askQuestion"]').should(
      'have.text',
      'What is his strongest stack?'
    );
    cy.get('[data-cy="askAnswer"]').should(
      'have.text',
      'Eythor works mostly with Vue.'
    );
  });

  it('shows an unknown answer in italics, with the email as a mailto link', () => {
    answer({ status: 'unknown', answer: UNKNOWN });
    visitAsk();
    send('What is his salary?');
    cy.get('[data-cy="askAnswer"]')
      .should('have.text', UNKNOWN)
      .and('have.css', 'font-style', 'italic')
      .find('a')
      .should('have.attr', 'href', 'mailto:hello@eythorkonrads.com')
      .and('have.text', 'hello@eythorkonrads.com');
  });

  it('shows an off-topic answer as it comes', () => {
    const offTopic = 'I only answer questions about Eythor and his work.';
    answer({ status: 'offTopic', answer: offTopic });
    visitAsk();
    send('What is the capital of France?');
    cy.get('[data-cy="askAnswer"]')
      .should('have.text', offTopic)
      .and('have.css', 'font-style', 'normal');
  });

  it('sends on Enter and adds a line on Shift+Enter', () => {
    answer({ status: 'answered', answer: 'Yes.' });
    visitAsk();
    type('Has he led{shift+enter}a team?');
    cy.get('[data-cy="askInput"]').should('have.value', 'Has he led\na team?');
    cy.get('[data-cy="askAnswer"]').should('not.exist');
    type('{enter}');
    cy.wait('@ask')
      .its('request.body.question')
      .should('eq', 'Has he led\na team?');
    cy.get('[data-cy="askInput"]').should('have.value', '').and('be.focused');
  });

  it('trims a question and never sends an empty one', () => {
    answer({ status: 'answered', answer: 'Yes.' });
    visitAsk();
    type('   {enter}');
    cy.get('[data-cy="askSend"]').should('be.disabled');
    cy.get('[data-cy="askThinking"]').should('not.exist');
    cy.get('[data-cy="askEmpty"]').should('be.visible');
    cy.get('[data-cy="askInput"]').clear();
    send('  Has he led a team?  ');
    cy.wait('@ask')
      .its('request.body.question')
      .should('eq', 'Has he led a team?');
    cy.get('@ask.all').should('have.length', 1);
  });

  it('shows "Thinking…" while waiting and disables Send', () => {
    answer({ status: 'answered', answer: 'Yes.' }, 500);
    visitAsk();
    send('Has he led a team?');
    cy.get('[data-cy="askThinking"]').should('contain.text', 'Thinking…');
    type('Another');
    cy.get('[data-cy="askSend"]').should('be.disabled');
    cy.get('[data-cy="askInput"]').should('not.be.disabled');
    cy.get('[data-cy="askAnswer"]').should('have.text', 'Yes.');
    cy.get('[data-cy="askThinking"]').should('not.exist');
    cy.get('[data-cy="askSend"]').should('not.be.disabled');
  });

  it('caps a question at 300 characters and warns from 280', () => {
    visitAsk();
    cy.get('[data-cy="askInput"]').should('have.attr', 'maxlength', '300');
    cy.get('[data-cy="askCounter"]').should('have.text', '0/300');
    cy.get('[data-cy="askCounter"]').then(($counter) => {
      const normal = getComputedStyle($counter[0]).color;
      cy.get('[data-cy="askInput"]')
        .invoke('val', 'a'.repeat(279))
        .trigger('input');
      cy.get('[data-cy="askCounter"]')
        .should('have.text', '279/300')
        .and('have.css', 'color', normal);
      type('a');
      cy.get('[data-cy="askCounter"]')
        .should('have.text', '280/300')
        .and('have.css', 'font-weight', '600')
        .and('not.have.css', 'color', normal);
    });
  });

  context('when Ask is unavailable', () => {
    [
      ['a 503', { statusCode: 503, body: { error: 'unavailable' } }],
      ['a 500', { statusCode: 500, body: {} }],
      ['a reply that is not JSON', { statusCode: 200, body: '<h1>1102</h1>' }],
      ['a network error', { forceNetworkError: true }],
      ['a 422 that slips past', { statusCode: 422, body: { error: 'length' } }],
    ].forEach(([name, reply]) => {
      it(`shows Unavailable and gives the question back on ${name}`, () => {
        cy.intercept('POST', '/api/ask', reply).as('ask');
        visitAsk();
        send('Has he led a team?');
        cy.wait('@ask');
        expectUnavailable('Has he led a team?');
      });
    });

    it('clears the message once the next question is answered', () => {
      cy.intercept('POST', '/api/ask', { statusCode: 503, body: {} });
      visitAsk();
      send('Has he led a team?');
      expectUnavailable('Has he led a team?');
      answer({ status: 'answered', answer: 'Yes.' });
      type('{enter}');
      cy.get('[data-cy="askAnswer"]').should('have.text', 'Yes.');
      cy.get('[data-cy="askAlert"]').should('not.exist');
    });
  });

  context('at a limit', () => {
    const retryAt = '2026-11-19T15:00:00.000Z';
    const now = Date.parse(retryAt) - 30 * 60 * 1000;

    [
      [
        'hourLimit',
        "You've hit the limit of 20 questions an hour. You can ask again at {time}.",
      ],
      [
        'dayLimit',
        "Ask has answered all the questions it can for today. It's back at {time}, or email hello@eythorkonrads.com.",
      ],
    ].forEach(([error, message]) => {
      it(`shows the ${error} message and hides the input until retryAt`, () => {
        cy.clock(now, ['Date', 'setTimeout', 'clearTimeout']);
        cy.intercept('POST', '/api/ask', {
          statusCode: 429,
          body: { error, retryAt },
        }).as('ask');
        visitAsk();
        send('Has he led a team?');
        cy.wait('@ask');
        cy.window().then((win) => {
          const time = new win.Intl.DateTimeFormat(undefined, {
            timeStyle: 'short',
          }).format(new Date(retryAt));
          cy.get('[data-cy="askAlert"]').should(
            'contain.text',
            message.replace('{time}', time)
          );
        });
        cy.get('[data-cy="askForm"]').should('not.exist');
        cy.get('[data-cy="askChip"]').should('not.exist');

        cy.tick(30 * 60 * 1000 - 1000);
        cy.get('[data-cy="askForm"]').should('not.exist');
        cy.tick(1000);
        cy.get('[data-cy="askAlert"]').should('not.exist');
        cy.get('[data-cy="askInput"]').should('be.visible');
      });
    });
  });

  context('Turnstile', () => {
    const question = 'Has he led a team?';
    const expectCheck = () => {
      cy.get('[data-cy="askTurnstile"]')
        .should('contain.text', `One quick check before we send “${question}”`)
        .find('[data-cy="turnstileWidget"]')
        .should('exist');
      cy.get('[data-cy="askForm"]').should('not.exist');
    };

    it('shows the visible check once after a 403, then sends again', () => {
      answer({ status: 'answered', answer: 'Yes.' });
      cy.intercept(
        { method: 'POST', url: '/api/ask', times: 1 },
        { statusCode: 403, body: { error: 'turnstile' } }
      );
      visitAsk();
      send(question);
      expectCheck();
      cy.window().invoke('passTurnstileCheck');
      cy.wait('@ask').its('request.body.token').should('eq', 'token-2');
      cy.get('[data-cy="askAnswer"]').should('have.text', 'Yes.');
      cy.get('[data-cy="askTurnstile"]').should('not.exist');
      cy.get('[data-cy="askInput"]').should('be.visible');
    });

    it('shows Unavailable on a second 403', () => {
      cy.intercept('POST', '/api/ask', {
        statusCode: 403,
        body: { error: 'turnstile' },
      }).as('ask');
      visitAsk();
      send(question);
      expectCheck();
      cy.window().invoke('passTurnstileCheck');
      expectUnavailable(question);
      cy.get('@ask.all').should('have.length', 2);
      cy.get('[data-cy="askTurnstile"]').should('not.exist');
    });

    it('shows Unavailable, not a second check, on a 403 after a visible check', () => {
      cy.intercept('POST', '/api/ask', {
        statusCode: 403,
        body: { error: 'turnstile' },
      }).as('ask');
      visitAsk({}, { interactive: true });
      send(question);
      expectCheck();
      cy.window().invoke('passTurnstileCheck');
      expectUnavailable(question);
      cy.get('@ask.all').should('have.length', 1);
      cy.get('[data-cy="askTurnstile"]').should('not.exist');
    });

    it('shows the visible check when Turnstile asks for one', () => {
      answer({ status: 'answered', answer: 'Yes.' });
      visitAsk({}, { interactive: true });
      send(question);
      expectCheck();
      cy.get('@ask.all').should('have.length', 0);
      cy.window().invoke('passTurnstileCheck');
      cy.get('[data-cy="askAnswer"]').should('have.text', 'Yes.');
    });
  });

  context('suggested questions', () => {
    it('sends a chip, hides the chips while loading, and never repeats it', () => {
      answer({ status: 'answered', answer: 'Yes.' }, 500);
      visitAsk();
      cy.get('[data-cy="askChip"]').should('have.length', 3);
      cy.get('[data-cy="askChip"]')
        .first()
        .invoke('text')
        .then((text) => {
          const asked = text.trim();
          cy.get('[data-cy="askChip"]').first().click();
          cy.get('[data-cy="askThinking"]').should('exist');
          cy.get('[data-cy="askChip"]').should('not.exist');
          cy.wait('@ask').its('request.body.question').should('eq', asked);
          cy.get('[data-cy="askAnswer"]').should('have.text', 'Yes.');
          cy.get('[data-cy="askChip"]')
            .should('have.length', 3)
            .each(($chip) => expect($chip.text().trim()).not.to.eq(asked));
        });
    });

    it('only suggests questions not asked yet', () => {
      visitAsk();
      seedHistory(
        pool
          .slice(2)
          .map((question) => ({ question, status: 'answered', answer: 'Yes.' }))
      );
      cy.get('[data-cy="askChip"]').should(($chips) => {
        expect(
          [...$chips].map((chip) => chip.innerText.trim()).sort()
        ).to.deep.eq(pool.slice(0, 2).sort());
      });
    });
  });

  context('history', () => {
    const entry = {
      question: 'Has he led a team?',
      status: 'answered',
      answer: 'Yes.',
    };

    it('survives a reload and a trip to /privacy and back', () => {
      answer({ status: 'answered', answer: 'Yes.' });
      visitAsk();
      send(entry.question);
      cy.get('[data-cy="askAnswer"]').should('have.text', 'Yes.');
      cy.reload();
      cy.get('[data-cy="askQuestion"]').should('have.text', entry.question);
      cy.get('[data-cy="askAnswer"]').should('have.text', 'Yes.');
      cy.get('[data-cy="askPrivacy"]').click();
      cy.location('pathname').should('eq', '/privacy');
      cy.get('[data-cy="privacyBack"]').click();
      cy.get('[data-cy="askAnswer"]').should('have.text', 'Yes.');
    });

    it('empties it with Clear chat, shown only when there is history', () => {
      visitAsk();
      cy.get('[data-cy="askClear"]').should('not.exist');
      seedHistory([entry]);
      cy.get('[data-cy="askClear"]')
        .should('contain.text', 'Clear chat')
        .click();
      cy.get('[data-cy="askAnswer"]').should('not.exist');
      cy.get('[data-cy="askEmpty"]').should('be.visible');
      cy.get('[data-cy="askClear"]').should('not.exist');
      cy.reload();
      cy.get('[data-cy="askEmpty"]').should('be.visible');
    });
  });

  [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'mobile', width: 375, height: 812 },
  ].forEach(({ name, width, height }) => {
    context(`thread scrolling on ${name}`, () => {
      const earlier = Array.from({ length: 12 }, (_, i) => ({
        question: `Question ${i + 1}?`,
        status: 'answered',
        answer: 'An answer long enough to take up a line or two of the thread.',
      }));

      beforeEach(() => {
        cy.viewport(width, height);
        visitAsk({ reducedMotion: true });
        seedHistory(earlier);
        cy.get('[data-cy="ask"]').scrollIntoView();
      });

      it('opens a restored chat at its latest answer', () => {
        cy.get('[data-cy="askThread"]').should(($thread) => {
          expect($thread[0].scrollHeight).to.be.greaterThan(
            $thread[0].clientHeight
          );
          expect(isAtBottom($thread)).to.be.true;
        });
      });

      it('follows the answer when the visitor is at the bottom', () => {
        answer({ status: 'answered', answer: 'Yes.' }, 300);
        send('Has he led a team?');
        cy.get('[data-cy="askThinking"]').should('be.visible');
        cy.get('[data-cy="askAnswer"]').last().should('have.text', 'Yes.');
        cy.get('[data-cy="askThread"]').should(
          ($thread) => expect(isAtBottom($thread)).to.be.true
        );
        cy.get('[data-cy="askNewPill"]').should('not.exist');
      });

      it('shows "New message ↓" when the visitor scrolled up', () => {
        answer({ status: 'answered', answer: 'Yes.' }, 1000);
        send('Has he led a team?');
        cy.get('[data-cy="askThread"]').should(
          ($thread) => expect(isAtBottom($thread)).to.be.true
        );
        cy.get('[data-cy="askThread"]').scrollTo('top');
        cy.get('[data-cy="askAnswer"]').last().should('have.text', 'Yes.');
        cy.get('[data-cy="askNewPill"]')
          .should('contain.text', 'New message ↓')
          .click();
        cy.get('[data-cy="askThread"]').should(
          ($thread) => expect(isAtBottom($thread)).to.be.true
        );
        cy.get('[data-cy="askNewPill"]').should('not.exist');
      });

      it('has no horizontal overflow', () => {
        cy.assertNoHorizontalOverflow();
      });
    });
  });

  it('stays within the screen on a 360px phone', () => {
    cy.viewport(360, 780);
    visitAsk();
    cy.get('[data-cy="askSend"]').should(($send) => {
      expect(rect($send).right).to.be.at.most(
        $send[0].ownerDocument.documentElement.clientWidth
      );
    });
    cy.assertNoHorizontalOverflow();
  });
});
