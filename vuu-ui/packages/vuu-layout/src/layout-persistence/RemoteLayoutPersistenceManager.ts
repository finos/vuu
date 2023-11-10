import {
  ApplicationLayout,
  LayoutMetadata,
  LayoutMetadataDto
} from "@finos/vuu-shell";
import { LayoutPersistenceManager } from "./LayoutPersistenceManager";
import { LayoutJSON } from "../layout-reducer";

const DEFAULT_SERVER_BASE_URL = "http://127.0.0.1:8081/api";

const baseURL = process.env.LAYOUT_BASE_URL ?? DEFAULT_SERVER_BASE_URL;
const metadataSaveLocation = "layouts/metadata";
const layoutsSaveLocation = "layouts";
const applicationLayoutsSaveLocation = "application-layouts";

export type CreateLayoutResponseDto = { metadata: LayoutMetadata };
export type GetLayoutResponseDto = { definition: LayoutJSON };

export class RemoteLayoutPersistenceManager
  implements LayoutPersistenceManager
{
  createLayout(
    metadata: LayoutMetadataDto,
    layout: LayoutJSON
  ): Promise<LayoutMetadata> {
    return new Promise((resolve, reject) =>
      fetch(`${baseURL}/${layoutsSaveLocation}`, {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          metadata,
          definition: JSON.stringify(layout),
        }),
      })
        .then((response) => {
          if (!response.ok) {
            reject(new Error(response.statusText));
          }
          response.json().then(({ metadata }: CreateLayoutResponseDto) => {
            if (!metadata) {
              reject(new Error("Response did not contain valid metadata"));
            }
            resolve(metadata);
          });
        })
        .catch((error: Error) => {
          reject(error);
        })
    );
  }

  updateLayout(
    id: string,
    metadata: LayoutMetadataDto,
    newLayoutJson: LayoutJSON
  ): Promise<void> {
    return new Promise((resolve, reject) =>
      fetch(`${baseURL}/${layoutsSaveLocation}/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          metadata,
          layout: newLayoutJson,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            reject(new Error(response.statusText));
          }
          resolve();
        })
        .catch((error: Error) => {
          reject(error);
        })
    );
  }

  deleteLayout(id: string): Promise<void> {
    return new Promise((resolve, reject) =>
      fetch(`${baseURL}/${layoutsSaveLocation}/${id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) {
            reject(new Error(response.statusText));
          }
          resolve();
        })
        .catch((error: Error) => {
          reject(error);
        })
    );
  }

  loadLayout(id: string): Promise<LayoutJSON> {
    return new Promise((resolve, reject) => {
      fetch(`${baseURL}/${layoutsSaveLocation}/${id}`, {
        method: "GET",
      })
        .then((response) => {
          if (!response.ok) {
            reject(new Error(response.statusText));
          }
          response.json().then(({ definition }: GetLayoutResponseDto) => {
            if (!definition) {
              reject(new Error("Response did not contain a valid layout"));
            }
            resolve(definition);
          });
        })
        .catch((error: Error) => {
          reject(error);
        });
    });
  }

  loadMetadata(): Promise<LayoutMetadata[]> {
    return new Promise((resolve, reject) =>
      fetch(`${baseURL}/${metadataSaveLocation}`, {
        method: "GET",
      })
        .then((response) => {
          if (!response.ok) {
            reject(new Error(response.statusText));
          }
          response.json().then((metadata: LayoutMetadata[]) => {
            if (!metadata) {
              reject(new Error("Response did not contain valid metadata"));
            }
            resolve(metadata);
          });
        })
        .catch((error: Error) => {
          reject(error);
        })
    );
  }

  saveApplicationLayout(layout: LayoutJSON): Promise<void> {
    return new Promise((resolve, reject) =>
      fetch(`${baseURL}/${applicationLayoutsSaveLocation}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "username": "vuu-user"
        },
        body: JSON.stringify(layout),
      })
      .then((response) => {
        if (!response.ok) {
          reject(new Error(response.statusText));
        }
        resolve();
      })
      .catch((error: Error) => {
        reject(error);
      })
    );
  }

  loadApplicationLayout(): Promise<LayoutJSON> {
    return new Promise((resolve, reject) =>
      fetch(`${baseURL}/${applicationLayoutsSaveLocation}`, {
        method: "GET",
        headers: {
          "username": "vuu-user",
        },
      })
      .then((response) => {
        if (!response.ok) {
          reject(new Error(response.statusText));
        }
        response.json().then((applicationLayout: ApplicationLayout) => {
          if (!applicationLayout) {
            reject(new Error("Response did not contain valid application layout information"));
          }
          resolve(applicationLayout.definition);
        });
      })
      .catch((error: Error) => {
        reject(error);
      })
    );
  }
}
