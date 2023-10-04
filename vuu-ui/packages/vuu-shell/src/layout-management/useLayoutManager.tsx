import React, { useState, useCallback, useContext, useEffect } from "react";
import { LayoutJSON, LocalLayoutPersistenceManager } from "@finos/vuu-layout";
import { LayoutMetadata } from "./layoutTypes";
import { defaultLayout } from "@finos/vuu-layout/";

const persistenceManager = new LocalLayoutPersistenceManager();

export const LayoutManagementContext = React.createContext<{
  layoutMetadata: LayoutMetadata[],
  saveLayout: (n: Omit<LayoutMetadata, "id">) => void,
  currentLayout: LayoutJSON,
  saveCurrentLayout: (layout: LayoutJSON) => void,
  loadLayoutById: (id: string) => void
}>({
  layoutMetadata: [],
  saveLayout: () => { },
  currentLayout: defaultLayout,
  saveCurrentLayout: () => { },
  loadLayoutById: () => defaultLayout
})

type LayoutManagementProviderProps = {
  children: JSX.Element | JSX.Element[]
}

export const LayoutManagementProvider = (props: LayoutManagementProviderProps) => {
  const [layoutMetadata, setLayoutMetadata] = useState<LayoutMetadata[]>([]);
  const [currentLayout, setCurrentLayout] = useState<LayoutJSON>(defaultLayout);

  useEffect(() => {
    persistenceManager.loadMetadata().then(metadata => {
      setLayoutMetadata(metadata)
    })
    persistenceManager.loadCurrentLayout().then(layout => {
      setCurrentLayout(layout);
    })
  }, [])

  const saveCurrentLayout = useCallback((layout: LayoutJSON) => {
    setCurrentLayout(layout)
    persistenceManager.saveCurrentLayout(layout)
  }, []);

  const saveLayout = useCallback((metadata: Omit<LayoutMetadata, "id">) => {
    persistenceManager.createLayout(metadata, currentLayout).then(generatedId => {

      const newMetadata: LayoutMetadata = {
        ...metadata,
        id: generatedId
      };

      setLayoutMetadata(prev => [...prev, newMetadata]);
    })
  }, [currentLayout])

  const loadLayoutById = useCallback((id: string) => {
    persistenceManager.loadLayout(id).then((layoutJson) => {
      setCurrentLayout(prev => ({
        ...prev,
        children: [...(prev.children || []), ...(layoutJson.children || [])]
      }))
    })
  }, []);

  return (
    <LayoutManagementContext.Provider value={{ layoutMetadata, saveLayout, currentLayout, saveCurrentLayout, loadLayoutById }} >
      {props.children}
    </LayoutManagementContext.Provider>
  )
}

export const useLayoutManager = () => useContext(LayoutManagementContext);
