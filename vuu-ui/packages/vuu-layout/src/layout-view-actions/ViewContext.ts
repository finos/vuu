import React, { SyntheticEvent, useContext } from "react";
import { ViewAction } from "../layout-view/viewTypes";

export type QueryResponse = { [key: string]: unknown };

export type ConfigChangeHandler = (config: {
  [key: string]: unknown;
  type: string;
}) => void;

export type ViewDispatch = <Action extends ViewAction = ViewAction>(
  action: Action,
  evt?: SyntheticEvent,
) => Promise<boolean | QueryResponse | void>;

/**
 * This API is available to any Feature hosted within Vuu (as all Features are wrapped
 * with View component). It offers metadata about the View as well as access to the
 * Vuu persistencew API;
 */
export interface ViewContextAPI {
  /**
   * dispatcher for View actions. These are a subset of LayoutActions, specifically for
   * View manipulation
   */
  dispatch?: ViewDispatch | null;
  id?: string;
  load?: <T = unknown>(key?: string) => T;
  onConfigChange?: ConfigChangeHandler;
  path?: string;
  purge?: (key: string) => void;
  save?: (state: unknown, key: string) => void;
  setComponentProps: (props: { [key: string]: unknown }) => void;
  title?: string;
}

const NO_CONTEXT = { dispatch: null } as ViewContextAPI;
export const ViewContext = React.createContext<ViewContextAPI>(NO_CONTEXT);

export const useViewDispatch = () => {
  const context = useContext(ViewContext);
  return context?.dispatch ?? null;
};

export const useViewContext = () => useContext(ViewContext);
