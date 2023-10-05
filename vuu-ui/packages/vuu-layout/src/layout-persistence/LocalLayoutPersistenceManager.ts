import { Layout, LayoutMetadata } from "@finos/vuu-shell";
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

  updateLayout(id: string, metadata: Omit<LayoutMetadata, "id">, newLayoutJson: LayoutJSON): Promise<void> {
    return new Promise((resolve, reject) => {
      this.validateIds(id)
        .then(() => Promise.all([this.loadLayouts(), this.loadMetadata()]))
        .then(([existingLayouts, existingMetadata]) => {
          const newLayouts = existingLayouts.filter(layout => layout.id !== id);
          const newMetadata = existingMetadata.filter(metadata => metadata.id !== id);
          this.appendAndPersist(id, metadata, newLayoutJson, newLayouts, newMetadata);
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
          const layouts = existingLayouts.filter((layout) => layout.id !== id);
          const metadata = existingMetadata.filter(metadata => metadata.id !== id);
          this.saveLayoutsWithMetadata(layouts, metadata);
          resolve();
        })
        .catch(e => reject(e));
    });
  }

  loadLayout(id: string): Promise<LayoutJSON> {
    return new Promise((resolve, reject) => {
      this.validateId(id, false)
        .then(() => this.loadLayouts())
        .then(existingLayouts => {
          const layouts = existingLayouts.filter(layout => layout.id === id);
          resolve(layouts[0].json);
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

  private async validateIds(id: string): Promise<void> {
    return Promise
      .all([
        this.validateId(id, true).catch(error => error.message),
        this.validateId(id, false).catch(error => error.message)
      ])
      .then((errorMessages: string[]) => {
        const combinedMessage = errorMessages.filter(Boolean).join("; ");
        if (combinedMessage) {
          throw new Error(combinedMessage);
        }
      });
  }

  private validateId(id: string, metadata: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const loadFunc = metadata ? this.loadMetadata : this.loadLayouts;
      loadFunc().then(result => {
        const count = result.filter(x => x.id === id).length;
        switch (count) {
          case 1: {
            resolve();
            break;
          };
          case 0: {
            reject(new Error(`No ${metadata ? "metadata" : "layout"} with ID ${id}`));
            break;
          }
          default: reject(new Error(`Non-unique ${metadata ? "metadata" : "layout"} with ID ${id}`));
        }
      });
    })
  }
}
