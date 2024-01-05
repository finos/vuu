/// <reference types="cypress" />

import {
  APPLICATION_LAYOUT_URL,
  DEFAULT_APPLICATION_LAYOUT_ALIAS,
  deleteApplicationLayout,
  getApplicationLayout,
  persistApplicationLayout,
} from "./api.utils";
import { ApplicationJSON, ApplicationSettings } from "@finos/vuu-layout";

// TODO Tests are failing due to JSON object comparison, experiment with different variations of casting, JSON.stringify, etc.

describe("Application Layouts", () => {
  const testUser = "Test User";

  before(() => {
    getApplicationLayout(testUser).then((response) => {
      Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS, response.body.definition);
    });
  });

  context("GET /application-layouts", () => {
    it("should return a 200 with the default application layout", () => {
      getApplicationLayout(testUser).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("username");
        expect(response.body).to.have.property("definition");
        expect(response.body.definition).to.contain(
          Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS)
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
          originalApplicationLayout = response.body.definition;
        })
        .then(() => {
          persistApplicationLayout(testUser, requestBody).then((response) => {
            expect(response.body).to.not.exist;
            expect(response.status).to.eq(201);
          });
        })
        .then(() => {
          getApplicationLayout(testUser).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property("username", testUser);
            expect(response.body).to.have.property("definition");
            expect(response.body.definition).to.contain(requestBody);
            expect(response.body.definition).to.not.contain(
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
          expect(response.body).to.not.exist;
        })
        .then(() => {
          getApplicationLayout(testUser).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body).to.have.property("settings");
            expect(response.body.settings).to.contain(settings);
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
