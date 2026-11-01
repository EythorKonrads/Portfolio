// The game on phones: touch controls, playing sideways, no zoom, and every
// panel fitting a short landscape screen without scrolling
import GameScreen from '../../src/components/GameScreen.vue';
import GameTouchControls from '../../src/components/GameTouchControls.vue';
import Icon from '../../src/components/Icon.vue';

const withGame = (fn) => cy.window().its('__game').then(fn);
const GAME_TIME = { timeout: 15000 };
// Phones held sideways, with the browser's bars taking some height
const LANDSCAPE = [
  [667, 320],
  [844, 340],
];

const mountGame = (touch = true) => {
  const onClose = cy.spy().as('close');
  cy.mount(GameScreen, { props: { touch, onClose } });
  cy.get('[data-cy="gameScreen"]').should('be.visible');
};
const startGame = () => {
  mountGame();
  cy.get('[data-cy="gameIntroStart"]').click();
  cy.get('[data-cy="waveTitle"]').should('contain.text', 'Wave 1');
};

// A finger on an element, at an offset from its centre
const touch = (selector, type, dx = 0, dy = 0) =>
  cy.get(selector).then(($el) => {
    const rect = $el[0].getBoundingClientRect();
    cy.wrap($el).trigger(type, {
      pointerId: 7,
      pointerType: 'touch',
      clientX: rect.left + rect.width / 2 + dx,
      clientY: rect.top + rect.height / 2 + dy,
      force: true,
    });
  });

// The panel fits: nothing to scroll, and all of it on screen
const expectFits = (selector) =>
  cy.get(selector).should(($panel) => {
    const panel = $panel[0];
    const rect = panel.getBoundingClientRect();
    expect(panel.scrollHeight, 'no scrolling').to.be.at.most(
      panel.clientHeight + 1
    );
    expect(rect.top, 'top on screen').to.be.at.least(0);
    expect(rect.bottom, 'bottom on screen').to.be.at.most(
      document.documentElement.clientHeight + 1
    );
  });

