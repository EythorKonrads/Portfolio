// Ask's API (worker/ask.mjs) with in-memory stores and stubbed Turnstile,
// Claude, IP hash and clock, so nothing here calls a real service
import {
  UNKNOWN_TEXT,
  cleanup,
  handleAsk,
  ipHasher,
  turnstileVerifier,
} from '../../worker/ask.mjs';

const NOW = new Date('2026-11-18T14:25:00.000Z');

const memoryCounters = (rows = {}) => ({
  rows,
  increment: async (key, expiresAt) => {
    rows[key] = { count: (rows[key]?.count ?? 0) + 1, expiresAt };
    return rows[key].count;
  },
});
const memoryQuestions = (rows = []) => ({
  rows,
  add: async (row) => rows.push(row),
});

const setup = (overrides = {}) => {
  const deps = {
    counters: memoryCounters(),
    questions: memoryQuestions(),
    verifyTurnstile: cy.stub().resolves(true),
    answer: cy.stub().resolves({ status: 'answered', answer: 'He has.' }),
    hmac: async (ip) => `hash-of-${ip}`,
    now: () => NOW,
    ...overrides,
  };
  return deps;
};
const ask = (body, { method = 'POST', ip = '203.0.113.7' } = {}) =>
  new Request('http://localhost/api/ask', {
    method,
    headers: { 'CF-Connecting-IP': ip },
    body:
      method === 'GET'
        ? undefined
        : typeof body === 'string'
          ? body
          : JSON.stringify(body),
  });
const valid = { question: 'Has Eythor led a team?', token: 'tok' };

const expectJson = async (response, status, body) => {
  expect(response.status).to.equal(status);
  expect(response.headers.get('Cache-Control')).to.equal('no-store');
  expect(await response.json()).to.deep.equal(body);
};

