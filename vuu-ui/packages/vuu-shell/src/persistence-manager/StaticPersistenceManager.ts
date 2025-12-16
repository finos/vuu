import {
  ApplicationJSON,
  LayoutJSON,
  LayoutMetadata,
  Settings,
} from "@vuu-ui/vuu-utils";
import { IPersistenceManager } from "./PersistenceManager";

function unsupported<T = void>() {
  return new Promise<T>((_, reject) => {
    reject("not supported");
  });
}

/**
 * Use in Showcase examples only
 */
export class StaticPersistenceManager implements IPersistenceManager {
  #applicationLoadDelay: number;
  #applicationJSON?: ApplicationJSON;
  #layoutMetaData: LayoutMetadata[];
  constructor({
    applicationJSON,
    applicationLoadDelay = 0,
    layoutMetadata = [],
  }: {
    applicationJSON?: ApplicationJSON;
    applicationLoadDelay?: number;
    layoutMetadata?: LayoutMetadata[];
  }) {
    this.#applicationJSON = applicationJSON;
    this.#applicationLoadDelay = applicationLoadDelay;
    this.#layoutMetaData = layoutMetadata;
  }
  createLayout() {
    return unsupported<LayoutMetadata>();
  }

  clearUserSettings() {
    // TODO
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
    return new Promise<ApplicationJSON | undefined>((resolve) => {
      setTimeout(() => {
        resolve(this.#applicationJSON);
      }, this.#applicationLoadDelay);
    });
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
