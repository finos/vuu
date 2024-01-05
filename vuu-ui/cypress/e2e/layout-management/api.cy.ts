/// <reference types="cypress" />

import { LayoutMetadata, LayoutMetadataDto } from "@finos/vuu-shell";
import {
  createLayout,
  deleteLayout,
  getLayout,
  LAYOUT_API_BASE_URL,
  LayoutResponseDto,
  TEST_LAYOUT_ID_ALIAS,
  TEST_LAYOUT_JSON,
  TEST_METADATA_DTO,
} from "./api.utils";

describe("User Layouts", () => {
  beforeEach(async () => {
    console.log(
      "SETUP STARTING\nLAYOUT ID: ",
      Cypress.env(TEST_LAYOUT_ID_ALIAS),
      "\n"
    );

    try {
      const response = await createLayout(TEST_LAYOUT_JSON, TEST_METADATA_DTO);
      const body: LayoutResponseDto = await response.json();

      if (!body.id) throw new Error("No ID returned from POST /layouts");
      Cypress.env(TEST_LAYOUT_ID_ALIAS, body.id);
    } catch (error) {
      console.log("ERROR IN SETUP: ", error);
      return "erroredId";
    }

    console.log(
      "SETUP ENDING\nLAYOUT ID: ",
      Cypress.env(TEST_LAYOUT_ID_ALIAS),
      "\n"
    );
  });

  afterEach(() => {
    console.log(
      "TEARDOWN STARTING\nLAYOUT ID: ",
      Cypress.env(TEST_LAYOUT_ID_ALIAS),
      "\n"
    );

    deleteLayout(Cypress.env(TEST_LAYOUT_ID_ALIAS)).catch((error) => {
      console.log("ERROR IN TEARDOWN: ", error);
    });

    Cypress.env(TEST_LAYOUT_ID_ALIAS, null);

    console.log(
      "TEARDOWN ENDING\nLAYOUT ID: ",
      Cypress.env(TEST_LAYOUT_ID_ALIAS),
      "\n"
    );
  });

  context("POST /layouts", () => {
    it("should return a 201 with the ID and definition of the created layout", async () => {
      cy.log("POST: ", Cypress.env(TEST_LAYOUT_ID_ALIAS));

      const response = await createLayout(TEST_LAYOUT_JSON, TEST_METADATA_DTO);
      const body: LayoutResponseDto = await response.json();

      expect(response.status).to.eq(201);
      expect(body.id).to.exist;
      expect(body.definition).to.contain(TEST_LAYOUT_JSON);
      expect(body.metadata).to.contain(TEST_METADATA_DTO);

      // Manual teardown
      deleteLayout(body.id).catch((error) => {
        console.log("ERROR IN TEARDOWN: ", error);
      });
    });
  });

  context("GET /layouts/:id", () => {
    it("should return a 200 with the definition of the layout", async () => {
      cy.log("GET: ", Cypress.env(TEST_LAYOUT_ID_ALIAS));

      const response = await getLayout(Cypress.env(TEST_LAYOUT_ID_ALIAS));
      const body: LayoutResponseDto = await response.json();

      expect(response.status).to.eq(200);
      expect(body.id).to.exist;
      expect(body.definition).to.contain(TEST_LAYOUT_JSON);
      expect(body.metadata).to.contain(TEST_METADATA_DTO);
    });
  });

  context("GET /layouts/metadata", () => {
    it("should return a 200", () => {
      cy.log("GET METADATA: ", Cypress.env(TEST_LAYOUT_ID_ALIAS));

      cy.request({
        method: "GET",
        url: LAYOUT_API_BASE_URL + "/layouts/metadata",
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.lengthOf(1);
        console.log(response.body);

        const { name, screenshot, user, group }: LayoutMetadataDto = response
          .body[0] as LayoutMetadata;

        expect(name).to.equal(TEST_METADATA_DTO.name);
        expect(screenshot).to.equal(TEST_METADATA_DTO.screenshot);
        expect(user).to.equal(TEST_METADATA_DTO.user);
        expect(group).to.equal(TEST_METADATA_DTO.group);
      });
    });
  });

  context("PUT /layouts/:id", () => {
    it("should return a 204 and the layout should be updated", () => {
      cy.log("PUT: ", Cypress.env(TEST_LAYOUT_ID_ALIAS));

      cy.request({
        method: "PUT",
        url:
          LAYOUT_API_BASE_URL + "/layouts/" + Cypress.env(TEST_LAYOUT_ID_ALIAS),
        body: {
          metadata: TEST_METADATA_DTO,
          definition: { ...TEST_LAYOUT_JSON, type: "Column" },
        },
      }).then((response) => {
        expect(response.status).to.eq(204);
        expect(response.body).to.not.exist;

        getLayout(Cypress.env(TEST_LAYOUT_ID_ALIAS)).then(async (response) => {
          const body: LayoutResponseDto = await response.json();
          expect(body.definition).to.have.property("type", "Column");
        });
      });
    });
  });

  context("DELETE /layouts/:id", () => {
    it("should return a 204 and layout should be deleted", () => {
      cy.log("DELETE: ", Cypress.env(TEST_LAYOUT_ID_ALIAS));

      cy.request({
        method: "DELETE",
        url:
          LAYOUT_API_BASE_URL + "/layouts/" + Cypress.env(TEST_LAYOUT_ID_ALIAS),
      }).then((response) => {
        expect(response.status).to.eq(204);
        expect(response.body).to.be.empty;

        getLayout(response.body.id).then(async (response) => {
          expect(response.status).to.eq(404);
        });
      });
    });
  });
});

