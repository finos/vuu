import { ReactElement, ReactNode, createContext, useContext } from "react";
import { IPersistenceManager } from "../persistence-manager";

export interface PersistenceContextNextProps {
  persistenceManager?: IPersistenceManager;
}

const PersistenceContextNext = createContext<PersistenceContextNextProps>({});

export interface PersistenceProviderNextProps
  extends PersistenceContextNextProps {
  children: ReactNode;
}

export const PersistenceProviderNext = ({
  children,
  persistenceManager,
}: PersistenceProviderNextProps): ReactElement => {
  return (
    <PersistenceContextNext.Provider value={{ persistenceManager }}>
      {children}
    </PersistenceContextNext.Provider>
  );
};

export const usePersistenceManagerNext = () => {
  const { persistenceManager } = useContext(PersistenceContextNext);
  return persistenceManager;
};
