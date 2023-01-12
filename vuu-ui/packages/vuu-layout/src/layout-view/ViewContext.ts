import path from "path";
import React, { SyntheticEvent, useContext } from "react";
import { ViewAction } from "./viewTypes";

export type ViewDispatch = <Action extends ViewAction = ViewAction>(
  action: Action,
  evt?: SyntheticEvent
) => Promise<boolean | void>;

export interface ViewContextProps {
  dispatch?: ViewDispatch | null;
  id?: string;
  load?: (key?: string) => unknown;
  loadSession?: (key?: string) => unknown;
  onConfigChange?: (config: unknown) => void;
  path?: string;
  purge?: (key: string) => void;
  save?: (state: unknown, key: string) => void;
  saveSession?: (state: unknown, key: string) => void;
  title?: string;
}

const NO_CONTEXT = { dispatch: null } as ViewContextProps;
export const ViewContext = React.createContext<ViewContextProps>(NO_CONTEXT);

export const useViewDispatch = () => {
  const context = useContext(ViewContext);
  return context?.dispatch ?? null;
};

export const useViewContext = () => useContext(ViewContext);
