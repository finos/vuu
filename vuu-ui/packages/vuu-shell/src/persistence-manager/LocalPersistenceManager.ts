import {
  ApplicationJSON,
  LayoutJSON,
  Settings,
  formatDate,
  getLocalEntity,
  getUniqueId,
  saveLocalEntity,
  Layout,
  LayoutMetadata,
  LayoutMetadataDto,
  WithId,
  clearLocalEntity,
} from "@vuu-ui/vuu-utils";
import { IPersistenceManager } from "./PersistenceManager";
const baseMetadataSaveLocation = "layouts/metadata";
const baseLayoutsSaveLocation = "layouts/layouts";

export class LocalPersistenceManager implements IPersistenceManager {
  #applicationJSON: ApplicationJSON | undefined;
  #metadataSaveLocation: string;
  #layoutsSaveLocation: string;
  #urlKey: string;

  constructor(userName: string, urlKey?: string) {
    this.#metadataSaveLocation = `${baseMetadataSaveLocation}/${userName}`;
    this.#layoutsSaveLocation = `${baseLayoutsSaveLocation}/${userName}`;
    this.#urlKey = urlKey ?? `api/vui/${userName}`;
  }

  clearUserSettings() {
    clearLocalEntity(this.#urlKey);
    this.#applicationJSON = undefined;
  }

  createLayout(
    metadata: LayoutMetadataDto,
    layout: LayoutJSON,
  ): Promise<LayoutMetadata> {
    return new Promise((resolve) => {
      Promise.all([this.loadLayouts(), this.loadMetadata()]).then(
        ([existingLayouts, existingMetadata]) => {
          const id = getUniqueId();
          const newMetadata: LayoutMetadata = {
            ...metadata,
            id,
            created: formatDate({ date: "dd.mm.yyyy" })(new Date()),
          };

          this.saveLayoutsWithMetadata(
            [...existingLayouts, { id, json: layout }],
            [...existingMetadata, newMetadata],
          );
          resolve(newMetadata);
        },
      );
    });
  }

  updateLayout(
    id: string,
    newMetadata: LayoutMetadataDto,
    newLayout: LayoutJSON,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.validateIds(id)
        .then(() => Promise.all([this.loadLayouts(), this.loadMetadata()]))
        .then(([existingLayouts, existingMetadata]) => {
          const updatedLayouts = existingLayouts.map((layout) =>
            layout.id === id ? { ...layout, json: newLayout } : layout,
          );
          const updatedMetadata = existingMetadata.map((metadata) =>
            metadata.id === id ? { ...metadata, ...newMetadata } : metadata,
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
            (metadata) => metadata.id !== id,
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
            (layout) => layout.id === id,
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
      const metadata = getLocalEntity<LayoutMetadata[]>(
        this.#metadataSaveLocation,
      );
      resolve(metadata || []);
    });
  }

  async loadApplicationJSON(): Promise<ApplicationJSON | undefined> {
    return (
      this.#applicationJSON ||
      new Promise((resolve) => {
        const applicationJSON = getLocalEntity<ApplicationJSON>(this.#urlKey);
        if (applicationJSON) {
          this.#applicationJSON = applicationJSON;
        }
        resolve(applicationJSON);
      })
    );
  }

  saveApplicationJSON(applicationJSON: ApplicationJSON): Promise<void> {
    return new Promise((resolve, reject) => {
      const savedLayout = saveLocalEntity<ApplicationJSON>(
        this.#urlKey,
        applicationJSON,
      );
      if (savedLayout) {
        this.#applicationJSON = applicationJSON;
        resolve();
      } else {
        reject(new Error("Application Json failed to save"));
      }
    });
  }

  loadLayouts = (): Promise<Layout[]> => {
    return new Promise((resolve) => {
      const layouts = getLocalEntity<Layout[]>(this.#layoutsSaveLocation);
      resolve(layouts || []);
    });
  };

  saveLayoutsWithMetadata = (
    layouts: Layout[],
    metadata: LayoutMetadata[],
  ): void => {
    saveLocalEntity<Layout[]>(this.#layoutsSaveLocation, layouts);
    saveLocalEntity<LayoutMetadata[]>(this.#metadataSaveLocation, metadata);
  };

  // Ensures that there is exactly one Layout entry and exactly one Metadata
  // entry in local storage corresponding to the provided ID.
  validateIds = async (id: string): Promise<void> => {
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
  };

  // Ensures that there is exactly one element (Layout or Metadata) in local
  // storage corresponding to the provided ID.
  validateId = (id: string, dataType: "metadata" | "layout"): Promise<void> => {
    return new Promise((resolve, reject) => {
      const loadFunc =
        dataType === "metadata"
          ? () => this.loadMetadata()
          : () => this.loadLayouts();

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
  };

  async getUserSettings() {
    if (this.#applicationJSON) {
      return this.#applicationJSON.userSettings ?? {};
    }

    try {
      const applicationJSON = await this.loadApplicationJSON();
      return applicationJSON?.userSettings ?? {};
    } catch (e) {
      return {};
    }
  }

  saveUserSettings(userSettings: Settings) {
    if (this.#applicationJSON) {
      this.saveApplicationJSON({
        ...this.#applicationJSON,
        userSettings,
      });
    }
  }
}
