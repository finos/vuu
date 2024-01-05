/// <reference types="cypress" />

import { LayoutMetadata, LayoutMetadataDto } from "@finos/vuu-shell";
import {
  createLayout,
  deleteLayout,
  getLayout,
  LAYOUT_API_BASE_URL,
  TEST_LAYOUT_ID_ALIAS,
  TEST_LAYOUT_JSON,
  TEST_METADATA_DTO,
} from "./api.utils";

describe("User Layouts", () => {
  beforeEach(() => {
    createLayout(TEST_LAYOUT_JSON, TEST_METADATA_DTO).then((response) => {
      Cypress.env(TEST_LAYOUT_ID_ALIAS, response.body.id);
    });
  });

  afterEach(() => {
    deleteLayout(Cypress.env(TEST_LAYOUT_ID_ALIAS));

    Cypress.env(TEST_LAYOUT_ID_ALIAS, null);
  });

  context("POST /layouts", () => {
    it("should return a 201 with the ID and definition of the created layout", () => {
      createLayout(TEST_LAYOUT_JSON, TEST_METADATA_DTO)
        .then((response) => {
          expect(response.status).to.eq(201);
          expect(response.body.id).to.exist;
          expect(response.body.definition).to.contain(TEST_LAYOUT_JSON);
          expect(response.body.metadata).to.contain(TEST_METADATA_DTO);

          return response;
        })
        .then((response) => {
          deleteLayout(response.body.id);
        });
    });
  });

  context("GET /layouts/:id", () => {
    it("should return a 200 with the definition of the layout", () => {
      getLayout(Cypress.env(TEST_LAYOUT_ID_ALIAS)).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.id).to.exist;
        expect(response.body.definition).to.contain(TEST_LAYOUT_JSON);
        expect(response.body.metadata).to.contain(TEST_METADATA_DTO);
      });
    });
  });

  context("GET /layouts/metadata", () => {
    it("should return a 200", () => {
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
      cy.request({
        method: "PUT",
        url:
          LAYOUT_API_BASE_URL + "/layouts/" + Cypress.env(TEST_LAYOUT_ID_ALIAS),
        body: {
          metadata: TEST_METADATA_DTO,
          definition: { ...TEST_LAYOUT_JSON, type: "Column" },
        },
      })
        .then((response) => {
          expect(response.status).to.eq(204);
          expect(response.body).to.not.exist;
        })
        .then(() => {
          getLayout(Cypress.env(TEST_LAYOUT_ID_ALIAS)).then((response) => {
            expect(response.body.definition).to.have.property("type", "Column");
          });
        });
    });
  });

  // TODO This test is failing
  //  - it fails because the afterEach is attempting to delete what this test has deleted, resulting in 404
  //  - and because we're expecting a 404 on the get, but it's counting a 404 as a test fail
  context("DELETE /layouts/:id", () => {
    it("should return a 204 and layout should be deleted", () => {
      cy.request({
        method: "DELETE",
        url:
          LAYOUT_API_BASE_URL + "/layouts/" + Cypress.env(TEST_LAYOUT_ID_ALIAS),
      })
        .then((response) => {
          expect(response.status).to.eq(204);
          expect(response.body).to.be.empty;
        })
        .then(() => {
          getLayout(Cypress.env(TEST_LAYOUT_ID_ALIAS)).then((response) => {
            expect(response.status).to.eq(404);
          });
        });
    });
  });
});