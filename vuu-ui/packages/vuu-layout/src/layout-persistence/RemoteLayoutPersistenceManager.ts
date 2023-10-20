import { LayoutMetadata } from "@finos/vuu-shell";
import { LayoutPersistenceManager } from "./LayoutPersistenceManager";
import { LayoutJSON } from "../layout-reducer";
import { defaultLayout } from "./data";

const baseURL = "http://127.0.0.1:8081/api";
const metadataSaveLocation = "layouts/metadata";
const layoutsSaveLocation = "layouts";

export class RemoteLayoutPersistenceManager
  implements LayoutPersistenceManager
{
  createLayout(
    metadata: Omit<LayoutMetadata, "id" | "created">,
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
          definition: layout,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            reject(new Error(response.statusText));
          }
          response.json().then(({ metadata }: { metadata: LayoutMetadata }) => {
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
    metadata: Omit<LayoutMetadata, "id">,
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
      fetch(`${baseURL}/${layoutsSaveLocation}/${id}`, {})
        .then((response) => {
          if (!response.ok) {
            reject(new Error(response.statusText));
          }
          response.json().then((layout) => {
            if (!layout) {
              reject(new Error("Response did not contain a valid layout"));
            }
            resolve(layout);
          });
        })
        .catch((error: Error) => {
          reject(error);
        });
    });
  }

  loadMetadata(): Promise<LayoutMetadata[]> {
    return new Promise((resolve, reject) =>
      fetch(`${baseURL}/${metadataSaveLocation}`, {})
        .then(async (response) => {
          if (!response.ok) {
            reject(new Error(response.statusText));
          }
          response.json().then((metadata: LayoutMetadata[]) => {
            if (!metadata) {
              reject(new Error("invalid metadata"));
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
    // TODO POST api/layouts/application #71
    console.log(layout);
    return new Promise((resolve) => resolve());
  }

  loadApplicationLayout(): Promise<LayoutJSON> {
    // TODO GET api/layouts/application #71
    return new Promise((resolve) => resolve(defaultLayout));
  }
}
