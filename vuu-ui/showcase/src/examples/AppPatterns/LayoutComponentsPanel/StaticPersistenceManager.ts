import { LayoutMetadata, PersistenceManager } from "@finos/vuu-shell";
import { LayoutJSON, ApplicationJSON } from "@finos/vuu-layout";

function unsupported<T = void>() {
  return new Promise<T>((_, reject) => {
    reject("not supported");
  });
}

export class StaticPersistenceManager implements PersistenceManager {
  #layoutMetaData: LayoutMetadata[];
  constructor(layoutMetadata: LayoutMetadata[]) {
    this.#layoutMetaData = layoutMetadata;
  }
  createLayout() {
    return unsupported<LayoutMetadata>();
  }
  updateLayout() {
    return unsupported();
  }
  deleteLayout() {
    return unsupported();
  }
  loadLayout(id: string) {
    console.log(`load layout #${id}`);
    return unsupported<LayoutJSON>();
  }
  loadMetadata() {
    return Promise.resolve(this.#layoutMetaData);
  }
  loadApplicationJSON() {
    return unsupported<ApplicationJSON>();
  }
  saveApplicationJSON() {
    return unsupported();
  }
}
