import React, { useState, useCallback, useContext, useEffect } from "react";
import { getLocalEntity } from "@finos/vuu-filters";
import { LayoutJSON, LocalLayoutPersistenceManager } from "@finos/vuu-layout";
import { LayoutMetadata } from "./layoutTypes";

const persistenceManager = new LocalLayoutPersistenceManager();

export const LayoutManagementContext = React.createContext<{
  layoutMetadata: LayoutMetadata[],
  saveLayout: (n: Omit<LayoutMetadata, "id">) => void
}>({ layoutMetadata: [], saveLayout: () => { } })

export const LayoutManagementProvider = (props: {
    children: JSX.Element | JSX.Element[]
  }) => {
  const [layoutMetadata, setLayoutMetadata] = useState<LayoutMetadata[]>([]);

  useEffect(() => {
    const loadedMetadata = persistenceManager.loadMetadata();
    setLayoutMetadata(loadedMetadata || [])
  }, [])

  const saveLayout = useCallback((metadata: Omit<LayoutMetadata, "id">) => {
    const json = getLocalEntity<LayoutJSON>("api/vui");

    if (json) {
      // Persist layouts
      const generatedId = persistenceManager.createLayout(metadata, json);

      // Update state
      const newMetadata: LayoutMetadata = {
        ...metadata,
        id: generatedId
      };

      setLayoutMetadata(prev => [...prev, newMetadata]);
    }
  }, [])

  // TODO: add loadLayout function

  return (
    <LayoutManagementContext.Provider value={{ layoutMetadata, saveLayout }} >
      {props.children}
    </LayoutManagementContext.Provider>
  )
}

export const useLayoutManager = () => useContext(LayoutManagementContext);
