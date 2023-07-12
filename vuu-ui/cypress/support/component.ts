import "cypress-real-events";
// import "@cypress/code-coverage/support";
import "./assertions";
import "./commands";

import "./cypress.css";
import "./index.css";

beforeEach(() => {
  cy.window({ log: false }).focus({ log: false });
});
