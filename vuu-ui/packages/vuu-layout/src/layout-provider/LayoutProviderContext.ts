import { createContext, Dispatch, ReactElement } from "react";
import {
  DragStartAction,
  LayoutReducerAction,
  QueryAction
} from "../layout-reducer";
import { SaveAction } from "../layout-view";
import { LayoutJSON } from "@finos/vuu-utils";

const unconfiguredLayoutProviderDispatch: LayoutProviderDispatch = (action) =>
  console.log(
    `dispatch ${action.type}, have you forgotten to provide a LayoutProvider ?`
  );
const unconfiguredService = (message: string) => () =>
  console.log(`${message}, have you forgotten to provide a LayoutProvider ?`);

export type LayoutProviderDispatch = Dispatch<
  LayoutReducerAction | SaveAction | DragStartAction | QueryAction
>;

export interface LayoutProviderContextProps {
  addComponentToWorkspace: (component: ReactElement) => void;
  createNewChild?: (index?: number) => ReactElement;
  dispatchLayoutProvider: LayoutProviderDispatch;
  showComponentInContextPanel: (
    component: ReactElement | LayoutJSON,
    title?: string
  ) => void;
  switchWorkspace: (idx: number) => void;
  version: number;
}

export const LayoutProviderContext = createContext<LayoutProviderContextProps>({
  addComponentToWorkspace: unconfiguredService("addComponentToWorkspace"),
  dispatchLayoutProvider: unconfiguredLayoutProviderDispatch,
  showComponentInContextPanel: unconfiguredService(
    "showComponentInContextPanel"
  ),
  switchWorkspace: unconfiguredService("switchWorkspace"),
  version: -1
});