describe('Ask handler', () => {
  beforeEach(() => {
    cy.stub(console, 'error').as('error');
  });

  context('responses', () => {
    it('answers a question', async () => {
      const deps = setup();
      await expectJson(await handleAsk(ask(valid), deps), 200, {
        status: 'answered',
        answer: 'He has.',
      });
      expect(deps.answer).to.have.been.calledOnceWith('Has Eythor led a team?');
    });

    it('sends the fixed texts for unknown and off-topic questions', async () => {
      let deps = setup({
        answer: async () => ({ status: 'unknown', answer: 'model text' }),
      });
      await expectJson(await handleAsk(ask(valid), deps), 200, {
        status: 'unknown',
        answer:
          "I don't know that one. Ask Eythor directly at hello@eythorkonrads.com.",
      });
      deps = setup({
        answer: async () => ({ status: 'offTopic', answer: 'model text' }),
      });
      await expectJson(await handleAsk(ask(valid), deps), 200, {
        status: 'offTopic',
        answer: 'I only answer questions about Eythor and his work.',
      });
    });

    it('rejects a body that is not JSON with 400', async () => {
      await expectJson(await handleAsk(ask('{nope'), setup()), 400, {
        error: 'json',
      });
    });

    it('rejects a body that is too large with 413', async () => {
      const big = { question: 'x', token: 'a'.repeat(10_000) };
      await expectJson(await handleAsk(ask(big), setup()), 413, {
        error: 'size',
      });
    });

    it('rejects an empty or over-300-character question with 422', async () => {
      for (const question of ['   ', '', 42, undefined, 'x'.repeat(301)]) {
        const deps = setup();
        await expectJson(
          await handleAsk(ask({ ...valid, question }), deps),
          422,
          { error: 'length' }
        );
        expect(deps.verifyTurnstile).not.to.have.been.called;
      }
      const deps = setup();
      const ok = await handleAsk(
        ask({ ...valid, question: ` ${'x'.repeat(300)} ` }),
        deps
      );
      expect(ok.status).to.equal(200);
    });

    it('rejects an invalid Turnstile token with 403, uncounted', async () => {
      const deps = setup({ verifyTurnstile: cy.stub().resolves(false) });
      await expectJson(await handleAsk(ask(valid), deps), 403, {
        error: 'turnstile',
      });
      expect(deps.verifyTurnstile).to.have.been.calledOnceWith('tok');
      expect(deps.counters.rows).to.deep.equal({});
    });

    it('answers anything but POST with an empty 405', async () => {
      const response = await handleAsk(ask(null, { method: 'GET' }), setup());
      expect(response.status).to.equal(405);
      expect(response.headers.get('Cache-Control')).to.equal('no-store');
      expect(await response.text()).to.equal('');
    });

    it('returns 503 when siteverify fails, a counter fails, Claude fails or is missing', async () => {
      const failures = [
        { verifyTurnstile: cy.stub().rejects(new Error('down')) },
        {
          counters: {
            increment: cy.stub().rejects(new Error('D1_ERROR secret')),
          },
        },
        { answer: cy.stub().rejects(new Error('boom')) },
        { answer: undefined },
      ];
      for (const overrides of failures) {
        await expectJson(await handleAsk(ask(valid), setup(overrides)), 503, {
          error: 'unavailable',
        });
      }
    });
  });

  context('limits', () => {
    it('stops the 21st question in an hour without touching the site counter', async () => {
      const deps = setup();
      for (let i = 0; i < 20; i++) await handleAsk(ask(valid), deps);
      expect(deps.counters.rows['site:2026-11-18'].count).to.equal(20);

      await expectJson(await handleAsk(ask(valid), deps), 429, {
        error: 'hourLimit',
        retryAt: '2026-11-18T15:00:00.000Z',
      });
      await handleAsk(ask(valid), deps);
      // Over the limit still counts on the visitor's own row only
      expect(
        deps.counters.rows['visitor:hash-of-203.0.113.7:2026-11-18T14'].count
      ).to.equal(22);
      expect(deps.counters.rows['site:2026-11-18'].count).to.equal(20);
      expect(deps.answer).to.have.callCount(20);
    });

    it('stops the 101st question of the day for the whole site', async () => {
      const deps = setup({
        counters: memoryCounters({
          'site:2026-11-18': { count: 100, expiresAt: '' },
        }),
      });
      await expectJson(await handleAsk(ask(valid), deps), 429, {
        error: 'dayLimit',
        retryAt: '2026-11-19T00:00:00.000Z',
      });
      expect(deps.answer).not.to.have.been.called;
    });

    it('keys counters by visitor hash and UTC hour, and by UTC day', async () => {
      const deps = setup();
      await handleAsk(ask(valid, { ip: '198.51.100.1' }), deps);
      expect(deps.counters.rows).to.deep.equal({
        'visitor:hash-of-198.51.100.1:2026-11-18T14': {
          count: 1,
          expiresAt: '2026-11-18T15:00:00.000Z',
        },
        'site:2026-11-18': { count: 1, expiresAt: '2026-11-19T00:00:00.000Z' },
      });
    });

    it('counts a question whose answer failed', async () => {
      const deps = setup({ answer: cy.stub().rejects(new Error('boom')) });
      await handleAsk(ask(valid), deps);
      expect(deps.counters.rows['site:2026-11-18'].count).to.equal(1);
    });
  });

  context('Unanswered questions', () => {
    it('saves unknown questions with the UTC date, and nothing else', async () => {
      const deps = setup({
        answer: async (q) =>
          q.includes('salary')
            ? { status: 'unknown', answer: '' }
            : { status: q.includes('weather') ? 'offTopic' : 'answered' },
      });
      for (const question of [
        ' What is his salary? ',
        'What is the weather?',
        'Has Eythor led a team?',
      ]) {
        await handleAsk(ask({ ...valid, question }), deps);
      }
      expect(deps.questions.rows).to.have.length(1);
      const [row] = deps.questions.rows;
      expect(row.question).to.equal('What is his salary?');
      expect(row.date).to.equal('2026-11-18');
      expect(row.id).to.match(/^[0-9a-f-]{36}$/);
    });

    it('still returns 200 when saving fails', async () => {
      const deps = setup({
        questions: { add: cy.stub().rejects(new Error('D1_ERROR')) },
        answer: async () => ({ status: 'unknown', answer: '' }),
      });
      const response = await handleAsk(ask(valid), deps);
      expect(response.status).to.equal(200);
      expect((await response.json()).answer).to.equal(UNKNOWN_TEXT);
    });
  });

  context('Turnstile and the visitor hash', () => {
    const siteverify = (response) => cy.stub().resolves(response);

    it('passes or rejects tokens as siteverify says', async () => {
      const fetcher = siteverify(Response.json({ success: true }));
      expect(await turnstileVerifier('secret', fetcher)('tok')).to.be.true;
      const [url, init] = fetcher.firstCall.args;
      expect(url).to.equal(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify'
      );
      expect(JSON.parse(init.body)).to.deep.equal({
        secret: 'secret',
        response: 'tok',
      });
      expect(init.signal).to.be.an.instanceOf(AbortSignal);
      const no = siteverify(Response.json({ success: false }));
      expect(await turnstileVerifier('secret', no)('tok')).to.be.false;
    });

    it('fails closed when siteverify is down or replies with non-JSON', async () => {
      const replies = [
        cy.stub().rejects(new TypeError('network')),
        siteverify(new Response('<html>', { status: 200 })),
        siteverify(Response.json({ success: false }, { status: 500 })),
        siteverify(Response.json({})),
      ];
      for (const fetcher of replies) {
        let threw = false;
        try {
          await turnstileVerifier('secret', fetcher)('tok');
        } catch {
          threw = true;
        }
        expect(threw).to.be.true;
      }
    });

    it('hashes the IP with HMAC-SHA-256 of the key', async () => {
      // RFC 4231 test case 2
      const hash = await ipHasher('Jefe');
      expect(await hash('what do ya want for nothing?')).to.equal(
        '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843'
      );
    });
  });

  context('cleanup', () => {
    it('deletes only expired counters and questions older than 90 days', async () => {
      const counters = {
        'visitor:a:2026-11-18T13': '2026-11-18T14:00:00.000Z',
        'visitor:a:2026-11-18T14': '2026-11-18T15:00:00.000Z',
        'site:2026-11-17': '2026-11-18T00:00:00.000Z',
        'site:2026-11-18': '2026-11-19T00:00:00.000Z',
      };
      let questions = ['2026-08-19', '2026-08-20', '2026-11-18'];
      const store = {
        deleteCounters: async (before) => {
          for (const [key, expiresAt] of Object.entries(counters)) {
            if (expiresAt <= before) delete counters[key];
          }
        },
        deleteQuestions: async (before) => {
          questions = questions.filter((date) => date >= before);
        },
      };
      await cleanup(store, NOW);
      expect(Object.keys(counters)).to.deep.equal([
        'visitor:a:2026-11-18T14',
        'site:2026-11-18',
      ]);
      // 2026-08-20 is exactly 90 days before 2026-11-18
      expect(questions).to.deep.equal(['2026-08-20', '2026-11-18']);
    });
  });

  context('logging', () => {
    const failures = {
      turnstile: [
        { verifyTurnstile: () => Promise.reject(new Error('down')) },
        { ask: 'turnstile' },
      ],
      counter: [
        { counters: { increment: () => Promise.reject(new Error('x')) } },
        { ask: 'd1', step: 'counter' },
      ],
      save: [
        {
          questions: { add: () => Promise.reject(new Error('x')) },
          answer: async () => ({ status: 'unknown' }),
        },
        { ask: 'd1', step: 'save' },
      ],
      claude: [
        {
          answer: () =>
            Promise.reject(
              Object.assign(new Error('x'), {
                log: { ask: 'claude', reason: 'timeout' },
              })
            ),
        },
        { ask: 'claude', reason: 'timeout' },
      ],
    };
    for (const [name, [overrides, shape]] of Object.entries(failures)) {
      it(`logs a ${name} failure once, with the fixed shape only`, () => {
        cy.wrap(handleAsk(ask(valid), setup(overrides))).then(() => {
          cy.get('@error').then((error) => {
            expect(error).to.have.been.calledOnce;
            expect(error.firstCall.args).to.deep.equal([shape]);
            const text = JSON.stringify(error.firstCall.args);
            expect(text).not.to.include('203.0.113.7');
            expect(text).not.to.include('led a team');
          });
        });
      });
    }

    it('logs nothing for successes and limit hits', () => {
      const deps = setup();
      cy.wrap(
        (async () => {
          for (let i = 0; i < 21; i++) await handleAsk(ask(valid), deps);
        })()
      ).then(() => {
        cy.get('@error').should('not.have.been.called');
      });
    });
  });
});
