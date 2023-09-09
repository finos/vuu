import AssertionStatic = Chai.AssertionStatic;
import ChaiPlugin = Chai.ChaiPlugin;

// Must be declared global to be detected by typescript (allows import/export)
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainer<Subject> {
      /**
       * Checks if the accessible name computation (according to `accname` spec)
       * matches the expectation.
       *
       * @example
       ```
       cy.findByRole('button).should('have.accessibleName','Close')
       ```
       * */
      (chainer: "have.accessibleName"): Chainable<Subject>;

      /**
       * Checks if the accessible name computation (according to `accname` spec)
       * does NOT match the expectation.
       *
       * @example
       ```
       cy.findByRole('button).should('not.have.accessibleName','Close')
       ```
       * */
      (chainer: "not.have.accessibleName"): Chainable<Subject>;
      /**
       * Checks if the announcement is matches the expectation.
       *
       * @example
       ```
       cy.findByRole('button).click().should('announce','Close')
       ```
       * */
      (chainer: "announce"): Chainable<Subject>;
      /**
       * Checks if the approriate saltHighlighted className has been applied.
       *
       * @example
       ```
       cy.findByRole('option).should('be.highlighted')
       ```
       * */
      (chainer: "be.highlighted"): Chainable<Subject>;
      /**
       * Checks if the approriate saltHighlighted className has been applied.
       *
       * @example
       ```
       cy.findByRole('option).should('be.highlighted')
       ```
       * */
      (chainer: "not.be.highlighted"): Chainable<Subject>;
      /**
       * Checks that the aria-selected attribute has been applied.
       *
       * @example
       ```
       cy.findByRole('option).should('have.ariaSelected')
       ```
       * */
      (chainer: "have.ariaSelected"): Chainable<Subject>;
      /**
       * Checks that the aria-selected attribute is not present.
       *
       * @example
       ```
       cy.findByRole('option).should('not.have.ariaSelected')
       ```
       * */
      (chainer: "not.have.ariaSelected"): Chainable<Subject>;
      /**
       * Checks if the approriate saltFocusVisible className has been applied.
       *
       * @example
       ```
       cy.findByRole('option).should('have.focusVisible')
       ```
       * */
      (chainer: "be.focusVisible"): Chainable<Subject>;
      (chainer: "have.focusVisible"): Chainable<Subject>;
      /**
       * Checks if the approriate saltFocusVisible className has been applied.
       *
       * @example
       ```
       cy.findByRole('option).should('not.have.focusVisible')
       ```
       * */
      (chainer: "not.be.focusVisible"): Chainable<Subject>;
      (chainer: "not.have.focusVisible"): Chainable<Subject>;
    }
  }
}

/**
 * Checks if the class includes the expected highlighted class
 *
 * @example
 * cy.findByRole('option).should('be.highlighted')
 */
const isHighlighted: ChaiPlugin = (_chai, utils) => {
  function assertIsHighlighted(this: AssertionStatic) {
    const root = this._obj.get(0);
    // make sure it's an Element
    new _chai.Assertion(
      root.nodeType,
      `Expected an Element but got '${String(root)}'`
    ).to.equal(1);

    const className = this._obj.attr("class");

    this.assert(
      className.match(/saltHighlighted/),
      `expected root to include CSS class #{exp}, got #{act} instead.`,
      `expected root not to have class #{exp}.`,
      "saltHighlighted",
      className
    );
  }

  _chai.Assertion.addMethod("highlighted", assertIsHighlighted);
};

// registers our assertion function "isHighlighted" with Chai
chai.use(isHighlighted);

/**
 * Checks if the class includes the expected saltFocusVisible class
 *
 * @example
 * cy.findByRole('option).should('have.focusVisible')
 */
const hasFocusVisible: ChaiPlugin = (_chai, utils) => {
  function assertHasFocusVisible(this: AssertionStatic) {
    const root = this._obj.get(0);
    // make sure it's an Element
    new _chai.Assertion(
      root.nodeType,
      `Expected an Element but got '${String(root)}'`
    ).to.equal(1);

    const className = this._obj.attr("class");

    this.assert(
      className.match(/saltFocusVisible/),
      `expected root to include CSS class #{exp}, got #{act} instead.`,
      `expected root not to have class #{exp}.`,
      "saltFocusVisible",
      className
    );
  }

  _chai.Assertion.addMethod("focusVisible", assertHasFocusVisible);
};

// registers our assertion function "isHighlighted" with Chai
chai.use(hasFocusVisible);

/**
 * Checks if the class includes the expected highlighted class
 *
 * @example
 * cy.findByRole('option).should('be.highlighted')
 */
const hasAriaSelected: ChaiPlugin = (_chai, utils) => {
  function assertHasAriaSelected(this: AssertionStatic) {
    const root = this._obj.get(0);
    // make sure it's an Element
    new _chai.Assertion(
      root.nodeType,
      `Expected an Element but got '${String(root)}'`
    ).to.equal(1);

    const ariaSelected = this._obj.attr("aria-selected");

    this.assert(
      ariaSelected === "true",
      `expected root to have aria-selected #{exp}, got #{act} instead.`,
      `expected root to have aria-selected = #{exp}, got #{act} instead`,
      "true",
      ariaSelected
    );
  }

  _chai.Assertion.addMethod("ariaSelected", assertHasAriaSelected);
};

// registers our assertion function "isHighlighted" with Chai
chai.use(hasAriaSelected);

export {};
