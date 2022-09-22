import path from 'path';
import React, { useContext } from 'react';
import { ViewAction } from './viewTypes';

export type ViewDispatch = <Action extends ViewAction = ViewAction>(
  action: Action,
  evt: any
) => Promise<boolean | void>;

export interface ViewContextProps {
  dispatch: ViewDispatch | null;
  id: string;
  load?: (key: string) => void;
  loadSession?: (key: string) => void;
  onConfigChange?: (config: any) => void;
  path?: string;
  save?: (state: any, key: string) => void;
  saveSession?: (state: any, key: string) => void;
  title?: string;
}

const NO_CONTEXT = { dispatch: null } as ViewContextProps;
export const ViewContext = React.createContext<ViewContextProps>(NO_CONTEXT);

export const useViewDispatch = () => {
  const context = useContext(ViewContext);
  return context?.dispatch ?? null;
};

export const useViewContext = () => useContext(ViewContext);
