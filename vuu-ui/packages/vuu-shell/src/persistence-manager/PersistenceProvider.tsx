import {
  WorkspacePersistenceProvider,
  type WorkspacePersistenceService,
} from "@vuu-ui/core";
import {
  type ReactElement,
  type ReactNode,
  createContext,
  useContext,
} from "react";
import type { IPersistenceManager } from "./PersistenceManager";

export {
  useOptionalWorkspacePersistenceService,
  useWorkspacePersistenceService,
} from "@vuu-ui/core";

export interface PersistenceContextProps {
  persistenceManager?: IPersistenceManager;
  workspacePersistenceService?: WorkspacePersistenceService;
}

export const PersistenceContext = createContext<PersistenceContextProps>({});

export interface PersistenceProviderProps extends PersistenceContextProps {
  children: ReactNode;
}

export const PersistenceProvider = ({
  children,
  persistenceManager,
  workspacePersistenceService,
}: PersistenceProviderProps): ReactElement => {
  return (
    <PersistenceContext.Provider
      value={{ persistenceManager, workspacePersistenceService }}
    >
      <WorkspacePersistenceProvider service={workspacePersistenceService}>
        {children}
      </WorkspacePersistenceProvider>
    </PersistenceContext.Provider>
  );
};

export const usePersistenceManager = () => {
  const { persistenceManager } = useContext(PersistenceContext);
  return persistenceManager;
};