// describe("Application Layouts", () => {
//   const testUser = "Test User";
//   const DEFAULT_APPLICATION_LAYOUT_ALIAS = "defaultApplicationLayout";
//
//   context("GET /application-layouts", () => {
//     it("should return a 200 with the default application layout and a null user", () => {
//       cy.request({
//         method: "GET",
//         url: "http://localhost:8081/api/application-layouts",
//         headers: {
//           username: testUser,
//         },
//       }).then((response) => {
//         expect(response.status).to.eq(200);
//         expect(response.body).to.have.property("username", null);
//         expect(response.body).to.have.property("definition");
//
//         Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS, response.body.definition);
//       });
//     });
//   });
//
//   context("PUT /application-layouts", () => {
//     it("should return a 201 and the user should have a saved application layout", () => {
//       cy.request({
//         method: "PUT",
//         url: "http://localhost:8081/api/application-layouts",
//         headers: {
//           username: testUser,
//         },
//         body: {
//           definition: Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS),
//         },
//       }).then((response) => {
//         expect(response.status).to.eq(201);
//         expect(response.body).to.not.exist;
//       });
//
//       // TODO Ths is essentially a duplication of the test for GET application layouts, not sure it should be here
//       cy.request({
//         method: "GET",
//         url: "http://localhost:8081/api/application-layouts",
//         headers: {
//           username: testUser,
//         },
//       }).then((response) => {
//         expect(response.status).to.eq(200);
//         expect(response.body).to.have.property("username", testUser);
//         expect(response.body).to.have.property("definition");
//         expect(response.body.definition.definition).to.equal(
//           Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS)
//         );
//       });
//     });
//   });
//
//   context("DELETE /application-layouts", () => {
//     it("should return a 204 and the user should not have an application layout", () => {
//       cy.request({
//         method: "DELETE",
//         url: "http://localhost:8081/api/application-layouts",
//         headers: {
//           username: testUser,
//         },
//       }).then((response) => {
//         expect(response.status).to.eq(204);
//         expect(response.body).to.be.empty;
//       });
//
//       // TODO Ths is essentially a duplication of the test for GET application layouts, not sure it should be here
//       cy.request({
//         method: "GET",
//         url: "http://localhost:8081/api/application-layouts",
//         headers: {
//           username: testUser,
//         },
//       }).then((response) => {
//         expect(response.status).to.eq(200);
//         expect(response.body).to.have.property("username", null);
//         expect(response.body).to.have.property("definition");
//         expect(response.body.definition).to.equal(
//           Cypress.env(DEFAULT_APPLICATION_LAYOUT_ALIAS)
//         );
//       });
//     });
//
//     // TODO in theory application layouts should be successful with or without settings, so test this theory with these two test cases
//   });
// });
