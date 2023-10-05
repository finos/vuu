import { Layout, LayoutMetadata } from "@finos/vuu-shell";
import { LayoutJSON, LayoutPersistenceManager } from "@finos/vuu-layout";
import { getLocalEntity, saveLocalEntity } from "@finos/vuu-filters";
import { getUniqueId } from "@finos/vuu-utils";

import { defaultLayout, warningLayout } from "./data";

const metadataSaveLocation = "layouts/metadata";
const layoutsSaveLocation = "layouts/layouts";

export class LocalLayoutPersistenceManager implements LayoutPersistenceManager {
  createLayout(
    metadata: Omit<LayoutMetadata, "id">,
    layout: LayoutJSON
  ): Promise<string> {
    return new Promise(async (resolve) => {
      console.log(
        `Saving layout as ${metadata.name} to group ${metadata.group}...`
      );

      const existingLayouts = this.loadLayouts();
      const existingMetadata = await this.loadMetadata();

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
  }

  updateLayout(
    id: string,
    metadata: Omit<LayoutMetadata, "id">,
    newLayoutJson: LayoutJSON
  ): Promise<void> {
    return new Promise(async (resolve) => {
      const existingLayouts = this.loadLayouts().filter(
        (layout) => layout.id !== id
      );
      const existingMetadata = (await this.loadMetadata()).filter(
        (metadata) => metadata.id !== id
      );
      this.appendAndPersist(
        id,
        metadata,
        newLayoutJson,
        existingLayouts,
        existingMetadata
      );
      resolve();
    });
  }

  deleteLayout(id: string): Promise<void> {
    return new Promise(async (resolve) => {
      const layouts = this.loadLayouts().filter((layout) => layout.id !== id);
      const metadata = (await this.loadMetadata()).filter(
        (metadata) => metadata.id !== id
      );
      this.saveLayoutsWithMetadata(layouts, metadata);
      resolve();
    });
  }

  loadLayout(id: string): Promise<LayoutJSON> {
    return new Promise((resolve) => {
      const layout = this.loadLayouts().filter((layout) => layout.id === id);

      switch (layout.length) {
        case 1: {
          resolve(layout[0].json);
          break;
        }
        case 0: {
          console.log(
            `WARNING: no layout exists for ID "${id}"; returning empty layout`
          );
          resolve(warningLayout);
          break;
        }
        default: {
          console.log(
            `WARNING: multiple layouts exist for ID "${id}"; returning first instance`
          );
          resolve(layout[0].json);
          break;
        }
      }
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
      const currentLayout = getLocalEntity<LayoutJSON>("api/vui");
      if (currentLayout) {
        resolve(currentLayout);
      } else {
        resolve(defaultLayout);
      }
    });
  }

  saveApplicationLayout(layout: LayoutJSON): Promise<void> {
    return new Promise((resolve, reject) => {
      const savedLayout = saveLocalEntity<LayoutJSON>("api/vui", layout);
      if (savedLayout) {
        resolve();
      } else {
        reject(new Error("Layout failed to save"));
      }
    });
  }

  private loadLayouts(): Layout[] {
    return getLocalEntity<Layout[]>(layoutsSaveLocation) || [];
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
}
