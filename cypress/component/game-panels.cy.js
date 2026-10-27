// The HTML laid over the play field: the Shop, the Menu and the end screen
import GameShop from '../../src/components/GameShop.vue';
import GameMenu from '../../src/components/GameMenu.vue';
import GameEnd from '../../src/components/GameEnd.vue';

describe('Game panels', () => {
  it('lists Shop items with prices and says why one is unavailable', () => {
    const onBuy = cy.spy().as('buy');
    const onNext = cy.spy().as('next');
    cy.mount(GameShop, {
      props: {
        ore: 40,
        wave: 2,
        items: [
          { id: 'turret', owned: 0, price: 30, blocked: null },
          { id: 'turretRate', owned: 0, price: 20, blocked: 'needs' },
          { id: 'satellite', owned: 6, price: 400, blocked: 'max' },
        ],
        onBuy,
        onNext,
      },
    });
    cy.get('[data-cy="gameShopOre"]').should('contain.text', '40 Ore');
    cy.get('[data-cy="shopItem-turret"] [data-cy="shopBuy"]')
      .should('contain.text', '30 Ore')
      .and('be.enabled')
      .click();
    cy.get('@buy').should('have.been.calledOnceWith', 'turret');
    cy.get('[data-cy="shopItem-turretRate"] [data-cy="shopBuy"]')
      .should('be.disabled')
      .and('contain.text', 'Needs a Turret');
    cy.get('[data-cy="shopItem-satellite"]')
      .should('contain.text', '6/6')
      .find('[data-cy="shopBuy"]')
      .should('contain.text', 'Maxed out');
    cy.get('[data-cy="shopNext"]').should('contain.text', 'Wave 3').click();
    cy.get('@next').should('have.been.calledOnce');
  });

  it('offers Resume and End game in the Menu', () => {
    const onResume = cy.spy().as('resume');
    const onEnd = cy.spy().as('end');
    cy.mount(GameMenu, { props: { onResume, onEnd } });
    cy.get('[data-cy="menuResume"]').click();
    cy.get('@resume').should('have.been.calledOnce');
    cy.get('[data-cy="menuEnd"]').should('contain.text', 'End game').click();
    cy.get('@end').should('have.been.calledOnce');
  });

  it('shows the Score with a way to get in touch or play again', () => {
    const onAgain = cy.spy().as('again');
    cy.mount(GameEnd, { props: { score: 12340, wave: 7, onAgain } });
    cy.get('[data-cy="gameEndScore"]').should('have.text', '12,340');
    cy.get('[data-cy="gameEnd"]').should('contain.text', 'Wave 7');
    cy.get('[data-cy="gameEndTalk"]').should(
      'have.attr',
      'href',
      'mailto:kh.krimper@gmail.com'
    );
    cy.get('[data-cy="gameEndAgain"]').click();
    cy.get('@again').should('have.been.calledOnce');
  });
});
