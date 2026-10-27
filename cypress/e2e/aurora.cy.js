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

describe('Aurora', () => {
  context('desktop, dark theme', () => {
    beforeEach(() => {
      cy.viewport(1280, 800);
      cy.visitHome();
    });

    it('drifts behind the whole page without catching clicks', () => {
      aurora()
        .should('have.attr', 'aria-hidden', 'true')
        .and('have.css', 'pointer-events', 'none')
        .and('have.css', 'z-index', '-1')
        .and('have.css', 'position', 'fixed')
        .should(($aurora) => {
          const rect = $aurora[0].getBoundingClientRect();
          expect(rect.width).to.equal(
            $aurora[0].ownerDocument.documentElement.clientWidth
          );
          expect(rect.height).to.be.closeTo(800, 1);
        });
      // A sibling of the hero, behind it and the content column alike
      cy.get('[data-cy="hero"]')
        .parent()
        .children('[data-cy="heroAurora"]')
        .should('exist');
      bands()
        .should('have.length', 3)
        .each(($band) => {
          expect(getComputedStyle($band[0]).animationName).not.to.equal('none');
        });
    });

    it('floats its bands around the screen instead of staying put', () => {
      const centers = () =>
        cy.get('[data-cy="auroraBand"]').then(($bands) =>
          [...$bands].map((band) => {
            const { left, top, width, height } = band.getBoundingClientRect();
            return { x: left + width / 2, y: top + height / 2 };
          })
        );
      cy.get('[data-cy="auroraPath"]')
        .should('have.length', 3)
        .each(($path) => {
          expect(getComputedStyle($path[0]).animationName).to.match(
            /^hero-aurora-wander-\d/
          );
        });
      // The paths are slow, so a short wait still shows each band moving
      centers().then((before) => {
        cy.wait(1500);
        centers().then((after) => {
          after.forEach(({ x, y }, i) => {
            const moved = Math.hypot(x - before[i].x, y - before[i].y);
            expect(moved, `band ${i + 1} moved`).to.be.greaterThan(2);
          });
        });
      });
      // Their paths reach well below the top of the screen. Centres, not
      // tops: the skew stretches a wide band's box far above its middle.
      centers().then((now) => {
        const lowest = Math.max(...now.map(({ y }) => y));
        expect(lowest, 'a band below the top quarter').to.be.greaterThan(
          800 * 0.25
        );
      });
    });

    it('brightens gently around the cursor', () => {
      cy.get('[data-cy="auroraGlow"]').should('have.css', 'opacity', '0');
      cy.get('[data-cy="hero"]').trigger('pointermove', 50, 120);
      aurora().should(($aurora) => {
        expect($aurora[0].style.getPropertyValue('--aurora-y')).to.match(/%$/);
      });
      cy.get('[data-cy="auroraGlow"]').should(($glow) => {
        expect(Number(getComputedStyle($glow[0]).opacity)).to.be.greaterThan(0);
      });
      cy.get('[data-cy="hero"]').trigger('pointerleave');
      cy.get('[data-cy="auroraGlow"]').should('have.css', 'opacity', '0');
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
        const backgrounds = {
          hero: composite(getComputedStyle(hero).backgroundColor, sky),
          header: composite(
            getComputedStyle(header, '::before').backgroundColor,
            sky
          ),
          content: sky,
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
          ['jobTag', 'content', 4.5],
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

  it('uses two slower bands on phones', () => {
    cy.viewport(375, 812);
    cy.visitHome();
    bands().filter(':visible').should('have.length', 2);
    bands()
      .first()
      .should(($band) => {
        expect(
          parseFloat(getComputedStyle($band[0]).animationDuration)
        ).to.be.greaterThan(26);
      });
  });

  it('stands still for visitors who prefer reduced motion', () => {
    cy.viewport(1280, 800);
    cy.visitHome({ reducedMotion: true });
    aurora().should('exist');
    bands().each(($band) => {
      expect(getComputedStyle($band[0]).animationName).to.equal('none');
    });
    cy.get('[data-cy="auroraPath"]').each(($path) => {
      expect(getComputedStyle($path[0]).animationName).to.equal('none');
    });
    cy.get('[data-cy="hero"]').trigger('pointermove', 50, 120);
    cy.get('[data-cy="auroraGlow"]').should('not.be.visible');
  });
});
