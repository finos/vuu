import { ApplicationJSON, LayoutJSON, Settings } from "@finos/vuu-utils";
import { LayoutMetadata } from "../layout-management";
import { IPersistenceManager } from "./PersistenceManager";

function unsupported<T = void>() {
  return new Promise<T>((_, reject) => {
    reject("not supported");
  });
}

export class StaticPersistenceManager implements IPersistenceManager {
  #applicationJSON?: Partial<ApplicationJSON>;
  #layoutMetaData: LayoutMetadata[];
  constructor({
    applicationJSON,
    layoutMetadata = [],
  }: {
    applicationJSON?: Partial<ApplicationJSON>;
    layoutMetadata?: LayoutMetadata[];
  }) {
    this.#layoutMetaData = layoutMetadata;
    this.#applicationJSON = applicationJSON;
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
  async saveApplicationJSON(applicationJson: ApplicationJSON) {
    console.log(`save application json `, {
      applicationJson,
    });
  }

  async getUserSettings() {
    return this.#applicationJSON?.userSettings ?? {};
  }

  saveUserSettings(userSettings: Settings) {
    console.log("saveUserSettings not implemented", {
      userSettings,
    });
  }
}
