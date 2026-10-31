// The game from the page: Mini Earth, the Takeover, the Launch, and back.
// The game screen itself is in cypress/component/game-screen.cy.js and its
// rules in cypress/component/game-rules.cy.js.

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
      cy.get('[data-cy="gameIntro"]').should('be.visible');
      cy.get('#app').should('have.attr', 'inert');
      cy.get('html').should('have.css', 'overflow', 'hidden');
      // Hidden behind the game, so the browser stops painting it
      cy.get('#app').should('have.css', 'visibility', 'hidden');
      // Earth sits in the middle of the screen
      withGame((game) => {
        expect(game.earth.x).to.equal(1280 / 2);
        expect(game.earth.y).to.equal(800 / 2);
      });
    });

    it('launches from the header too, and returns focus there', () => {
      cy.get('[data-cy="headerPlay"]')
        .should('have.attr', 'aria-label')
        .and('match', /play/i);
      cy.get('[data-cy="headerPlay"]').click();
      cy.get('[data-cy="launch"]').should('exist');
      gameScreen().should('be.visible');
      cy.get('body').trigger('keydown', { code: 'Escape' });
      gameScreen().should('not.exist');
      cy.get('[data-cy="headerPlay"]').should('have.focus');
    });

    it('returns to the page from the help screen with Esc', () => {
      miniEarth().click();
      cy.get('[data-cy="gameIntro"]').should('be.visible');
      cy.get('body').trigger('keydown', { code: 'Escape' });
      gameScreen().should('not.exist');
      miniEarth().should('have.focus');
    });

    it('returns to the page from End game, focused on Mini Earth', () => {
      launch();
      cy.get('[data-cy="gameMenuButton"]').click();
      cy.get('[data-cy="menuEnd"]').click();
      gameScreen().should('not.exist');
      cy.get('[data-cy="gameEnd"]').should('not.exist');
      cy.get('#app').should('not.have.attr', 'inert');
      cy.get('html').should('not.have.css', 'overflow', 'hidden');
      cy.get('#app').should('have.css', 'visibility', 'visible');
      miniEarth().should('have.focus');
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
