// The HTML laid over the play field: the Shop, the Menu and the end screen
import GameShop from '../../src/components/GameShop.vue';
import GameMenu from '../../src/components/GameMenu.vue';
import GameEnd from '../../src/components/GameEnd.vue';
import GameIntro from '../../src/components/GameIntro.vue';
import GameScoreboard from '../../src/components/GameScoreboard.vue';

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

  it('explains the joystick and Fire button instead of keys on touch', () => {
    cy.mount(GameIntro, { props: { touch: true } });
    cy.get('[data-cy="gameIntroTouch"]')
      .should('contain.text', 'Joystick')
      .and('contain.text', 'Fire');
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

  it('names each card and buys on one tap on a touch screen', () => {
    const onBuy = cy.spy().as('buy');
    cy.mount(GameShop, {
      props: {
        ore: 100,
        wave: 1,
        touch: true,
        items: [
          { id: 'turret', owned: 0, price: 30, blocked: null },
          { id: 'turretRate', owned: 0, price: 25, blocked: 'needs' },
        ],
        onBuy,
      },
    });
    cy.get('[data-cy="shopItem-turret"] [data-cy="shopName"]').should(
      'contain.text',
      'Turret'
    );
    // Locked upgrades still don't say what they are
    cy.get('[data-cy="shopItem-turretRate"] [data-cy="shopName"]').should(
      'contain.text',
      'Locked'
    );
    cy.get('[data-cy="shopItem-turret"]').click();
    cy.get('@buy').should('have.been.calledOnceWith', 'turret');
    // No tooltips on touch
    cy.get('[data-cy="shopItem-turret"]').trigger('mouseenter');
    cy.get('[data-cy="shopInfo"]').should('not.exist');
  });

  it('offers Resume, the Scoreboard and End game in the Menu', () => {
    const onResume = cy.spy().as('resume');
    const onScoreboard = cy.spy().as('scoreboard');
    const onEnd = cy.spy().as('end');
    cy.mount(GameMenu, { props: { onResume, onScoreboard, onEnd } });
    cy.get('[data-cy="menuResume"]').click();
    cy.get('@resume').should('have.been.calledOnce');
    cy.get('[data-cy="menuScoreboard"]').click();
    cy.get('@scoreboard').should('have.been.calledOnce');
    cy.get('[data-cy="menuEnd"]').should('contain.text', 'End game').click();
    cy.get('@end').should('have.been.calledOnce');
  });

  it("links to a new GitHub issue for bugs, with the game's state", () => {
    cy.mount(GameMenu, { props: { wave: 7, score: 1234 } });
    cy.get('[data-cy="menuBugReport"]')
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
      .and('have.attr', 'aria-label')
      .and('match', /new tab/);
    cy.get('[data-cy="menuBugReport"]')
      .invoke('attr', 'href')
      .then((href) => {
        const url = new URL(href);
        expect(url.origin + url.pathname).to.equal(
          'https://github.com/EythorKonrads/Portfolio/issues/new'
        );
        expect(url.searchParams.get('title')).to.equal('Game bug: ');
        expect(url.searchParams.get('body')).to.contain('Wave 7, Score 1234');
      });
  });

  context("the Menu's Scoreboard", () => {
    it('shows the top 10, and goes back', () => {
      const board = [
        { initials: 'TOP', score: 900, wave: 5, time: 90, date: '2026-01-01' },
        { initials: 'EK', score: 400, wave: 3, time: 50, date: '2026-01-02' },
      ];
      cy.intercept('GET', '/api/scores', { board });
      const onBack = cy.spy().as('back');
      cy.mount(GameScoreboard, { props: { onBack } });
      cy.get('[data-cy="scoreRow"]')
        .should('have.length', 2)
        .first()
        .should('contain.text', 'TOP')
        .and('contain.text', '900');
      cy.get('[data-cy="scoreboardBack"]').should('have.focus').click();
      cy.get('@back').should('have.been.calledOnce');
    });

    it("says when the scoreboard isn't available", () => {
      cy.intercept('GET', '/api/scores', { statusCode: 500 });
      cy.mount(GameScoreboard);
      cy.get('[data-cy="scoreboardOffline"]').should('be.visible');
    });
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
        .and('have.class', 'scoreboard-list__row--you');
    });

    it("doesn't ask for initials when the Score misses the top 10", () => {
      const board = Array.from({ length: 10 }, (_, i) => row('AAA', 1000 - i));
      cy.intercept('GET', '/api/scores', { board });
      cy.mount(GameEnd, { props: { score: 50, wave: 2, time: 60 } });
      cy.get('[data-cy="scoreRow"]').should('have.length', 10);
      cy.get('[data-cy="scoreEntry"]').should('not.exist');
      cy.get('[data-cy="scoreWhyNot"]').should(
        'contain.text',
        "didn't make the top 10"
      );
    });

    it("doesn't offer the board to a game reached faster than possible", () => {
      cy.intercept('GET', '/api/scores', { board: [] });
      // Wave 5 in 1 second, as a dev shortcut can do
      cy.mount(GameEnd, { props: { score: 100, wave: 5, time: 1 } });
      cy.get('[data-cy="scoreEntry"]').should('not.exist');
      cy.get('[data-cy="scoreWhyNot"]').should('contain.text', 'faster');
    });

    it('takes two-letter initials too', () => {
      cy.intercept('GET', '/api/scores', { board: [] });
      cy.intercept('POST', '/api/scores', {
        board: [row('EK', 50)],
        rank: 1,
      }).as('save');
      cy.mount(GameEnd, { props: { score: 50, wave: 1, time: 20 } });
      cy.get('[data-cy="scoreInitials"]').type('E');
      cy.get('[data-cy="scoreSave"]').should('be.disabled');
      cy.get('[data-cy="scoreInitials"]').type('k');
      cy.get('[data-cy="scoreSave"]').should('be.enabled').click();
      cy.wait('@save').its('request.body.initials').should('equal', 'EK');
    });

    it('explains that a Score of 0 needs an Asteroid destroyed first', () => {
      cy.intercept('GET', '/api/scores', { board: [] });
      cy.mount(GameEnd, { props: { score: 0, wave: 1 } });
      cy.get('[data-cy="scoreEntry"]').should('not.exist');
      cy.get('[data-cy="scoreWhyNot"]').should(
        'contain.text',
        'Destroy an Asteroid'
      );
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
