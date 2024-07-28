import React from "react";
import {
  ApplicationSetting,
  ApplicationSettings,
  LayoutJSON,
} from "../json-types";
import { LayoutMetadata, LayoutMetadataDto } from "../layout-types";

export interface WorkspaceContextProps {
  layoutMetadata: LayoutMetadata[];
  layoutPlaceholderJSON?: LayoutJSON;
  getApplicationSettings: (
    key?: keyof ApplicationSettings
  ) => ApplicationSettings | ApplicationSetting | undefined;
  loadLayoutById: (id: string) => void;
  saveApplicationSettings: (
    settings: ApplicationSettings | ApplicationSetting,
    key?: keyof ApplicationSettings
  ) => void;
  saveLayout: (n: LayoutMetadataDto) => void;
  saveApplicationLayout: (layout: LayoutJSON) => void;
  workspaceJSON?: LayoutJSON;
}

export const WorkspaceContext = React.createContext<WorkspaceContextProps>({
  getApplicationSettings: () => undefined,
  layoutMetadata: [],
  saveLayout: () => undefined,
  saveApplicationLayout: () => undefined,
  saveApplicationSettings: () => undefined,
  loadLayoutById: () => undefined,
});
