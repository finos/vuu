import AssertionStatic = Chai.AssertionStatic;
import ChaiPlugin = Chai.ChaiPlugin;
import { prettyDOM } from "@testing-library/dom";

function elementToString(element: Element | null | undefined) {
  if (typeof element?.nodeType === "number") {
    return prettyDOM(element, undefined, { highlight: true, maxDepth: 1 });
  }
  return String(element);
}

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
      /**
       * Checks if the element is in the viewport.
       *
       * @example
       ```
       cy.findByRole('option).should('be.inTheViewport')
       ```
       * */
      (chainer: "be.inTheViewport"): Chainable<Subject>;
      /**
        * Checks if the element is not in the viewport.
        *
        * @example
        ```
        cy.findByRole('option).should('not.be.inTheViewport')
        ```
        * */
      (chainer: "not.be.inTheViewport"): Chainable<Subject>;
      /**
       * Checks if the element fills the viewport.
       * e.g might have style {height: 100vh, width: 100vw1}
       *
       * @example
       ```
       cy.findTestId('shell').should('be.sizedToFillViewport')
       ```
       * */
      (chainer: "be.sizedToFillViewport"): Chainable<Subject>;
      (chainer: "not.be.sizedToFillViewport"): Chainable<Subject>;
      /**
        * Checks if the element is the active descendant.
        *
        * @example
        ```
        cy.findByRole('option).should('be.activeDescendant')
        ```
        * */
      (chainer: "be.activeDescendant"): Chainable<Subject>;
      /**
        * Checks if the element is not the active descendant.
        *
        * @example
        ```
        cy.findByRole('option).should('not.be.activeDescendant')
        ```
        * */
      (chainer: "not.be.activeDescendant"): Chainable<Subject>;

      /**
       * Checks if there is a text selection in effect that
       * matches the expectation.
       *
       * @example
       ```
       cy.findByTestId('test-input).should('have.selectionRange',0, 2)
       ```
       * */
      (
        chainer: "have.selectionRange",
        from: number,
        to: number,
      ): Chainable<Subject>;
    }
  }
}

/**
 * Checks if the class includes the expected highlighted class
 *
 * @example
 * cy.findByRole('option).should('be.highlighted')
 */
