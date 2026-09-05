import {
  type ReactElement,
  type ReactNode,
  createContext,
  useContext,
} from "react";
import type { IPersistenceManager } from "./PersistenceManager";
import type { WorkspacePersistenceService } from "./WorkspacePersistenceService";

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
      {children}
    </PersistenceContext.Provider>
  );
};

export const usePersistenceManager = () => {
  const { persistenceManager } = useContext(PersistenceContext);
  return persistenceManager;
};

export const useWorkspacePersistenceService = () => {
  const { workspacePersistenceService } = useContext(PersistenceContext);
  if (!workspacePersistenceService) {
    throw new Error(
      "useWorkspacePersistenceService requires a configured PersistenceProvider",
    );
  }
  return workspacePersistenceService;
};

export const useOptionalWorkspacePersistenceService = () =>
  useContext(PersistenceContext).workspacePersistenceService;
