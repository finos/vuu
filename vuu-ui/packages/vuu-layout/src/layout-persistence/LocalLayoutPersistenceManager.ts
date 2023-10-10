import { Layout, LayoutMetadata, WithId } from "@finos/vuu-shell";
import { LayoutJSON, LayoutPersistenceManager } from "@finos/vuu-layout";

import { getLocalEntity, saveLocalEntity } from "@finos/vuu-filters";
import { getUniqueId } from "@finos/vuu-utils";

const metadataSaveLocation = "layouts/metadata";
const layoutsSaveLocation = "layouts/layouts";

export class LocalLayoutPersistenceManager implements LayoutPersistenceManager {
  createLayout(metadata: Omit<LayoutMetadata, "id">, layout: LayoutJSON): Promise<string> {
    return new Promise(resolve => {
      console.log(`Saving layout as ${metadata.name} to group ${metadata.group}...`);

      Promise.all([this.loadLayouts(), this.loadMetadata()])
        .then(([existingLayouts, existingMetadata]) => {
          const id = getUniqueId();
          this.appendAndPersist(
            id,
            metadata,
            layout,
            existingLayouts,
            existingMetadata
          );
          resolve(id);
        });
    })
  }

  updateLayout(
    id: string,
    newMetadata: Omit<LayoutMetadata, "id">,
    newLayout: LayoutJSON
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.validateIds(id)
        .then(() => Promise.all([this.loadLayouts(), this.loadMetadata()]))
        .then(([existingLayouts, existingMetadata]) => {
          const layouts = this.removeEntry(existingLayouts, id);
          const metadata = this.removeEntry(existingMetadata, id);
          this.appendAndPersist(id, newMetadata, newLayout, layouts, metadata);
          resolve();
        })
        .catch(e => reject(e));
    });
  }

  deleteLayout(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.validateIds(id)
        .then(() => Promise.all([this.loadLayouts(), this.loadMetadata()]))
        .then(([existingLayouts, existingMetadata]) => {
          const layouts = this.removeEntry(existingLayouts, id);
          const metadata = this.removeEntry(existingMetadata, id);
          this.saveLayoutsWithMetadata(layouts, metadata);
          resolve();
        })
        .catch(e => reject(e));
    });
  }

  loadLayout(id: string): Promise<LayoutJSON> {
    return new Promise((resolve, reject) => {
      this.validateId(id, "layout")
        .then(() => this.loadLayouts())
        .then(existingLayouts => {
          const layouts = existingLayouts.find(layout => layout.id === id) as Layout;
          resolve(layouts.json);
        })
        .catch(e => reject(e));
    });
  }

  loadMetadata(): Promise<LayoutMetadata[]> {
    return new Promise(resolve => {
      const metadata = getLocalEntity<LayoutMetadata[]>(metadataSaveLocation);
      resolve(metadata || []);
    })
  }

  private loadLayouts(): Promise<Layout[]> {
    return new Promise(resolve => {
      const layouts = getLocalEntity<Layout[]>(layoutsSaveLocation);
      resolve(layouts || []);
    });
  }

  // Takes an array of Layouts or Metadata and returns a new array with one
  // element (corresponding to the provided ID) removed. Should be used in
  // conjunction with validateId(s) to ensure exactly one element is removed.
  private removeEntry<T extends WithId>(array: T[], idToRemove: string): T[] {
    return array.filter(element => element.id !== idToRemove);
  }

  private appendAndPersist(
    newId: string,
    newMetadata: Omit<LayoutMetadata, "id">,
    newLayout: LayoutJSON,
    existingLayouts: Layout[],
    existingMetadata: LayoutMetadata[]
  ) {
    existingLayouts.push({ id: newId, json: newLayout });
    existingMetadata.push({ id: newId, ...newMetadata });

    this.saveLayoutsWithMetadata(existingLayouts, existingMetadata);
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
    return Promise
      .all([
        this.validateId(id, "metadata").catch(error => error.message),
        this.validateId(id, "layout").catch(error => error.message)
      ])
      .then((errorMessages: string[]) => {
        // filter(Boolean) is used to remove any blank messages before joining.
        // Avoids orphaned delimiters in combined messages, e.g. "; " or "; error 2"
        const combinedMessage = errorMessages.filter(Boolean).join("; ");
        if (combinedMessage) {
          throw new Error(combinedMessage);
        }
      });
  }

  // Ensures that there is exactly one element (Layout or Metadata) in local
  // storage corresponding to the provided ID.
  private validateId(id: string, dataType: "metadata" | "layout"): Promise<void> {
    return new Promise((resolve, reject) => {
      const loadFunc = dataType === "metadata" ? this.loadMetadata : this.loadLayouts;

      loadFunc().then((array: WithId[]) => {
        const count = array.filter(element => element.id === id).length;
        switch (count) {
          case 1: {
            resolve();
            break;
          }
          case 0: {
            reject(new Error(`No ${dataType} with ID ${id}`));
            break;
          }
          default: reject(new Error(`Non-unique ${dataType} with ID ${id}`));
        }
      });
    })
  }
}
