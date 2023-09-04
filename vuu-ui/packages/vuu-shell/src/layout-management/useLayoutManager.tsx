import React, { useState, useCallback, useContext, useEffect } from "react";
import { getLocalEntity, saveLocalEntity } from "@finos/vuu-filters";
import { LayoutJSON } from "@finos/vuu-layout";
import { getUniqueId } from "@finos/vuu-utils";
import { LayoutMetadata, Layout } from "./layoutTypes";

export const LayoutManagementContext = React.createContext<{
  layouts: Layout[],
  saveLayout: (n: Omit<LayoutMetadata, "id">) => void
}>({ layouts: [], saveLayout: () => { } })

export const LayoutManagementProvider = (props: { children: JSX.Element | JSX.Element[] }) => {

  const [layouts, setLayouts] = useState<Layout[]>([])

  useEffect(() => {
    const layouts = getLocalEntity<Layout[]>("layouts")
    setLayouts(layouts || [])
  }, [])

  useEffect(() => {
    saveLocalEntity<Layout[]>("layouts", layouts)
  }, [layouts])

  const saveLayout = useCallback((metadata: Omit<LayoutMetadata, "id">) => {
    const json = getLocalEntity<LayoutJSON>("api/vui")
    if (json) {
      setLayouts(prev =>
        [
          ...prev,
          {
            metadata: {
              ...metadata,
              id: getUniqueId()
            },
            json
          }
        ]
      )
    }
  }, [])

  return (
    <LayoutManagementContext.Provider value={{ layouts, saveLayout }} >
      {props.children}
    </LayoutManagementContext.Provider>
  )
}

export const useLayoutManager = () => useContext(LayoutManagementContext);
