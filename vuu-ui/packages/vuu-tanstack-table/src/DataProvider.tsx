import { DataSource } from "@finos/vuu-data-types";
import { createContext, ReactNode, useContext } from "react";

interface DataContext {
  dataSource: DataSource;
}

class DataContextImpl implements DataContext {
  #dataSource?: DataSource;
  get dataSource() {
    if (this.#dataSource) {
      return this.#dataSource;
    } else {
      throw Error(
        "[DataContext] no dataSource has been set, have you included a DataProvider",
      );
    }
  }

  set dataSource(ds: DataSource) {
    this.#dataSource = ds;
  }
}

const DataContext = createContext<DataContext>(new DataContextImpl());

export interface DataProviderProps {
  children: ReactNode;
  dataSource: DataSource;
}

export const DataProvider = ({ children, dataSource }: DataProviderProps) => {
  return (
    <DataContext.Provider value={{ dataSource }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  return useContext(DataContext);
};
