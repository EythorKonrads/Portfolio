// The game from the page: Mini Earth, the Takeover, the Launch, and back.
// The rules themselves are covered by cypress/component/game-rules.cy.js.
import { SHIP } from '../../src/game/config';

const miniEarth = () => cy.get('[data-cy="miniEarth"]');
const globe = () => cy.get('[data-cy="miniEarthGlobe"]');
const gameScreen = () => cy.get('[data-cy="gameScreen"]');

// The running game, which GameScreen exposes only under Cypress
const withGame = (fn) => cy.window().its('__game').then(fn);

// Launch, then get past the help screen
const launch = () => {
  miniEarth().click();
  gameScreen().should('be.visible');
  cy.get('[data-cy="gameIntroStart"]').click();
  cy.get('[data-cy="gameIntro"]').should('not.exist');
  cy.get('[data-cy="waveTitle"]').should('contain.text', 'Wave 1');
};

describe('Game', () => {
  context('desktop', () => {
    beforeEach(() => {
      cy.viewport(1280, 800);
      cy.visitHome();
    });

    it('has a Mini Earth orbiting the profile photo', () => {
      miniEarth().should('have.attr', 'aria-label').and('match', /play/i);
      cy.get('[data-cy="heroImage"]').then(($photo) => {
        const photo = $photo[0].getBoundingClientRect();
        globe().should(($globe) => {
          const earth = $globe[0].getBoundingClientRect();
          expect(earth.width, 'small').to.be.lessThan(photo.width / 2);
          const distance = Math.hypot(
            earth.x + earth.width / 2 - (photo.x + photo.width / 2),
            earth.y + earth.height / 2 - (photo.y + photo.height / 2)
          );
          expect(distance, 'beside the photo').to.be.greaterThan(
            photo.width / 2
          );
        });
      });
    });

    it('takes over the photo on hover, loading the game, and shrinks back', () => {
      cy.intercept('**/GameScreen*.js').as('gameCode');
      miniEarth().trigger('pointerenter');
      cy.wait('@gameCode');
      cy.get('[data-cy="heroImage"]').then(($photo) => {
        const photo = $photo[0].getBoundingClientRect();
        globe().should(($globe) => {
          const earth = $globe[0].getBoundingClientRect();
          expect(earth.width, 'covers the photo').to.be.greaterThan(
            photo.width
          );
        });
      });
      miniEarth().trigger('pointerleave');
      cy.get('[data-cy="heroImage"]').then(($photo) => {
        globe().should(($globe) => {
          expect($globe[0].getBoundingClientRect().width).to.be.lessThan(
            $photo[0].getBoundingClientRect().width / 2
          );
        });
      });
    });

    it('launches into the game and locks the page behind it', () => {
      miniEarth().click();
      cy.get('[data-cy="launch"]').should('exist');
      gameScreen().should('be.visible');
      cy.get('[data-cy="launch"]').should('not.exist');
      cy.get('[data-cy="hudPopulation"]').should('contain.text', '8.0 billion');
      cy.get('[data-cy="hudOre"]').should('contain.text', '0');
      cy.get('[data-cy="hudPopulationBar"]').should('be.visible');
      cy.get('#app').should('have.attr', 'inert');
      cy.get('html').should('have.css', 'overflow', 'hidden');
      // Earth sits in the middle of the screen
      withGame((game) => {
        expect(game.earth.x).to.equal(1280 / 2);
        expect(game.earth.y).to.equal(800 / 2);
      });
    });

    it('shows the Wave title above the Ship, then fades it away', () => {
      launch();
      withGame((game) => {
        const shipTop = game.ship.y - SHIP.radius * game.scale;
        cy.get('[data-cy="waveTitle"]').should(($title) => {
          const bottom = $title[0].getBoundingClientRect().bottom;
          expect(bottom).to.be.lessThan(shipTop);
        });
      });
      cy.get('[data-cy="waveTitle"]')
        .children()
        .should('have.css', 'opacity', '0');
    });

    it('explains the controls before the first Wave', () => {
      miniEarth().click();
      cy.get('[data-cy="gameIntro"]')
        .should('be.visible')
        .and('contain.text', 'Defend Earth');
      cy.get('[data-cy="gameIntroKeys"] kbd')
        .should('contain.text', '←')
        .and('contain.text', '→')
        .and('contain.text', '↑')
        .and('contain.text', 'Space');
      cy.get('[data-cy="gameMenuButton"]').should('not.exist');
      // Nothing moves until Start
      withGame((game) => {
        cy.wait(300).then(() => expect(game.time).to.equal(0));
      });
      cy.get('[data-cy="gameIntroStart"]').should('have.focus').click();
      cy.get('[data-cy="gameMenuButton"]').should('be.visible');
      withGame((game) => {
        cy.wrap(null).should(() => expect(game.time).to.be.greaterThan(0));
      });
    });

    it('closes from the help screen with Esc', () => {
      miniEarth().click();
      cy.get('[data-cy="gameIntro"]').should('be.visible');
      cy.get('body').trigger('keydown', { code: 'Escape' });
      gameScreen().should('not.exist');
      miniEarth().should('have.focus');
    });

    it('pauses in the Menu, from the button or Esc', () => {
      launch();
      cy.get('[data-cy="gameMenuButton"]').click();
      cy.get('[data-cy="gameMenu"]').should('be.visible');
      withGame((game) => {
        const time = game.time;
        cy.wait(300).then(() => expect(game.time, 'paused').to.equal(time));
      });
      cy.get('[data-cy="menuResume"]').click();
      cy.get('[data-cy="gameMenu"]').should('not.exist');

      cy.get('body').trigger('keydown', { code: 'Escape' });
      cy.get('[data-cy="gameMenu"]').should('be.visible');
      cy.get('body').trigger('keydown', { code: 'Escape' });
      cy.get('[data-cy="gameMenu"]').should('not.exist');
    });

    it('opens the Menu when the tab is hidden', () => {
      launch();
      cy.document().then((doc) => {
        Object.defineProperty(doc, 'hidden', {
          value: true,
          configurable: true,
        });
        doc.dispatchEvent(new Event('visibilitychange'));
      });
      cy.get('[data-cy="gameMenu"]').should('be.visible');
    });

    it('returns to the page from End game, focused on Mini Earth', () => {
      launch();
      cy.get('[data-cy="gameMenuButton"]').click();
      cy.get('[data-cy="menuEnd"]').click();
      gameScreen().should('not.exist');
      cy.get('[data-cy="gameEnd"]').should('not.exist');
      cy.get('#app').should('not.have.attr', 'inert');
      cy.get('html').should('not.have.css', 'overflow', 'hidden');
      miniEarth().should('have.focus');
    });

    it('flies the Ship with the keyboard', () => {
      launch();
      withGame((game) => {
        const { y } = game.ship;
        cy.get('body').trigger('keydown', { code: 'ArrowUp' });
        cy.wait(300);
        cy.get('body').trigger('keyup', { code: 'ArrowUp' });
        // It starts pointing up, so thrust moves it up the screen
        cy.wrap(null).should(() => expect(game.ship.y).to.be.lessThan(y));
      });
    });

    it('visits the Shop between Waves', () => {
      launch();
      withGame((game) => {
        game.spawnQueue = [];
        game.asteroids = [];
        game.ore = 30;
      });
      cy.get('[data-cy="gameShop"]').should('be.visible');
      // The Menu is there between Waves too
      cy.get('[data-cy="gameMenuButton"]').click();
      cy.get('[data-cy="gameMenu"]').should('be.visible');
      cy.get('[data-cy="menuResume"]').click();
      cy.get('[data-cy="gameShop"]').should('be.visible');
      cy.get('[data-cy="shopItem-turret"] [data-cy="shopBuy"]').click();
      cy.get('[data-cy="gameShopOre"]')
        .invoke('text')
        .invoke('trim')
        .should('equal', '0');
      cy.get('[data-cy="shopItem-turret"]').should('contain.text', '1/4');
      cy.get('[data-cy="shopNext"]').click();
      cy.get('[data-cy="gameShop"]').should('not.exist');
      cy.get('[data-cy="waveTitle"]').should('contain.text', 'Wave 2');
    });

    it('blasts fire where an Asteroid hits Earth, then clears it', () => {
      launch();
      withGame((game) => {
        const { earth } = game;
        game.asteroids.push({
          size: 'large',
          x: earth.x,
          y: earth.y - earth.radius,
          vx: 0,
          vy: 0,
          radius: 34 * game.scale,
          hp: 6,
          spin: 0,
          rotation: 0,
          seed: 0.5,
        });
        // Drawn for a few frames; any error drawing it fails the test
        cy.wrap(game).its('impacts').should('have.length', 1);
        cy.wrap(game).its('impacts', { timeout: 3000 }).should('be.empty');
      });
      cy.get('[data-cy="hudPopulation"]').should('contain.text', '5.5 billion');
    });

    it('ends when the Population reaches zero, and can start again', () => {
      launch();
      withGame((game) => {
        game.population = 0;
      });
      cy.get('[data-cy="gameEnd"]').should('be.visible');
      cy.get('[data-cy="gameEndTalk"]').should(
        'have.attr',
        'href',
        'mailto:kh.krimper@gmail.com'
      );
      cy.get('[data-cy="gameEndAgain"]').click();
      cy.get('[data-cy="gameEnd"]').should('not.exist');
      cy.get('[data-cy="gameIntro"]').should('not.exist');
      cy.get('[data-cy="hudPopulation"]').should('contain.text', '8.0 billion');
      cy.get('[data-cy="waveTitle"]').should('contain.text', 'Wave 1');
    });
  });

  it('launches with one tap on a phone', () => {
    cy.viewport(375, 812);
    cy.visitHome();
    miniEarth().should('be.visible').click();
    gameScreen().should('be.visible');
    cy.get('[data-cy="gameIntroStart"]').click();
    cy.get('[data-cy="gameMenuButton"]').should('be.visible');
    withGame((game) => {
      expect(game.earth.x).to.equal(375 / 2);
    });
  });
});
