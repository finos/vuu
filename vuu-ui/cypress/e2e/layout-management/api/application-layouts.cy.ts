/// <reference types="cypress" />

import {
  APPLICATION_LAYOUT_URL,
  DEFAULT_APPLICATION_LAYOUT_ALIAS,
  DEFAULT_APPLICATION_SETTINGS_ALIAS,
  deleteApplicationLayout,
  getApplicationLayout,
  persistApplicationLayout,
} from "./api.utils";
import { ApplicationJSON, ApplicationSettings, LayoutJSON } from "@finos/vuu-layout";

describe("Application Layouts", () => {
  const testUser = "Test User";

  before(() => {
    getApplicationLayout(testUser).then((response) => {
      Cypress.env(
        DEFAULT_APPLICATION_LAYOUT_ALIAS,
        response.body.applicationLayout
      );
      Cypress.env(
        DEFAULT_APPLICATION_SETTINGS_ALIAS,
        response.body.settings
      );
    });
  });

  context("GET /application-layouts", () => {
    it("should return a 200 with the default application layout", () => {
      getApplicationLayout(testUser).then((response) => {
        expect(response.status).to.eq(200);

        expect(response.body).to.have.property("applicationLayout");

        expect(JSON.stringify(response.body.applicationLayout)).to.equal(
          JSON.stringify(Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS))
        );
        expect(JSON.stringify(response.body.settings)).to.equal(
          JSON.stringify(Cypress.env(DEFAULT_APPLICATION_SETTINGS_ALIAS))
        );
      });
    });
  });

  context("PUT /application-layouts", () => {
    beforeEach(() => {
      const requestBody: ApplicationJSON = {
        applicationLayout: Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS),
        settings: Cypress.env(DEFAULT_APPLICATION_SETTINGS_ALIAS),
      }

      persistApplicationLayout(
        testUser,
        requestBody,
      );
    });

    afterEach(() => {
      deleteApplicationLayout(testUser);
    });

    it("should update the application layout for the user", () => {
      let originalApplicationLayout: LayoutJSON;
      let originalApplicationSettings: ApplicationSettings;

      const requestBody: ApplicationJSON = {
        applicationLayout: {
          type: "Updated",
        },
        settings: {
          leftNav: {
            activeTabIndex: 1,
            expanded: false,
          },
        },
      };

      getApplicationLayout(testUser)
        .then((response) => {
          originalApplicationLayout = response.body.applicationLayout;
          originalApplicationSettings = response.body.settings;
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

            expect(response.body).to.have.property("applicationLayout");
            expect(response.body).to.have.property("settings");

            expect(JSON.stringify(response.body)).to.equal(
              JSON.stringify(requestBody)
            );

            expect(response.body.applicationLayout).to.not.equal(
              originalApplicationLayout
            );
            expect(response.body.settings).to.not.equal(
              originalApplicationSettings
            );
          });
        });
    });

    it("should send a request without settings and return a 201", () => {
      const requestBody: ApplicationJSON = {
        applicationLayout: Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS),
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
        applicationLayout: Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS),
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
          });
        });
    });
  });
});
