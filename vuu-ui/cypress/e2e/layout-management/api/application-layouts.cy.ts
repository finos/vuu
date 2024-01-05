/// <reference types="cypress" />

import {
  DEFAULT_APPLICATION_LAYOUT_ALIAS,
  getApplicationLayout,
} from "./api.utils";
import { ApplicationJSON, ApplicationSettings } from "@finos/vuu-layout";

describe("Application Layouts", () => {
  const testUser = "Test User";

  context("GET /application-layouts", () => {
    it("should return a 200 with the default application layout and a null user", () => {
      getApplicationLayout(testUser).then(async (response) => {
        const body = await response.json();

        expect(response.status).to.eq(200);
        expect(body).to.have.property("username", null);
        expect(body).to.have.property("definition");

        Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS, body.definition);
      });
    });
  });

  context("PUT /application-layouts", () => {
    it("should update the application layout for the user", () => {
      const requestBody: ApplicationJSON = {
        layout: {
          type: "Updated",
        },
      };

      cy.request({
        method: "PUT",
        url: "http://localhost:8081/api/application-layouts",
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

      getApplicationLayout(testUser).then(async (response) => {
        const body = await response.json();

        expect(response.status).to.eq(200);
        expect(body).to.have.property("username", testUser);
        expect(body).to.have.property("definition");
        expect(body.definition).to.contain(requestBody.layout);
      });
    });

    it("should send a request without settings and return a 201", () => {
      const requestBody: ApplicationJSON = {
        layout: Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS),
      };

      cy.request({
        method: "PUT",
        url: "http://localhost:8081/api/application-layouts",
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

      cy.request({
        method: "PUT",
        url: "http://localhost:8081/api/application-layouts",
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

      getApplicationLayout(testUser).then(async (response) => {
        const body = await response.json();

        expect(response.status).to.eq(200);
        expect(body).to.have.property("username", testUser);
        expect(body).to.have.property("definition");
        expect(body).to.have.property("settings");

        expect(body.definition).to.contain(
          Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS)
        );

        expect(body.settings).to.contain(settings);
      });
    });
  });

  context("DELETE /application-layouts", () => {
    it("should return a 204 and the user should not have an application layout", () => {
      cy.request({
        method: "DELETE",
        url: "http://localhost:8081/api/application-layouts",
        headers: {
          username: testUser,
        },
      }).then((response) => {
        expect(response.status).to.eq(204);
        expect(response.body).to.be.empty;
      });

      getApplicationLayout(testUser).then(async (response) => {
        const body = await response.json();

        expect(response.status).to.eq(200);
        expect(body).to.have.property("username", null);
        expect(body).to.have.property("definition");
        expect(body.definition).to.contain(
          Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS)
        );
      });
    });
  });
});
