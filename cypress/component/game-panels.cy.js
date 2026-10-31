// The HTML laid over the play field: the Shop, the Menu and the end screen
import GameShop from '../../src/components/GameShop.vue';
import GameMenu from '../../src/components/GameMenu.vue';
import GameEnd from '../../src/components/GameEnd.vue';
import GameIntro from '../../src/components/GameIntro.vue';

describe('Game panels', () => {
  it('shows the keys on the help screen, and starts from it', () => {
    const onStart = cy.spy().as('start');
    cy.mount(GameIntro, { props: { onStart } });
    cy.get('[data-cy="gameIntro"]').should('contain.text', 'Defend Earth');
    cy.get('[data-cy="gameIntroKeys"]')
      .should('contain.text', 'turn')
      .and('contain.text', 'Shoot');
    cy.get('[data-cy="gameIntroTouch"]').should('not.exist');
    // The Shop is left for players to find
    cy.get('[data-cy="gameIntro"]').should('not.contain.text', 'Shop');
    cy.get('[data-cy="gameIntroStart"]').should('have.focus').click();
    cy.get('@start').should('have.been.calledOnce');
  });

  it('explains touch steering instead of keys on a touch screen', () => {
    cy.mount(GameIntro, { props: { touch: true } });
    cy.get('[data-cy="gameIntroTouch"]').should(
      'contain.text',
      'Touch and hold'
    );
    cy.get('[data-cy="gameIntroKeys"]').should('not.exist');
  });

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
    cy.get('[data-cy="gameShopOre"]').should('contain.text', '40');
    cy.get('[data-cy="shopItem-turret"] [data-cy="shopBuy"]')
      .should('contain.text', '30')
      .and('have.attr', 'aria-label', 'Buy Turret')
      .and('be.enabled')
      .click();
    cy.get('@buy').should('have.been.calledOnceWith', 'turret');
    // The whole card buys too, but only when its item can be bought
    cy.get('[data-cy="shopItem-turret"]').click('top');
    cy.get('@buy').should('have.been.calledTwice');
    cy.get('[data-cy="shopItem-turretRate"]').click('top');
    cy.get('[data-cy="shopItem-satellite"]').click('top');
    cy.get('@buy').should('have.been.calledTwice');
    cy.get('[data-cy="shopItem-turretRate"] [data-cy="shopBuy"]').should(
      'be.disabled'
    );
    // A locked upgrade's tooltip says what unlocks it
    cy.get('[data-cy="shopItem-turretRate"]').trigger('mouseenter');
    cy.get('[data-cy="shopInfo"]')
      .should('contain.text', 'Locked')
      .and('contain.text', 'Buy a Turret first');
    cy.get('[data-cy="shopItem-turretRate"]').trigger('mouseleave');
    cy.get('[data-cy="shopInfo"]').should('not.exist');
    cy.get('[data-cy="shopItem-satellite"]')
      .should('contain.text', '6/6')
      .find('[data-cy="shopBuy"]')
      .should('contain.text', 'Max');
    // The Ship's card shows the Ship itself, with nothing to buy
    cy.get('[data-cy="shopItem-ship"]')
      .find('[data-cy="shopBuy"]')
      .should('not.exist');
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
