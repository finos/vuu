import { createContext, Dispatch, ReactElement } from "react";
import {
  DragStartAction,
  LayoutReducerAction,
  SaveAction,
} from "../layout-reducer";

const unconfiguredLayoutProviderDispatch: LayoutProviderDispatch = (action) =>
  console.log(
    `dispatch ${action.type}, have you forgotten to provide a LayoutProvider ?`
  );

export type LayoutProviderDispatch = Dispatch<
  LayoutReducerAction | SaveAction | DragStartAction
>;

export interface LayoutProviderContextProps {
  createNewChild?: (index?: number) => ReactElement;
  dispatchLayoutProvider: LayoutProviderDispatch;
  version: number;
}

export const LayoutProviderContext = createContext<LayoutProviderContextProps>({
  dispatchLayoutProvider: unconfiguredLayoutProviderDispatch,
  version: -1,
});
