import { composite, contrast, luminance } from '../support/color';

const aurora = () => cy.get('[data-cy="heroAurora"]');
const bands = () => cy.get('[data-cy="auroraBand"]');

// Resolve a CSS color variable to rgb() via a throwaway element
const resolveColor = (doc, variable) => {
  const probe = doc.createElement('span');
  probe.style.color = `var(${variable})`;
  doc.body.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};

const rect = ($el) => $el[0].getBoundingClientRect();

describe('Aurora', () => {
  context('desktop, dark theme', () => {
    beforeEach(() => {
      cy.viewport(1280, 800);
      cy.visitHome();
    });

    it('sits behind the content without catching clicks', () => {
      aurora()
        .should('have.attr', 'aria-hidden', 'true')
        .and('have.css', 'pointer-events', 'none')
        .and('have.css', 'z-index', '-1');
      bands().should('have.length', 3);
    });

    it('holds completely still', () => {
      aurora().should(($aurora) => {
        expect($aurora[0].getAnimations({ subtree: true })).to.have.length(0);
      });
      cy.get('[data-cy="hero"]').trigger('pointermove', 50, 120);
      aurora().should(($aurora) => {
        expect($aurora[0].getAnimations({ subtree: true })).to.have.length(0);
      });
    });

    it('keeps its lights near the top of the screen', () => {
      bands().should(($bands) => {
        [...$bands].forEach((band) => {
          const { top, height } = band.getBoundingClientRect();
          expect(top + height / 2).to.be.lessThan(800 * 0.6);
        });
      });
    });

    it('stays in the content column, clear of the hero', () => {
      cy.get('[data-cy="hero"]').then(($hero) => {
        cy.get('[data-cy="homeWrapper"]').then(($wrapper) => {
          aurora().should(($aurora) => {
            expect(rect($aurora).left).to.be.at.least(rect($hero).right - 1);
            expect(rect($aurora).right).to.be.at.most(rect($wrapper).right + 1);
          });
        });
      });
    });

    it('scrolls away with the content', () => {
      aurora().then(($aurora) => {
        const start = rect($aurora).top;
        cy.get('[data-cy="homeWrapper"]').scrollTo(0, 300);
        aurora().should(($moved) => {
          expect(rect($moved).top).to.be.closeTo(start - 300, 1);
        });
      });
    });

    it('keeps text at 4.5:1 over its brightest color', () => {
      aurora().should('exist');
      cy.document().then((doc) => {
        const hero = doc.querySelector('[data-cy="hero"]');
        const header = doc.querySelector('[data-cy="homeHeader"]');
        const page = getComputedStyle(hero.parentElement).backgroundColor;
        const layerOpacity = Number(
          getComputedStyle(doc.querySelector('[data-cy="heroAurora"]')).opacity
        );
        // Worst case: the lightest aurora color at full strength in the
        // layer, then whatever each area paints over it
        const sky = [
          '--color-aurora-green',
          '--color-aurora-teal',
          '--color-aurora-purple',
        ]
          .map((variable) =>
            composite(resolveColor(doc, variable), page, layerOpacity)
          )
          .sort((a, b) => luminance(b) - luminance(a))[0];
        const card = composite(resolveColor(doc, '--color-card'), sky);
        const backgrounds = {
          // The Aurora doesn't reach the hero
          hero: composite(
            resolveColor(doc, '--color-background-overlay'),
            page
          ),
          header: composite(
            getComputedStyle(header, '::before').backgroundColor,
            sky
          ),
          content: sky,
          // A tag on a project card, the lightest place a tag sits
          chip: composite(resolveColor(doc, '--color-accent-soft'), card),
        };

        const checks = [
          ['heroName', 'hero', 4.5],
          ['heroRole', 'hero', 4.5],
          ['heroText', 'hero', 4.5],
          ['heroMail', 'hero', 4.5],
          // Icons are graphics, which WCAG asks 3:1 of, not text
          ['socialGithub', 'hero', 3],
          ['socialLinkedin', 'hero', 3],
          ['navLink', 'header', 4.5],
          ['filterButton', 'header', 4.5],
          ['jobTitle', 'content', 4.5],
          ['jobTag', 'chip', 4.5],
        ];
        checks.forEach(([id, area, minimum]) => {
          const color = getComputedStyle(
            doc.querySelector(`[data-cy="${id}"]`)
          ).color;
          expect(contrast(color, backgrounds[area]), id).to.be.at.least(
            minimum
          );
        });
      });
    });

    it('shows through the header, blurred', () => {
      cy.get('[data-cy="homeHeader"]').should(($header) => {
        const layer = getComputedStyle($header[0], '::before');
        expect(layer.backdropFilter).to.contain('blur');
        const alpha = Number(layer.backgroundColor.match(/[\d.]+/g)[3] ?? 1);
        expect(alpha, 'see-through').to.be.lessThan(1);
      });
    });

    it('goes away in the light theme and comes back in dark', () => {
      cy.get('[data-cy="themeToggle"]').click();
      cy.get('html').should('have.attr', 'data-theme', 'light');
      aurora().should('not.exist');
      cy.get('[data-cy="themeToggle"]').click();
      aurora().should('exist');
    });
  });

  it('keeps its lights as close together on a huge screen', () => {
    cy.viewport(2560, 1440);
    cy.visitHome();
    // Band sizes and gaps stop growing past 1600x1000
    bands().should(($bands) => {
      const [first, second, third] = [...$bands];
      expect(first.offsetHeight).to.be.closeTo(300, 1);
      expect(second.offsetTop - first.offsetTop).to.be.closeTo(150, 1);
      expect(third.offsetTop - second.offsetTop).to.be.closeTo(150, 1);
    });
  });

  context('phone', () => {
    beforeEach(() => {
      cy.viewport(375, 812);
      cy.visitHome();
    });

    it('uses two bands', () => {
      bands().filter(':visible').should('have.length', 2);
    });

    it('starts below the hero', () => {
      cy.get('[data-cy="hero"]').then(($hero) => {
        aurora().should(($aurora) => {
          expect(rect($aurora).top).to.be.at.least(rect($hero).bottom - 1);
        });
      });
    });

    it('scrolls away with the page', () => {
      aurora().then(($aurora) => {
        const start = rect($aurora).top;
        cy.scrollTo(0, 300);
        aurora().should(($moved) => {
          expect(rect($moved).top).to.be.closeTo(start - 300, 1);
        });
      });
    });
  });
});
