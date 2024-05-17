import { BaseRowProps } from "@finos/vuu-table-types";
import { createContext, FC, useContext } from "react";

const HeaderContext = createContext<BaseRowProps>({ columns: [] });

export const HeaderProvider: FC<BaseRowProps> = ({
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
