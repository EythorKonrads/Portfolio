// Dark is the default; a saved light choice applies on any page
const DARK_BG = 'rgb(15, 23, 42)';
const LIGHT_BG = 'rgb(248, 250, 252)';

const SECTIONS = ['Ask', 'The rest of the site', 'Hosting', 'Your rights'];

describe('Privacy page', () => {
  it('shows the heading and every section', () => {
    cy.visitHome({ path: '/privacy' });
    cy.get('[data-cy="privacy"] h1').should('have.text', 'Privacy');
    cy.get('[data-cy="privacy"] h2').then(($headings) => {
      expect([...$headings].map((h) => h.innerText.trim())).to.deep.eq(
        SECTIONS
      );
    });
  });

  it('has no Hero or section nav', () => {
    cy.visitHome({ path: '/privacy' });
    cy.get('[data-cy="privacy"]').should('be.visible');
    cy.get('[data-cy="hero"]').should('not.exist');
    cy.get('[data-cy="sectionNav"]').should('not.exist');
    cy.get('[data-cy="homeHeader"]').should('not.exist');
  });

  it('fades in when opened', () => {
    cy.visitHome({ path: '/privacy' });
    cy.get('[data-cy="privacy"]').should(
      'have.css',
      'animation-name',
      'fade-up'
    );
  });

  it('opens without the fade with reduced motion', () => {
    cy.visitHome({ path: '/privacy', reducedMotion: true });
    cy.get('[data-cy="privacy"]').should('have.css', 'animation-name', 'none');
  });

  it('goes back to the home page', () => {
    cy.visitHome({ path: '/privacy' });
    cy.get('[data-cy="privacyBack"]').should('have.text', '← Back').click();
    cy.location('pathname').should('eq', '/');
    cy.get('[data-cy="hero"]').should('be.visible');
  });

  it('links to the email address, the authority and the third parties', () => {
    cy.visitHome({ path: '/privacy' });
    cy.get('[data-cy="privacy"] a[href="mailto:hello@eythorkonrads.com"]')
      .should('have.length', 2)
      .and('contain.text', 'hello@eythorkonrads.com');
    [
      'https://www.anthropic.com/legal/privacy',
      'https://www.cloudflare.com/turnstile-privacy-policy/',
      'https://www.datatilsynet.dk/',
    ].forEach((href) => {
      cy.get(`[data-cy="privacy"] a[href="${href}"]`)
        .should('have.attr', 'target', '_blank')
        .and('have.attr', 'rel', 'noopener noreferrer')
        .and('have.attr', 'aria-label')
        .and('include', '(opens in a new tab)');
    });
  });

  it('renders in the dark theme', () => {
    cy.visitHome({ path: '/privacy' });
    cy.get('html').should('have.attr', 'data-theme', 'dark');
    cy.get('[data-cy="privacy"]')
      .parent()
      .should('have.css', 'background-color', DARK_BG);
  });

  it('renders in the light theme', () => {
    // The page has no toggle, so pick light on the home page first
    cy.visitHome();
    cy.get('[data-cy="themeToggle"]').click();
    cy.visitHome({ path: '/privacy' });
    cy.get('html').should('have.attr', 'data-theme', 'light');
    cy.get('[data-cy="privacy"]')
      .parent()
      .should('have.css', 'background-color', LIGHT_BG);
    cy.get('head meta[name="theme-color"]').should(
      'have.attr',
      'content',
      '#f8fafc'
    );
  });

  it('still shows after a reload', () => {
    cy.visitHome({ path: '/privacy' });
    cy.get('[data-cy="privacy"] h1').should('be.visible');
    cy.reload();
    cy.get('[data-cy="privacy"] h1').should('be.visible');
  });

  [360, 1280].forEach((width) => {
    it(`fits the screen at ${width}px`, () => {
      cy.viewport(width, 800);
      cy.visitHome({ path: '/privacy' });
      cy.get('[data-cy="privacy"]').should('be.visible');
      cy.assertNoHorizontalOverflow();
    });
  });
});
