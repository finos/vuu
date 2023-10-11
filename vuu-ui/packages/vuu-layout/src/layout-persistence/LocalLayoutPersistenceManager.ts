import { Layout, LayoutMetadata } from "@finos/vuu-shell";
import { LayoutJSON, LayoutPersistenceManager } from "@finos/vuu-layout";

import { getLocalEntity, saveLocalEntity } from "@finos/vuu-filters";
import { getUniqueId } from "@finos/vuu-utils";

const metadataSaveLocation = "layouts/metadata";
const layoutsSaveLocation = "layouts/layouts";

export class LocalLayoutPersistenceManager implements LayoutPersistenceManager {
  createLayout(metadata: Omit<LayoutMetadata, "id">, layout: LayoutJSON): string {
    console.log(`Saving layout as ${metadata.name} to group ${metadata.group}...`);

    const existingLayouts = this.loadLayouts();
    const existingMetadata = this.loadMetadata();

    const id = getUniqueId();

    this.appendAndPersist(id, metadata, layout, existingLayouts, existingMetadata);

    return id;
  }

  updateLayout(id: string, metadata: Omit<LayoutMetadata, "id">, newLayoutJson: LayoutJSON): void {
    const existingLayouts = this.loadLayouts().filter(layout => layout.id !== id);
    const existingMetadata = this.loadMetadata().filter(metadata => metadata.id !== id);

    this.appendAndPersist(id, metadata, newLayoutJson, existingLayouts, existingMetadata);
  }

  deleteLayout(id: string): void {
    const layouts = this.loadLayouts().filter(layout => layout.id !== id);
    const metadata = this.loadMetadata().filter(metadata => metadata.id !== id);

    this.saveLayoutsWithMetadata(layouts, metadata);
  }

  loadLayout(id: string): LayoutJSON {
    const layout = this.loadLayouts().filter(layout => layout.id === id);

    switch (layout.length) {
      case 1: {
        return layout[0].json;
      }
      case 0: {
        console.log(`WARNING: no layout exists for ID "${id}"; returning empty layout`);
        return {} as LayoutJSON;
      }
      default: {
        console.log(`WARNING: multiple layouts exist for ID "${id}"; returning first instance`)
        return layout[0].json;
      }
    }
  }

  loadMetadata(): LayoutMetadata[] {
    return getLocalEntity<LayoutMetadata[]>(metadataSaveLocation) || [];
  }

  private loadLayouts(): Layout[] {
    return getLocalEntity<Layout[]>(layoutsSaveLocation) || [];
  }

  private appendAndPersist(newId: string,
                           newMetadata: Omit<LayoutMetadata, "id">,
                           newLayout: LayoutJSON,
                           existingLayouts: Layout[],
                           existingMetadata: LayoutMetadata[]) {
    existingLayouts.push({id: newId, json: newLayout});
    existingMetadata.push({id: newId, ...newMetadata});

    this.saveLayoutsWithMetadata(existingLayouts, existingMetadata);
  }

  private saveLayoutsWithMetadata(layouts: Layout[], metadata: LayoutMetadata[]): void {
    saveLocalEntity<Layout[]>(layoutsSaveLocation, layouts);
    saveLocalEntity<LayoutMetadata[]>(metadataSaveLocation, metadata);
  }
}
