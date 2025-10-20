import { createContext, Dispatch, ReactElement } from "react";
import {
  DragStartAction,
  LayoutReducerAction,
  QueryAction,
} from "../layout-reducer";
import { LayoutJSON } from "@vuu-ui/vuu-utils";
import { SaveAction } from "../layout-view/viewTypes";

const unconfiguredLayoutProviderDispatch: LayoutProviderDispatch = (action) =>
  console.log(
    `dispatch ${action.type}, have you forgotten to provide a LayoutProvider ?`,
  );

const unconfiguredService = (message: string) => () =>
  console.log(`${message}, have you forgotten to provide a LayoutProvider ?`);

const MissingLayoutContextPanel = unconfiguredService(
  "showComponentInContextPanel",
);

export const isUnconfiguredProperty = (property: unknown): boolean =>
  property === MissingLayoutContextPanel;

export type LayoutProviderDispatch = Dispatch<
  LayoutReducerAction | SaveAction | DragStartAction | QueryAction
>;

export interface LayoutProviderContextProps {
  addComponentToWorkspace: (component: ReactElement) => void;
  createNewChild?: (index?: number) => ReactElement;
  dispatchLayoutProvider: LayoutProviderDispatch;
  showComponentInContextPanel: (
    component: ReactElement | LayoutJSON,
    title?: string,
    onContextPanelClose?: () => void,
  ) => void;
  switchWorkspace: (idx: number) => void;
  version: number;
}

export const LayoutProviderContext = createContext<LayoutProviderContextProps>({
  addComponentToWorkspace: unconfiguredService("addComponentToWorkspace"),
  dispatchLayoutProvider: unconfiguredLayoutProviderDispatch,
  showComponentInContextPanel: MissingLayoutContextPanel,
  switchWorkspace: unconfiguredService("switchWorkspace"),
  version: -1,
});
