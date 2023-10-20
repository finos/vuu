import React, { useState, useCallback, useContext, useEffect } from "react";
import { LayoutJSON, LocalLayoutPersistenceManager, resolveJSONPath } from "@finos/vuu-layout";
import { LayoutMetadata } from "./layoutTypes";
import { defaultLayout } from "@finos/vuu-layout/";

const persistenceManager = new LocalLayoutPersistenceManager();

export const LayoutManagementContext = React.createContext<{
  layoutMetadata: LayoutMetadata[],
  saveLayout: (n: Omit<LayoutMetadata, "id">) => void,
  applicationLayout: LayoutJSON,
  saveApplicationLayout: (layout: LayoutJSON) => void,
  loadLayoutById: (id: string) => void
}>({
  layoutMetadata: [],
  saveLayout: () => { },
  applicationLayout: defaultLayout,
  saveApplicationLayout: () => { },
  loadLayoutById: () => defaultLayout
})

type LayoutManagementProviderProps = {
  children: JSX.Element | JSX.Element[]
}

export const LayoutManagementProvider = (props: LayoutManagementProviderProps) => {
  const [layoutMetadata, setLayoutMetadata] = useState<LayoutMetadata[]>([]);
  const [applicationLayout, setApplicationLayout] = useState<LayoutJSON>(defaultLayout);

  useEffect(() => {
    persistenceManager.loadMetadata().then(metadata => {
      setLayoutMetadata(metadata)
    })
    persistenceManager.loadApplicationLayout().then(layout => {
      setApplicationLayout(layout);
    })
  }, [])

  const saveApplicationLayout = useCallback((layout: LayoutJSON) => {
    setApplicationLayout(layout)
    persistenceManager.saveApplicationLayout(layout)
  }, []);

  const saveLayout = useCallback((metadata: Omit<LayoutMetadata, "id">) => {

    const layoutToSave = resolveJSONPath(applicationLayout, "#main-tabs.ACTIVE_CHILD");

    if (layoutToSave) {
      persistenceManager.createLayout(metadata, layoutToSave).then(generatedId => {
        const newMetadata: LayoutMetadata = {
          ...metadata,
          id: generatedId
        };

        setLayoutMetadata(prev => [...prev, newMetadata]);
      })
    }
    //TODO else{ show error message}
  }, [applicationLayout])

  const loadLayoutById = useCallback((id: string) => {
    persistenceManager.loadLayout(id).then((layoutJson) => {
      setApplicationLayout(prev => ({
        ...prev,
        children: [...(prev.children || []), layoutJson]
      }))
    })
  }, []);

  return (
    <LayoutManagementContext.Provider value={{ layoutMetadata, saveLayout, applicationLayout, saveApplicationLayout, loadLayoutById }} >
      {props.children}
    </LayoutManagementContext.Provider>
  )
}

export const useLayoutManager = () => useContext(LayoutManagementContext);