const isHighlighted: ChaiPlugin = (_chai) => {
  function assertIsHighlighted(this: AssertionStatic) {
    const root = this._obj.get(0);
    // make sure it's an Element
    new _chai.Assertion(
      root.nodeType,
      `Expected an Element but got '${String(root)}'`,
    ).to.equal(1);

    const className = this._obj.attr("class");

    this.assert(
      className.match(/saltHighlighted/),
      `expected root to include CSS class #{exp}, got #{act} instead.`,
      `expected root not to have class #{exp}.`,
      "saltHighlighted",
      className,
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
const hasFocusVisible: ChaiPlugin = (_chai) => {
  function assertHasFocusVisible(this: AssertionStatic) {
    const root = this._obj.get(0);
    // make sure it's an Element
    new _chai.Assertion(
      root.nodeType,
      `Expected an Element but got '${String(root)}'`,
    ).to.equal(1);

    const className = this._obj.attr("class");

    this.assert(
      className.match(/saltFocusVisible/),
      `expected root to include CSS class #{exp}, got #{act} instead.`,
      `expected root not to have class #{exp}.`,
      "saltFocusVisible",
      className,
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
const hasAriaSelected: ChaiPlugin = (_chai) => {
  function assertHasAriaSelected(this: AssertionStatic) {
    const root = this._obj.get(0);
    // make sure it's an Element
    new _chai.Assertion(
      root.nodeType,
      `Expected an Element but got '${String(root)}'`,
    ).to.equal(1);

    const ariaSelected = this._obj.attr("aria-selected");

    this.assert(
      ariaSelected === "true",
      `expected root to have aria-selected #{exp}, got #{act} instead.`,
      `expected root to have aria-selected = #{exp}, got #{act} instead`,
      "true",
      ariaSelected,
    );
  }

  _chai.Assertion.addMethod("ariaSelected", assertHasAriaSelected);
};

// registers our assertion function "isHighlighted" with Chai
chai.use(hasAriaSelected);

/**
 * Checks if the element is in the viewport
 *
 * @example
 * cy.findByRole('option).should('be.inTheViewport')
 */
const isInTheViewport: ChaiPlugin = (_chai, utils) => {
  function assertIsInTheViewport(this: AssertionStatic) {
    const root = this._obj.get(0);
    // make sure it's an Element
    new _chai.Assertion(
      root.nodeType,
      `Expected an Element but got '${String(root)}'`,
    ).to.equal(1);

    const viewportHeight = Cypress.config(`viewportHeight`);
    const rect = root.getBoundingClientRect();

    this.assert(
      !(rect.bottom < 0 || rect.top - viewportHeight >= 0),
      `expected \n${elementToString(root)} to be in the viewport.`,
      `expected \n${elementToString(root)} to not be in the viewport`,
      null,
    );
  }

  _chai.Assertion.addMethod("inTheViewport", assertIsInTheViewport);
};
// registers our assertion function "isInTheViewport" with Chai
chai.use(isInTheViewport);

/**
 * Checks if the element fills the viewport.
 * e.g might have style {height: 100vh, width: 100vw}
 *
 * @example
 ```
  cy.findTestId('shell').should('be.sizedToFillViewport')
  ```
  * */
const isViewportSize: ChaiPlugin = (_chai, utils) => {
  function assertIsViewportSize(this: AssertionStatic) {
    const root = this._obj.get(0);
    // make sure it's an Element
    new _chai.Assertion(
      root.nodeType,
      `Expected an Element but got '${String(root)}'`,
    ).to.equal(1);

    const viewportHeight = Cypress.config(`viewportHeight`);
    const viewportWidth = Cypress.config(`viewportWidth`);
    const rect = root.getBoundingClientRect();

    this.assert(
      rect.height === viewportHeight && rect.width === viewportWidth,
      `expected \n${elementToString(
        root,
      )} to be sized to fill viewport (${viewportWidth} x ${viewportHeight}), actual height ${
        rect.height
      }, width: ${rect.width} .`,
      `expected \n${elementToString(root)} to not be sized to fill viewport.`,
      null,
    );
  }

  _chai.Assertion.addMethod("sizedToFillViewport", assertIsViewportSize);
};

// registers our assertion function "viewportSize" with Chai
chai.use(isViewportSize);

/**
 * Checks if the element is in the viewport
 *
 * @example
 * cy.findByRole('option).should('be.activeDescendant')
 */
const isActiveDescendant: ChaiPlugin = (_chai) => {
  function assertIsActiveDescendant(this: AssertionStatic) {
    // make sure it's an Element
    const root = this._obj.get(0);
    // make sure it's an Element
    new _chai.Assertion(
      root.nodeType,
      `Expected an Element but got '${String(root)}'`,
    ).to.equal(1);

    const id = root.id;
    cy.focused({ log: false }).then(($focused) => {
      this.assert(
        $focused.attr("aria-activedescendant") === id,
        "expected #{this} to be #{exp}",
        "expected #{this} not to be #{exp}",
        "active descendant",
      );
    });
  }

  _chai.Assertion.addMethod("activeDescendant", assertIsActiveDescendant);
};

// registers our assertion function "isFocused" with Chai
chai.use(isActiveDescendant);

/**
 * Checks if the element text includes a text selection range
 *
 * @example
 * cy.findByTestId('test-input).should('have.selectionRange',0,3)
 */
const hasSelectionRange: ChaiPlugin = (_chai, utils) => {
  function assertHasSelectedRange(
    this: AssertionStatic,
    rangeFrom: number,
    rangeTo: number,
  ) {
    const root = this._obj.get(0);
    // make sure it's an Element
    new _chai.Assertion(
      root.nodeType,
      `Expected an Element but got '${String(root)}'`,
    ).to.equal(1);

    const { selectionStart, selectionEnd } = root;

    this.assert(
      rangeFrom === selectionStart && rangeTo === selectionEnd,
      `expected root to have selectionRange from:${rangeFrom} to: ${rangeTo}, got from: ${selectionStart} to: ${selectionEnd} instead.`,
      `expected root not to have selectionRange from:${rangeFrom} to: ${rangeTo}`,
      "selectedRange",
    );
  }

  _chai.Assertion.addMethod("selectionRange", assertHasSelectedRange);
};

// registers our assertion function "hasSelectedRange" with Chai
chai.use(hasSelectionRange);

export {};
