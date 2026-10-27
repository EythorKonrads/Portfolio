import { contrast } from '../support/color';

// Dark is the default; the header toggle switches to light and back
const DARK_BG = 'rgb(15, 23, 42)';
const LIGHT_BG = 'rgb(248, 250, 252)';

const pageBackground = () =>
  cy.get('[data-cy="hero"]').parent().should('have.css', 'background-color');

describe('Theme', () => {
  it('starts dark with a toggle offering the light theme', () => {
    cy.visitHome();
    cy.get('html').should('have.attr', 'data-theme', 'dark');
    pageBackground().should('eq', DARK_BG);
    cy.get('[data-cy="themeToggle"]')
      .should('be.visible')
      .and('have.attr', 'aria-label', 'Switch to light theme')
      .find('svg')
      .should('exist');
  });

  it('switches to light and back', () => {
    cy.visitHome();
    cy.get('[data-cy="themeToggle"]').click();
    cy.get('html').should('have.attr', 'data-theme', 'light');
    pageBackground().should('eq', LIGHT_BG);
    cy.get('[data-cy="themeToggle"]').should(
      'have.attr',
      'aria-label',
      'Switch to dark theme'
    );
    cy.get('head meta[name="theme-color"]').should(
      'have.attr',
      'content',
      '#f8fafc'
    );

    cy.get('[data-cy="themeToggle"]').click();
    cy.get('html').should('have.attr', 'data-theme', 'dark');
    pageBackground().should('eq', DARK_BG);
    cy.get('head meta[name="theme-color"]').should(
      'have.attr',
      'content',
      '#0f172a'
    );
  });

  it('remembers the choice on the next visit', () => {
    cy.visitHome();
    cy.get('[data-cy="themeToggle"]').click();
    cy.window()
      .its('localStorage')
      .invoke('getItem', 'theme')
      .should('eq', 'light');
    cy.reload();
    cy.get('html').should('have.attr', 'data-theme', 'light');
    pageBackground().should('eq', LIGHT_BG);
  });

  it('applies a saved light theme before the app loads', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('theme', 'light');
      },
      onLoad(win) {
        // Set by the inline script in index.html, not by the app
        expect(win.document.documentElement.dataset.theme).to.eq('light');
      },
    });
  });

  it('keeps text readable in the light theme', () => {
    cy.visitHome();
    cy.get('[data-cy="themeToggle"]').click();
    pageBackground().should('eq', LIGHT_BG);
    [
      '[data-cy="heroName"]',
      '[data-cy="heroRole"]',
      '[data-cy="heroText"]',
      '[data-cy="navLink"]',
      '[data-cy="filterButton"]',
      '[data-cy="experience"] h2',
      '[data-cy="jobTitle"]',
      '[data-cy="jobDates"] h3',
      '[data-cy="job"] p',
      '[data-cy="jobTag"] button',
      '[data-cy="education"] h2',
    ].forEach((selector) => {
      // Retries until color transitions started by the switch have finished
      cy.get(selector).should(($els) => {
        $els.each((_, el) => {
          const ratio = contrast(getComputedStyle(el).color, LIGHT_BG);
          expect(ratio, `contrast of ${selector}`).to.be.at.least(4.5);
        });
      });
    });
  });

  it('colors the project popup for the light theme', () => {
    cy.visitHome();
    cy.get('[data-cy="themeToggle"]').click();
    cy.get('[data-cy="projectCard"]').first().scrollIntoView().click();
    cy.get('[data-cy="popup"]').should(
      'have.css',
      'background-color',
      'rgb(255, 255, 255)'
    );
    cy.get('[data-cy="popupTitle"]').should(($title) => {
      expect(
        contrast($title.css('color'), 'rgb(255, 255, 255)')
      ).to.be.at.least(4.5);
    });
  });

  [320, 375].forEach((width) => {
    it(`fits the toggle in the header at ${width}px`, () => {
      cy.viewport(width, 800);
      cy.visitHome();
      cy.get('[data-cy="sectionNav"] ul').should(($list) => {
        expect($list[0].scrollWidth, 'nav links not cut off').to.be.at.most(
          $list[0].clientWidth
        );
      });
      cy.get('[data-cy="themeToggle"]').then(($toggle) => {
        cy.get('[data-cy="filterButton"]').should(($button) => {
          const toggle = $toggle[0].getBoundingClientRect();
          const button = $button[0].getBoundingClientRect();
          expect(toggle.right).to.be.at.most(button.left);
          expect(toggle.height, 'same height as filter').to.be.closeTo(
            button.height,
            1
          );
          expect(toggle.top + toggle.height / 2).to.be.closeTo(
            button.top + button.height / 2,
            2
          );
        });
      });
      cy.assertNoHorizontalOverflow();
    });
  });
});
