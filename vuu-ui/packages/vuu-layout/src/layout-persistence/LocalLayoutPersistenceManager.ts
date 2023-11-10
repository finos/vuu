import {
  Layout,
  LayoutMetadata,
  LayoutMetadataDto,
  WithId,
} from "@finos/vuu-shell";
import { LayoutJSON, LayoutPersistenceManager } from "@finos/vuu-layout";
import { getLocalEntity, saveLocalEntity } from "@finos/vuu-filters";
import { formatDate, getUniqueId } from "@finos/vuu-utils";

import { defaultLayout } from "./data";

const metadataSaveLocation = "layouts/metadata";
const layoutsSaveLocation = "layouts/layouts";

export class LocalLayoutPersistenceManager implements LayoutPersistenceManager {
  #urlKey = "api/vui";
  constructor(urlKey?: string) {
    if (urlKey) {
      this.#urlKey = urlKey;
    }
  }
  createLayout(
    metadata: LayoutMetadataDto,
    layout: LayoutJSON
  ): Promise<LayoutMetadata> {
    return new Promise((resolve) => {
      console.log(
        `Saving layout as ${metadata.name} to group ${metadata.group}...`
      );

      Promise.all([this.loadLayouts(), this.loadMetadata()]).then(
        ([existingLayouts, existingMetadata]) => {
          const id = getUniqueId();
          const newMetadata: LayoutMetadata = {
            ...metadata,
            id,
            created: formatDate(new Date(), "dd.mm.yyyy"),
          };

          this.saveLayoutsWithMetadata(
            [...existingLayouts, { id, json: layout }],
            [...existingMetadata, newMetadata]
          );
          resolve(newMetadata);
        }
      );
    });
  }

  updateLayout(
    id: string,
    newMetadata: LayoutMetadataDto,
    newLayout: LayoutJSON
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.validateIds(id)
        .then(() => Promise.all([this.loadLayouts(), this.loadMetadata()]))
        .then(([existingLayouts, existingMetadata]) => {
          const updatedLayouts = existingLayouts.map((layout) =>
            layout.id === id ? { ...layout, json: newLayout } : layout
          );
          const updatedMetadata = existingMetadata.map((metadata) =>
            metadata.id === id ? { ...metadata, ...newMetadata } : metadata
          );
          this.saveLayoutsWithMetadata(updatedLayouts, updatedMetadata);
          resolve();
        })
        .catch((e) => reject(e));
    });
  }

  deleteLayout(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.validateIds(id)
        .then(() => Promise.all([this.loadLayouts(), this.loadMetadata()]))
        .then(([existingLayouts, existingMetadata]) => {
          const layouts = existingLayouts.filter((layout) => layout.id !== id);
          const metadata = existingMetadata.filter(
            (metadata) => metadata.id !== id
          );
          this.saveLayoutsWithMetadata(layouts, metadata);
          resolve();
        })
        .catch((e) => reject(e));
    });
  }

  loadLayout(id: string): Promise<LayoutJSON> {
    return new Promise((resolve, reject) => {
      this.validateId(id, "layout")
        .then(() => this.loadLayouts())
        .then((existingLayouts) => {
          const foundLayout = existingLayouts.find(
            (layout) => layout.id === id
          );
          if (foundLayout) {
            resolve(foundLayout.json);
          } else {
            reject(new Error(`no layout found matching id ${id}`));
          }
        })
        .catch((e) => reject(e));
    });
  }

  loadMetadata(): Promise<LayoutMetadata[]> {
    return new Promise((resolve) => {
      const metadata = getLocalEntity<LayoutMetadata[]>(metadataSaveLocation);
      resolve(metadata || []);
    });
  }

  loadApplicationLayout(): Promise<LayoutJSON> {
    return new Promise((resolve) => {
      const applicationLayout = getLocalEntity<LayoutJSON>(this.#urlKey);
      if (applicationLayout) {
        resolve(applicationLayout);
      } else {
        resolve(defaultLayout);
      }
    });
  }

  saveApplicationLayout(layout: LayoutJSON): Promise<void> {
    return new Promise((resolve, reject) => {
      const savedLayout = saveLocalEntity<LayoutJSON>(this.#urlKey, layout);
      if (savedLayout) {
        resolve();
      } else {
        reject(new Error("Layout failed to save"));
      }
    });
  }

  private loadLayouts(): Promise<Layout[]> {
    return new Promise((resolve) => {
      const layouts = getLocalEntity<Layout[]>(layoutsSaveLocation);
      resolve(layouts || []);
    });
  }

  private saveLayoutsWithMetadata(
    layouts: Layout[],
    metadata: LayoutMetadata[]
  ): void {
    saveLocalEntity<Layout[]>(layoutsSaveLocation, layouts);
    saveLocalEntity<LayoutMetadata[]>(metadataSaveLocation, metadata);
  }

  // Ensures that there is exactly one Layout entry and exactly one Metadata
  // entry in local storage corresponding to the provided ID.
  private async validateIds(id: string): Promise<void> {
    return Promise.all([
      this.validateId(id, "metadata").catch((error) => error.message),
      this.validateId(id, "layout").catch((error) => error.message),
    ]).then((errorMessages: string[]) => {
      // filter() is used to remove any blank messages before joining.
      // Avoids orphaned delimiters in combined messages, e.g. "; " or "; error 2"
      const combinedMessage = errorMessages
        .filter((msg) => msg !== undefined)
        .join("; ");
      if (combinedMessage) {
        throw new Error(combinedMessage);
      }
    });
  }

  // Ensures that there is exactly one element (Layout or Metadata) in local
  // storage corresponding to the provided ID.
  private validateId(
    id: string,
    dataType: "metadata" | "layout"
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const loadFunc =
        dataType === "metadata" ? this.loadMetadata : this.loadLayouts;

      loadFunc().then((array: WithId[]) => {
        const count = array.filter((element) => element.id === id).length;
        switch (count) {
          case 1: {
            resolve();
            break;
          }
          case 0: {
            reject(new Error(`No ${dataType} with ID ${id}`));
            break;
          }
          default:
            reject(new Error(`Non-unique ${dataType} with ID ${id}`));
        }
      });
    });
  }
}
