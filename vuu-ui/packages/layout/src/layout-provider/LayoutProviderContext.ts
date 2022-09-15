import { createContext, Dispatch } from 'react';
import { DragStartAction, LayoutReducerAction, SaveAction } from '../layout-reducer';

const unconfiguredLayoutProviderDispatch: LayoutProviderDispatch = (action) =>
  console.log(`dispatch ${action.type}, have you forgotten to provide a LayoutProvider ?`);

export type LayoutProviderDispatch = Dispatch<LayoutReducerAction | SaveAction | DragStartAction>;

export interface LayoutProviderContextProps {
  dispatchLayoutProvider: LayoutProviderDispatch;
  version: number;
}

console.log(`%c CREATE LAYOUTPROVIDERXCONTEXT`, 'color: red; font-weight: bold;');
export const LayoutProviderContext = createContext<LayoutProviderContextProps>({
  dispatchLayoutProvider: unconfiguredLayoutProviderDispatch,
  version: -1
});
