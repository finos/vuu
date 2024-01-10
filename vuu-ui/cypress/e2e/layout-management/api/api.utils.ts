import { ApplicationJSON, LayoutJSON } from "@finos/vuu-layout";
import { LayoutMetadata, LayoutMetadataDto } from "@finos/vuu-shell";

export type LayoutResponseDto = {
  id: string;
  definition: LayoutJSON;
  metadata: LayoutMetadata;
};

const LAYOUT_API_BASE_URL = "http://localhost:8081/api";

export const APPLICATION_LAYOUT_URL =
  LAYOUT_API_BASE_URL + "/application-layouts/";
export const USER_LAYOUT_URL =
  LAYOUT_API_BASE_URL + "/layouts/";

export const TEST_LAYOUT_ID_ALIAS = "TEST_LAYOUT_ID";
export const DEFAULT_APPLICATION_LAYOUT_ALIAS = "DEFAULT_APPLICATION_LAYOUT";
export const DEFAULT_APPLICATION_SETTINGS_ALIAS = "DEFAULT_APPLICATION_SETTINGS";

export const TEST_LAYOUT_JSON: LayoutJSON = {
  type: "Row",
};

export const TEST_METADATA_DTO: LayoutMetadataDto = {
  name: "Test Layout",
  group: "Test Group",
  screenshot: "Test Screenshot",
  user: "Test User",
};

export const getLayout = (id: string): Cypress.Chainable => {
  return cy
    .request({
      method: "GET",
      url: USER_LAYOUT_URL + id,
      failOnStatusCode: false,
    })
    .then((response) => {
      return response;
    });
};

export const createLayout = (
  definition: LayoutJSON,
  metadata: LayoutMetadataDto
): Cypress.Chainable => {
  return cy
    .request({
      method: "POST",
      url: USER_LAYOUT_URL,
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        metadata,
        definition,
      },
    })
    .then((response) => {
      return response;
    });
};

export const deleteLayout = (id: string): Cypress.Chainable => {
  return cy
    .request({
      method: "DELETE",
      url: USER_LAYOUT_URL + id,
      failOnStatusCode: false,
    })
    .then((response) => {
      return response;
    });
};

export const getApplicationLayout = (username: string): Cypress.Chainable => {
  return cy
    .request({
      method: "GET",
      url: APPLICATION_LAYOUT_URL,
      headers: { username },
    })
    .then((response) => {
      return response;
    });
};

export const deleteApplicationLayout = (
  username: string
): Cypress.Chainable => {
  return cy
    .request({
      method: "DELETE",
      url: APPLICATION_LAYOUT_URL,
      headers: {
        username,
      },
    })
    .then((response) => {
      return response;
    });
};

export const persistApplicationLayout = (
  username: string,
  applicationLayout: ApplicationJSON
): Cypress.Chainable => {
  return cy.request({
    method: "PUT",
    url: APPLICATION_LAYOUT_URL,
    headers: {
      "Content-Type": "application/json",
      username,
    },
    body: JSON.stringify(applicationLayout),
  });
};
