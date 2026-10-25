import {
  createContext,
  useContext,
  type ReactElement,
  type ReactNode,
} from "react";
import type { WorkspacePersistenceService } from "./WorkspacePersistenceService";

const WorkspacePersistenceContext = createContext<
  WorkspacePersistenceService | undefined
>(undefined);

export interface WorkspacePersistenceProviderProps {
  readonly children: ReactNode;
  readonly service?: WorkspacePersistenceService;
}

export const WorkspacePersistenceProvider = ({
  children,
  service,
}: WorkspacePersistenceProviderProps): ReactElement => (
  <WorkspacePersistenceContext.Provider value={service}>
    {children}
  </WorkspacePersistenceContext.Provider>
);

export const useWorkspacePersistenceService =
  (): WorkspacePersistenceService => {
    const service = useContext(WorkspacePersistenceContext);
    if (!service) {
      throw new Error(
        "useWorkspacePersistenceService requires a configured WorkspacePersistenceProvider",
      );
    }
    return service;
  };

export const useOptionalWorkspacePersistenceService = ():
  | WorkspacePersistenceService
  | undefined => useContext(WorkspacePersistenceContext);
