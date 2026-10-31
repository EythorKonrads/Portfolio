// The game screen on its own (src/components/GameScreen.vue): the help
// screen, Wave title, HUD, Menu, Shop and end screen. Tests read and set the
// running game through window.__game, which GameScreen exposes only under
// Cypress. Launching it from the page is in cypress/e2e/game.cy.js.
import GameScreen from '../../src/components/GameScreen.vue';
import { SHIP } from '../../src/game/config';

const withGame = (fn) => cy.window().its('__game').then(fn);
const key = (type, code) => cy.document().trigger(type, { code });

const mount = () => {
  const onClose = cy.spy().as('close');
  cy.mount(GameScreen, { props: { onClose } });
  cy.get('[data-cy="gameScreen"]').should('be.visible');
};

// Past the help screen, into Wave 1
const start = () => {
  mount();
  cy.get('[data-cy="gameIntroStart"]').click();
  cy.get('[data-cy="waveTitle"]').should('contain.text', 'Wave 1');
};

// The game clock doesn't move for a while
const expectPaused = () =>
  withGame((game) => {
    const { time } = game;
    cy.wait(300).then(() => expect(game.time, 'paused').to.equal(time));
  });

describe('Game screen', () => {
  it('explains the controls first, and nothing moves until Start', () => {
    mount();
    cy.get('[data-cy="gameIntroKeys"] kbd')
      .should('contain.text', '←')
      .and('contain.text', '→')
      .and('contain.text', '↑')
      .and('contain.text', 'Space');
    cy.get('[data-cy="gameMenuButton"]').should('not.exist');
    cy.get('[data-cy="waveTitle"]').should('not.exist');
    expectPaused();
    cy.get('[data-cy="gameIntroStart"]').should('have.focus').click();
    cy.get('[data-cy="gameMenuButton"]').should('be.visible');
    withGame((game) => {
      cy.wrap(null).should(() => expect(game.time).to.be.greaterThan(0));
    });
  });

  it('closes from the help screen with Esc', () => {
    mount();
    key('keydown', 'Escape');
    cy.get('@close').should('have.been.calledOnce');
  });

  it('shows the Population as a bar, and the Ore', () => {
    start();
    cy.get('[data-cy="hudPopulation"]').should('contain.text', '8.0 billion');
    cy.get('[data-cy="hudPopulationBar"]').should('be.visible');
    cy.get('[data-cy="hudOre"]').should('contain.text', '0');
    withGame((game) => {
      game.population = 2;
      game.ore = 12;
    });
    cy.get('[data-cy="hudPopulation"]').should('contain.text', '2.0 billion');
    cy.get('[data-cy="hudOre"]').should('contain.text', '12');
  });

  it('shows the Wave title above the Ship, then fades it away', () => {
    start();
    withGame((game) => {
      const shipTop = game.ship.y - SHIP.radius * game.scale;
      cy.get('[data-cy="waveTitle"]').should(($title) => {
        expect($title[0].getBoundingClientRect().bottom).to.be.lessThan(
          shipTop
        );
      });
    });
    cy.get('[data-cy="waveTitle"]')
      .children()
      .should('have.css', 'opacity', '0');
  });

  it('pauses in the Menu, from the button or Esc', () => {
    start();
    cy.get('[data-cy="gameMenuButton"]').click();
    cy.get('[data-cy="gameMenu"]').should('be.visible');
    expectPaused();
    cy.get('[data-cy="menuResume"]').click();
    cy.get('[data-cy="gameMenu"]').should('not.exist');

    key('keydown', 'Escape');
    cy.get('[data-cy="gameMenu"]').should('be.visible');
    key('keydown', 'Escape');
    cy.get('[data-cy="gameMenu"]').should('not.exist');
  });

  it('closes the game from End game in the Menu', () => {
    start();
    cy.get('[data-cy="gameMenuButton"]').click();
    cy.get('[data-cy="menuEnd"]').click();
    cy.get('@close').should('have.been.calledOnce');
  });

  it('opens the Menu when the tab is hidden', () => {
    start();
    cy.document().then((doc) => {
      Object.defineProperty(doc, 'hidden', { value: true, configurable: true });
      doc.dispatchEvent(new Event('visibilitychange'));
    });
    cy.get('[data-cy="gameMenu"]').should('be.visible');
    // Put it back for the next test
    cy.document().then((doc) => delete doc.hidden);
  });

  it('opens the Menu and lets go of held keys when the window loses focus', () => {
    start();
    key('keydown', 'ArrowUp');
    cy.window().then((win) => win.dispatchEvent(new Event('blur')));
    cy.get('[data-cy="gameMenu"]').should('be.visible');
    cy.get('[data-cy="menuResume"]').click();
    // ArrowUp's keyup was never seen, yet the engine isn't stuck on
    cy.wait(100);
    withGame((game) => expect(game.ship.thrusting).to.not.be.ok);
  });

  it('flies the Ship with the keyboard', () => {
    start();
    withGame((game) => {
      const { y } = game.ship;
      key('keydown', 'ArrowUp');
      cy.wait(300);
      key('keyup', 'ArrowUp');
      // It starts pointing up, so thrust moves it up the screen
      cy.wrap(null).should(() => expect(game.ship.y).to.be.lessThan(y));
    });
  });

  it('visits the Shop between Waves, with the Menu there too', () => {
    start();
    withGame((game) => {
      game.spawnQueue = [];
      game.asteroids = [];
      game.ore = 30;
    });
    cy.get('[data-cy="gameShop"]').should('be.visible');
    cy.get('[data-cy="gameMenuButton"]').click();
    cy.get('[data-cy="gameMenu"]').should('be.visible');
    cy.get('[data-cy="menuResume"]').click();
    cy.get('[data-cy="shopItem-turret"]').click();
    cy.get('[data-cy="gameShopOre"]')
      .invoke('text')
      .invoke('trim')
      .should('equal', '0');
    cy.get('[data-cy="shopItem-turret"]').should('contain.text', '1/4');
    cy.get('[data-cy="shopNext"]').click();
    cy.get('[data-cy="gameShop"]').should('not.exist');
    cy.get('[data-cy="waveTitle"]').should('contain.text', 'Wave 2');
  });

  it('ends when the Population reaches zero, and can start again', () => {
    start();
    withGame((game) => {
      game.population = 0;
    });
    // Earth explodes first, then the end screen shows
    withGame((game) => {
      cy.wrap(game).its('explosion').should('exist');
    });
    cy.get('[data-cy="gameEnd"]').should('not.exist');
    cy.get('[data-cy="gameEnd"]', { timeout: 6000 }).should('be.visible');
    cy.get('[data-cy="gameEndAgain"]').click();
    cy.get('[data-cy="gameEnd"]').should('not.exist');
    // Play again skips the help screen
    cy.get('[data-cy="gameIntro"]').should('not.exist');
    cy.get('[data-cy="hudPopulation"]').should('contain.text', '8.0 billion');
    cy.get('[data-cy="waveTitle"]').should('contain.text', 'Wave 1');
  });
});