describe('Game on phones', () => {
  // Start asks for fullscreen and a sideways lock. The test browser would
  // really go fullscreen, changing the screen size for every later test.
  beforeEach(() => {
    cy.window().then((win) => {
      cy.stub(win.Element.prototype, 'requestFullscreen')
        .as('fullscreen')
        .resolves();
      if (win.screen.orientation?.lock) {
        cy.stub(win.screen.orientation, 'lock').as('lock').resolves();
      }
    });
  });

  it('asks for fullscreen and to stay sideways when a game starts', () => {
    cy.viewport(844, 390);
    startGame();
    cy.get('@fullscreen').should('have.been.calledOnce');
  });

  context('touch controls', () => {
    beforeEach(() => cy.viewport(844, 390));

    it('points the joystick where to fly, and lets go', () => {
      const onStick = cy.spy().as('stick');
      cy.mount(GameTouchControls, { props: { onStick } });
      // Far past the rim to the right: full push, pointing right
      touch('[data-cy="touchStick"]', 'pointerdown', 200, 0);
      cy.get('@stick')
        .its('lastCall.args.0')
        .should((stick) => {
          expect(stick.heading).to.be.closeTo(0, 1e-6);
          expect(stick.push).to.equal(1);
        });
      // A little way up: a gentle push, pointing up
      touch('[data-cy="touchStick"]', 'pointermove', 0, -10);
      cy.get('@stick')
        .its('lastCall.args.0')
        .should((stick) => {
          expect(stick.heading).to.be.closeTo(-Math.PI / 2, 1e-6);
          expect(stick.push).to.be.within(0.1, 0.5);
        });
      touch('[data-cy="touchStick"]', 'pointerup');
      // its() can't return null, so check the whole argument list
      cy.get('@stick').its('lastCall.args').should('deep.equal', [null]);
    });

    it('fires while the shoot button is held', () => {
      const onFire = cy.spy().as('fire');
      cy.mount(GameTouchControls, { props: { onFire } });
      touch('[data-cy="touchFire"]', 'pointerdown');
      cy.get('@fire').its('lastCall.args.0').should('equal', true);
      touch('[data-cy="touchFire"]', 'pointerup');
      cy.get('@fire').its('lastCall.args.0').should('equal', false);
    });

    it('shows the controls only while flying, and they fly the Ship', () => {
      mountGame();
      cy.get('[data-cy="gameIntroTouch"]').should('be.visible');
      cy.get('[data-cy="touchControls"]').should('not.exist');
      cy.get('[data-cy="gameIntroStart"]').click();
      cy.get('[data-cy="touchControls"]').should('be.visible');

      withGame((game) => {
        const { x } = game.ship;
        touch('[data-cy="touchStick"]', 'pointerdown', 200, 0);
        cy.wrap(game).its('ship.x', GAME_TIME).should('be.greaterThan', x);
        touch('[data-cy="touchStick"]', 'pointerup');
        touch('[data-cy="touchFire"]', 'pointerdown');
        cy.wrap(game)
          .its('shots', GAME_TIME)
          .should((shots) => {
            expect(shots.some((s) => s.from === 'ship')).to.be.true;
          });
        touch('[data-cy="touchFire"]', 'pointerup');
      });

      cy.get('[data-cy="gameMenuButton"]').click();
      cy.get('[data-cy="touchControls"]').should('not.exist');
    });
  });

  context('held upright', () => {
    it('asks to turn the phone, and waits until then', () => {
      cy.viewport(390, 844);
      mountGame();
      cy.get('[data-cy="turnPhone"]').should('be.visible');
      cy.viewport(844, 390);
      cy.get('[data-cy="turnPhone"]').should('not.exist');
      cy.get('[data-cy="gameIntroStart"]').click();
      // Turned upright mid-Wave: the game stops until it's turned back
      cy.viewport(390, 844);
      cy.get('[data-cy="turnPhone"]').should('be.visible');
      withGame((game) => {
        const { time } = game;
        cy.wait(300).then(() => expect(game.time).to.equal(time));
      });
      cy.get('[data-cy="turnBack"]').click();
      cy.get('@close').should('have.been.calledOnce');
    });

    it("doesn't ask on a computer, whatever the window's shape", () => {
      cy.viewport(390, 844);
      mountGame(false);
      cy.get('[data-cy="gameIntro"]').should('be.visible');
      cy.get('[data-cy="turnPhone"]').should('not.exist');
    });
  });

  it("can't be zoomed while open, and the page can be again after", () => {
    const viewport = () =>
      cy
        .document()
        .then((doc) =>
          doc.querySelector('meta[name="viewport"]').getAttribute('content')
        );
    viewport().then((before) => {
      mountGame();
      viewport().should('contain', 'maximum-scale=1');
      viewport().should('contain', 'user-scalable=no');
      // Mounting something else closes the game
      cy.mount(Icon, { props: { name: 'ore' } });
      viewport().should('equal', before);
    });
  });

  it('names each Shop card, and buys on one tap', () => {
    cy.viewport(844, 390);
    startGame();
    withGame((game) => {
      game.spawnQueue = [];
      game.asteroids = [];
      game.ore = 100;
    });
    cy.get('[data-cy="shopItem-turret"] [data-cy="shopName"]').should(
      'contain.text',
      'Turret'
    );
    cy.get('[data-cy="shopItem-turretRate"] [data-cy="shopName"]').should(
      'contain.text',
      'Locked'
    );
    cy.get('[data-cy="shopItem-turret"]').click();
    cy.get('[data-cy="shopItem-turret"]').should('contain.text', '1/4');
    cy.get('[data-cy="shopInfo"]').should('not.exist');
  });

  LANDSCAPE.forEach(([width, height]) => {
    context(`fits a ${width}×${height} screen without scrolling`, () => {
      beforeEach(() => cy.viewport(width, height));

      it('the Help screen', () => {
        mountGame();
        expectFits('[data-cy="gameIntro"]');
      });

      it('the Shop', () => {
        startGame();
        withGame((game) => {
          game.spawnQueue = [];
          game.asteroids = [];
          game.ore = 500;
        });
        expectFits('[data-cy="gameShop"]');
      });

      it('the Menu, which has no title', () => {
        startGame();
        cy.get('[data-cy="gameMenuButton"]').click();
        expectFits('[data-cy="gameMenu"]');
        cy.get('[data-cy="gameMenu"]').should('not.contain.text', 'Paused');
      });

      it("the Menu's Scoreboard, full", () => {
        const board = Array.from({ length: 10 }, (_, i) => ({
          initials: 'ABC',
          score: 1000 - i,
          wave: 5,
          time: 90,
          date: `2026-01-${10 + i}`,
        }));
        cy.intercept('GET', '/api/scores', { board });
        startGame();
        cy.get('[data-cy="gameMenuButton"]').click();
        cy.get('[data-cy="menuScoreboard"]').click();
        cy.get('[data-cy="scoreRow"]').should('have.length', 10);
        expectFits('[data-cy="gameScoreboard"]');
      });

      it('the end screen, asking for initials beside a nearly full board', () => {
        const board = Array.from({ length: 9 }, (_, i) => ({
          initials: 'ABC',
          score: 1000 - i,
          wave: 5,
          time: 90,
          date: `2026-01-${10 + i}`,
        }));
        cy.intercept('GET', '/api/scores', { board });
        startGame();
        cy.wait(500);
        withGame((game) => {
          game.score = 30;
          game.population = 0;
        });
        cy.get('[data-cy="scoreEntry"]', GAME_TIME).should('be.visible');
        expectFits('[data-cy="gameEnd"]');
      });
    });
  });
});
