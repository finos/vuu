import React, { useState, useCallback, useContext, useEffect } from "react";
import { LayoutJSON, LocalLayoutPersistenceManager, resolveJSONPath, RemoteLayoutPersistenceManager } from "@finos/vuu-layout";
import { LayoutMetadata } from "./layoutTypes";
import { defaultLayout } from "@finos/vuu-layout/";

const local = process.env.LOCAL || false;

const persistenceManager = local ? new LocalLayoutPersistenceManager() : new RemoteLayoutPersistenceManager();

export const LayoutManagementContext = React.createContext<{
  layoutMetadata: LayoutMetadata[],
  saveLayout: (n: Omit<LayoutMetadata, "id" | "created">) => void,
  applicationLayout: LayoutJSON,
  saveApplicationLayout: (layout: LayoutJSON) => void,
  loadLayoutById: (id: string) => void
}>({
  layoutMetadata: [],
  saveLayout: () => null,
  applicationLayout: defaultLayout,
  saveApplicationLayout: () => null,
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
      .catch((error: Error) => {
        //TODO: Show error toaster
        console.error("Error occurred while retrieving metadata", error)
      })
  }, [])

  const saveApplicationLayout = useCallback((layout: LayoutJSON) => {
    setApplicationLayout(layout)
    persistenceManager.saveApplicationLayout(layout)
  }, []);

  const saveLayout = useCallback((metadata:Omit<LayoutMetadata, "id" | "created">) => {

    const layoutToSave = resolveJSONPath(applicationLayout, "#main-tabs.ACTIVE_CHILD");

    if (layoutToSave) {
      persistenceManager.createLayout(metadata, layoutToSave).then((metadata) => {
        setLayoutMetadata(prev => [...prev, metadata]);
        //TODO: Show success toast
      }).catch((error: Error) => {
        //TODO: Show error toaster
        console.error("Error occurred while saving layout", error)
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
