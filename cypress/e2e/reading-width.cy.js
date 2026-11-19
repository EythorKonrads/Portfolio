// The Reading width caps section content on large screens; the Aurora and
// the Header's blurred bar still fill the Content column
const rect = (el) => el.getBoundingClientRect();
const READING_WIDTH = 768;
const sections = ['ask', 'experience', 'education', 'projects'];

// The text box: the section without its side padding
const textBox = (el) => {
  const { paddingLeft, paddingRight } = getComputedStyle(el);
  const { left, right } = rect(el);
  return {
    left: left + parseFloat(paddingLeft),
    right: right - parseFloat(paddingRight),
  };
};

describe('Reading width', () => {
  context('huge screen (2560x1440)', () => {
    beforeEach(() => {
      cy.viewport(2560, 1440);
      cy.visitHome();
    });

    it('caps every section at the Reading width, left-aligned', () => {
      cy.get('[data-cy="homeWrapper"]').should(($wrapper) => {
        const column = $wrapper[0];
        const columnLeft =
          rect(column).left + parseFloat(getComputedStyle(column).paddingLeft);
        sections.forEach((id) => {
          const section = column.querySelector(`[data-cy="${id}"]`);
          const { left, right } = textBox(section);
          expect(right - left, `${id} text width`).to.be.closeTo(
            READING_WIDTH,
            1
          );
          expect(rect(section).left, `${id} left`).to.be.closeTo(columnLeft, 1);
        });
      });
    });

    it('still lets the Aurora reach the right edge of the column', () => {
      cy.get('[data-cy="homeWrapper"]').then(($wrapper) => {
        cy.get('[data-cy="heroAurora"]').should(($aurora) => {
          expect(rect($aurora[0]).right).to.be.closeTo(
            rect($wrapper[0]).left + $wrapper[0].clientWidth,
            1
          );
        });
      });
    });

    it('lines the Header up with the text, its bar still full width', () => {
      cy.get('[data-cy="homeWrapper"]').should(($wrapper) => {
        const column = $wrapper[0];
        const header = column.querySelector('[data-cy="homeHeader"]');
        const text = textBox(column.querySelector('[data-cy="experience"]'));
        const nav = column.querySelector('[data-cy="sectionNav"]');
        const filter = column.querySelector('[data-cy="filterButton"]');

        expect(rect(nav).left, 'links start').to.be.closeTo(text.left, 1);
        expect(rect(filter).right, 'filter ends').to.be.closeTo(text.right, 1);
        const { paddingLeft, paddingRight } = getComputedStyle(column);
        expect(rect(header).width, 'bar width').to.be.closeTo(
          column.clientWidth -
            parseFloat(paddingLeft) -
            parseFloat(paddingRight),
          1
        );
      });
    });
  });

  it('caps nothing on a smaller screen', () => {
    cy.viewport(1024, 768);
    cy.visitHome();
    cy.get('[data-cy="homeWrapper"]').should(($wrapper) => {
      const column = $wrapper[0];
      const { paddingLeft, paddingRight } = getComputedStyle(column);
      const columnWidth =
        column.clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight);
      expect(columnWidth).to.be.lessThan(READING_WIDTH + 64);
      sections.forEach((id) => {
        const section = column.querySelector(`[data-cy="${id}"]`);
        expect(rect(section).width, id).to.be.closeTo(columnWidth, 1);
      });
      const filter = column.querySelector('[data-cy="filterButton"]');
      const header = column.querySelector('[data-cy="homeHeader"]');
      expect(rect(filter).right).to.be.closeTo(
        rect(header).right - parseFloat(getComputedStyle(header).paddingRight),
        1
      );
    });
  });
});
