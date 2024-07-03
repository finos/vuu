import { ReactElement, ReactNode, createContext, useContext } from "react";
import { IPersistenceManager } from "../persistence-management";

export interface PersistenceContextProps {
  persistenceManager?: IPersistenceManager;
}

export const PersistenceContext = createContext<PersistenceContextProps>({});

export interface PersistenceProviderProps extends PersistenceContextProps {
  children: ReactNode;
}

export const PersistenceProvider = ({
  children,
  persistenceManager,
}: PersistenceProviderProps): ReactElement => {
  return (
    <PersistenceContext.Provider value={{ persistenceManager }}>
      {children}
    </PersistenceContext.Provider>
  );
};

export const usePersistenceManager = () => {
  const { persistenceManager } = useContext(PersistenceContext);
  return persistenceManager;
};
