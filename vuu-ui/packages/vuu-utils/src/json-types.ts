import { NamedFilter } from "@vuu-ui/vuu-filter-types";
import { CSSProperties, ReactElement } from "react";
import { ValueOf } from "./ts-utils";

export interface ApplicationSettings {
  leftNav?: {
    activeTabIndex: number;
    expanded: boolean;
  };
  /**
   * filters are keyed by MODULE:tablename
   */
  filters?: { [key: string]: NamedFilter[] };
}
export type ApplicationSetting = ValueOf<ApplicationSettings>;

export type Settings = Record<string, string | number | boolean>;

export interface ApplicationJSON {
  workspaceJSON: LayoutJSON | LayoutJSON[];
  settings?: ApplicationSettings;
  userSettings?: Settings;
}

export interface WithActive {
  active?: number;
}

export interface WithProps {
  props?: { [key: string]: unknown };
}

export interface LayoutRoot extends WithProps {
  active?: number;
  children?: ReactElement[];
  type: string;
}

export interface WithType {
  props?: unknown;
  title?: string;
  type: string;
}

export type LayoutModel = LayoutRoot | ReactElement | WithType;

export interface LayoutJSON<T extends object = { [key: string]: any }>
  extends WithType {
  active?: number;
  children?: LayoutJSON[];
  id?: string;
  props?: T;
  state?: unknown;
  type: string;
  style?: CSSProperties;
}
