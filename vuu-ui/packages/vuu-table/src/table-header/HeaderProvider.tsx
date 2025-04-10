import { BaseRowProps } from "@finos/vuu-table-types";
import { createContext, FC, ReactNode, useContext } from "react";

const HeaderContext = createContext<BaseRowProps>({ columns: [] });

export const HeaderProvider: FC<BaseRowProps & { children: ReactNode }> = ({
  children,
  columns,
  virtualColSpan,
}) => {
  return (
    <HeaderContext.Provider value={{ columns, virtualColSpan }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeaderProps = () => useContext(HeaderContext);
