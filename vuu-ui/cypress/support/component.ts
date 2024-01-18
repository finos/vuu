import "cypress-real-events";
// import "@cypress/code-coverage/support";
import "./component/assertions";
import "./component/commands";

import "./component/cypress.css";
import "@finos/vuu-theme/index.css";
import "@finos/vuu-icons/index.css";

beforeEach(() => {
  cy.window({ log: false }).focus({ log: false });
});
