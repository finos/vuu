import { LayoutJSON } from "@finos/vuu-layout";
import { LayoutMetadata, LayoutMetadataDto } from "@finos/vuu-shell";

export type LayoutResponseDto = {
  id: string;
  definition: LayoutJSON;
  metadata: LayoutMetadata;
};

export const LAYOUT_API_BASE_URL = "http://localhost:8081/api";

export const TEST_LAYOUT_ID_ALIAS = "TEST_LAYOUT_ID";
export const DEFAULT_APPLICATION_LAYOUT_ALIAS = "DEFAULT_APPLICATION_LAYOUT";

export const TEST_LAYOUT_JSON: LayoutJSON = {
  type: "Row",
};

export const TEST_METADATA_DTO: LayoutMetadataDto = {
  name: "Test Layout",
  group: "Test Group",
  screenshot: "Test Screenshot",
  user: "Test User",
};

export const getLayout = async (id: string): Promise<Response> => {
  const url = LAYOUT_API_BASE_URL + "/layouts/" + id;
  const options = {
    method: "GET",
  };

  return new Promise((resolve, reject) => {
    fetch(url, options).then((response) => {
      if (response.status !== 200) reject(response);
      resolve(response);
    });
  });
};

export const createLayout = async (
  definition: LayoutJSON,
  metadata: LayoutMetadataDto
): Promise<Response> => {
  const url = LAYOUT_API_BASE_URL + "/layouts";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      metadata,
      definition,
    }),
  };

  return new Promise((resolve, reject) => {
    fetch(url, options).then((response) => {
      if (response.status !== 201) reject(response);
      resolve(response);
    });
  });
};

export const deleteLayout = async (id: string): Promise<Response> => {
  const url = LAYOUT_API_BASE_URL + "/layouts/" + id;
  const options = {
    method: "DELETE",
  };

  return new Promise((resolve, reject) => {
    fetch(url, options).then((response) => {
      if (response.status !== 204) reject(response);
      resolve(response);
    });
  });
};

export const getApplicationLayout = async (
  username: string
): Promise<Response> => {
  const url = LAYOUT_API_BASE_URL + "/application-layouts";

  const options = {
    method: "GET",
    headers: {
      username,
    },
  };

  return new Promise((resolve, reject) => {
    fetch(url, options).then((response) => {
      if (response.status !== 200) reject(response);
      resolve(response);
    });
  });
};
