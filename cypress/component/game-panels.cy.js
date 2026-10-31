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

  it('shows what a card is on the first tap, and buys on the next', () => {
    const onBuy = cy.spy().as('buy');
    cy.mount(GameShop, {
      props: {
        ore: 100,
        wave: 1,
        items: [
          { id: 'turret', owned: 0, price: 30, blocked: null },
          { id: 'turretRate', owned: 0, price: 25, blocked: 'needs' },
        ],
        onBuy,
      },
    });
    // trigger('click') rather than click(), which would add a mouse pointerdown
    const tap = (id) =>
      cy
        .get(`[data-cy="shopItem-${id}"]`)
        .trigger('pointerdown', { pointerType: 'touch' })
        .trigger('click');
    tap('turret');
    cy.get('[data-cy="shopInfo"]').should('contain.text', 'Turret');
    cy.get('@buy').should('not.have.been.called');
    tap('turret');
    cy.get('@buy').should('have.been.calledOnceWith', 'turret');
    tap('turret');
    cy.get('@buy').should('have.been.calledTwice');
    // A locked card only ever explains itself
    tap('turretRate');
    cy.get('[data-cy="shopInfo"]').should('contain.text', 'Buy a Turret first');
    tap('turretRate');
    cy.get('@buy').should('have.been.calledTwice');
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

  context('the end screen scoreboard', () => {
    const row = (initials, score) => ({
      initials,
      score,
      wave: 4,
      time: 80,
      date: `2026-01-0${score % 9}T00:00:00.000Z`,
    });

    it('takes initials for a Score that makes the top 10, then shows it', () => {
      cy.intercept('GET', '/api/scores', {
        board: [row('TOP', 900), row('LOW', 100)],
      });
      const saved = [row('TOP', 900), row('ABC', 250), row('LOW', 100)];
      cy.intercept('POST', '/api/scores', { board: saved, rank: 2 }).as('save');
      cy.mount(GameEnd, { props: { score: 250, wave: 3, time: 61.5 } });

      cy.get('[data-cy="scoreRow"]').should('have.length', 2);
      cy.get('[data-cy="scoreSave"]').should('be.disabled');
      // Only capital letters, three at most
      cy.get('[data-cy="scoreInitials"]').type('a1bcd');
      cy.get('[data-cy="scoreInitials"]').should('have.value', 'ABC');
      cy.get('[data-cy="scoreSave"]').click();
      cy.wait('@save').its('request.body').should('deep.equal', {
        initials: 'ABC',
        score: 250,
        wave: 3,
        time: 61.5,
      });
      cy.get('[data-cy="scoreEntry"]').should('not.exist');
      cy.get('[data-cy="scoreRow"]')
        .should('have.length', 3)
        .eq(1)
        .should('contain.text', 'ABC')
        .and('have.class', 'game-end__row--you');
    });

    it("doesn't ask for initials when the Score misses the top 10", () => {
      const board = Array.from({ length: 10 }, (_, i) => row('AAA', 1000 - i));
      cy.intercept('GET', '/api/scores', { board });
      cy.mount(GameEnd, { props: { score: 50, wave: 2 } });
      cy.get('[data-cy="scoreRow"]').should('have.length', 10);
      cy.get('[data-cy="scoreEntry"]').should('not.exist');
    });

    it('says so when a save fails, and lets you try again', () => {
      cy.intercept('GET', '/api/scores', { board: [] });
      cy.intercept('POST', '/api/scores', { statusCode: 500 });
      cy.mount(GameEnd, { props: { score: 50, wave: 1, time: 20 } });
      cy.get('[data-cy="scoreInitials"]').type('ABC');
      cy.get('[data-cy="scoreSave"]').click();
      cy.get('[data-cy="scoreSaveFailed"]').should('be.visible');
      cy.get('[data-cy="scoreSave"]').should('be.enabled');
    });

    it("says when the scoreboard isn't available", () => {
      cy.intercept('GET', '/api/scores', { statusCode: 500 });
      cy.mount(GameEnd, { props: { score: 50, wave: 1 } });
      cy.get('[data-cy="scoreboardOffline"]').should('be.visible');
      cy.get('[data-cy="scoreEntry"]').should('not.exist');
    });
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
