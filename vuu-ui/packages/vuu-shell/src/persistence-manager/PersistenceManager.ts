import type {
  ApplicationJSON,
  LayoutJSON,
  LayoutMetadata,
  LayoutMetadataDto,
  Settings,
} from "@vuu-ui/vuu-utils";

export interface IPersistenceManager {
  /**
   *  Clear saved user settings/preferences. Right now, this clears ALL saved
   * settimgs for user. We will introduce a more fine grained scheme here.
   */
  clearUserSettings: () => void;
  /**
   * Saves a new layout and its corresponding metadata
   *
   * @param metadata - Metadata about the layout to be saved
   * @param layout   - Full JSON representation of the layout to be saved
   *
   * @returns Unique identifier assigned to the saved layout
   */
  createLayout: (
    metadata: LayoutMetadataDto,
    layout: LayoutJSON,
  ) => Promise<LayoutMetadata>;

  /**
   * Overwrites an existing layout and its corresponding metadata with the provided information
   *
   * @param id       - Unique identifier of the existing layout to be updated
   * @param metadata - Metadata describing the new layout to overwrite with
   * @param layout   - Full JSON representation of the new layout to overwrite with
   */
  updateLayout: (
    id: string,
    metadata: LayoutMetadataDto,
    layout: LayoutJSON,
  ) => Promise<void>;

  /**
   * Deletes an existing layout and its corresponding metadata
   *
   * @param id - Unique identifier of the existing layout to be deleted
   */
  deleteLayout: (id: string) => Promise<void>;

  /**
   * Retrieves an existing layout
   *
   * @param id - Unique identifier of the existing layout to be retrieved
   *
   * @returns Full JSON representation of the layout corresponding to the provided ID
   */
  loadLayout: (id: string) => Promise<LayoutJSON>;

  /**
   * Retrieves metadata for all existing layouts
   *
   * @returns an array of all persisted layout metadata
   */
  loadMetadata: () => Promise<LayoutMetadata[]>;

  /**
   * Retrieves the application JSON. This includes the application layout,
   * which describes all layouts on screen
   *
   * @returns Full JSON representation of the application json
   */
  loadApplicationJSON: () => Promise<ApplicationJSON | undefined>;

  /**
   * Saves the application JSON.  This includes the application layout,
   * which describes all layouts on screen
   *
   * @param layout - Full JSON representation of the application layout to be saved
   */
  saveApplicationJSON: (layout: ApplicationJSON) => Promise<void>;

  /**
   * Save user settings. These get saved within the Application JSON.
   *
   * @param userSettings
   */
  saveUserSettings: (userSettings: Settings) => void;

  /**
   * Get the user settings. These are stored within Application JSON.
   *
   * @returns userSettings
   */
  getUserSettings: () => Promise<Settings>;
}
