import "cypress-real-events";
// import "@cypress/code-coverage/support";
import "./component/assertions";
import "./component/commands";

import "./component/cypress.css";
import "@vuu-ui/vuu-theme/index.css";
import "@vuu-ui/vuu-icons/index.css";

beforeEach(() => {
  cy.window({ log: false }).focus({ log: false });
});
