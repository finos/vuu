/// <reference types="cypress" />

import {
  APPLICATION_LAYOUT_URL,
  DEFAULT_APPLICATION_LAYOUT_ALIAS,
  deleteApplicationLayout,
  getApplicationLayout,
  persistApplicationLayout,
} from "./api.utils";
import { ApplicationJSON, ApplicationSettings } from "@finos/vuu-layout";

describe("Application Layouts", () => {
  const testUser = "Test User";

  before(() => {
    getApplicationLayout(testUser).then((response) => {
      Cypress.env(
        DEFAULT_APPLICATION_LAYOUT_ALIAS,
        response.body.applicationLayout
      );
    });
  });

  context("GET /application-layouts", () => {
    it("should return a 200 with the default application layout", () => {
      getApplicationLayout(testUser).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("username");
        expect(response.body).to.have.property("applicationLayout");
        expect(JSON.stringify(response.body.applicationLayout)).to.equal(
          JSON.stringify(Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS))
        );
      });
    });
  });

  context("PUT /application-layouts", () => {
    beforeEach(() => {
      persistApplicationLayout(
        testUser,
        Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS)
      );
    });

    afterEach(() => {
      deleteApplicationLayout(testUser);
    });

    it("should update the application layout for the user", () => {
      let originalApplicationLayout: any;

      const requestBody: ApplicationJSON = {
        layout: {
          type: "Updated",
        },
      };

      getApplicationLayout(testUser)
        .then((response) => {
          originalApplicationLayout = response.body.applicationLayout;
        })
        .then(() => {
          persistApplicationLayout(testUser, requestBody).then((response) => {
            expect(response.body).to.be.empty;
            expect(response.status).to.eq(201);
          });
        })
        .then(() => {
          getApplicationLayout(testUser).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property("username", testUser);
            expect(response.body).to.have.property("applicationLayout");
            expect(JSON.stringify(response.body.applicationLayout)).to.equal(
              JSON.stringify(requestBody)
            );
            expect(response.body.applicationLayout).to.not.contain(
              originalApplicationLayout
            );
          });
        });
    });

    it("should send a request without settings and return a 201", () => {
      const requestBody: ApplicationJSON = {
        layout: Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS),
      };

      cy.request({
        method: "PUT",
        url: APPLICATION_LAYOUT_URL,
        headers: {
          username: testUser,
        },
        body: {
          requestBody,
        },
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.not.exist;
      });
    });

    it("should send a request with settings and return a 201 with the settings", () => {
      const settings: ApplicationSettings = {
        leftNav: {
          activeTabIndex: 1,
          expanded: false,
        },
      };
      const requestBody: ApplicationJSON = {
        layout: Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS),
        settings,
      };

      persistApplicationLayout(testUser, requestBody)
        .then((response) => {
          expect(response.status).to.eq(201);
          expect(response.body).to.be.empty;
        })
        .then(() => {
          getApplicationLayout(testUser).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property("settings");
            expect(JSON.stringify(response.body.settings)).to.equal(
              JSON.stringify(settings)
            );
          });
        });
    });
  });

  context("DELETE /application-layouts", () => {
    it("should return a 204 and the user should not have an application layout", () => {
      persistApplicationLayout(
        testUser,
        Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS)
      );

      deleteApplicationLayout(testUser)
        .then((response) => {
          expect(response.status).to.eq(204);
          expect(response.body).to.be.empty;
        })
        .then(() => {
          getApplicationLayout(testUser).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property("username", null);
          });
        });
    });
  });
});
