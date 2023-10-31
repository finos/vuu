import React, {
  useState,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  defaultLayout,
  LayoutJSON,
  LayoutPersistenceManager,
  LocalLayoutPersistenceManager,
  resolveJSONPath,
} from "@finos/vuu-layout";
import { LayoutMetadata } from "./layoutTypes";

let _persistenceManager: LayoutPersistenceManager;

const getPersistenceManager = () => {
  if (_persistenceManager === undefined) {
    _persistenceManager = new LocalLayoutPersistenceManager();
  }
  return _persistenceManager;
};

export const LayoutManagementContext = React.createContext<{
  layoutMetadata: LayoutMetadata[];
  saveLayout: (n: Omit<LayoutMetadata, "id">) => void;
  applicationLayout: LayoutJSON;
  saveApplicationLayout: (layout: LayoutJSON) => void;
  loadLayoutById: (id: string) => void;
}>({
  layoutMetadata: [],
  saveLayout: () => undefined,
  applicationLayout: defaultLayout,
  saveApplicationLayout: () => undefined,
  loadLayoutById: () => defaultLayout,
});

type LayoutManagementProviderProps = {
  children: JSX.Element | JSX.Element[];
};

export const LayoutManagementProvider = (
  props: LayoutManagementProviderProps
) => {
  const [layoutMetadata, setLayoutMetadata] = useState<LayoutMetadata[]>([]);
  // TODO this default should probably be a loading state rather than the placeholder
  // It will be replaced as soon as the localStorage/remote layout is resolved
  const [, forceRefresh] = useState({});
  const applicationLayoutRef = useRef<LayoutJSON>(defaultLayout);

  const setApplicationLayout = useCallback(
    (layout: LayoutJSON, rerender = true) => {
      applicationLayoutRef.current = layout;
      if (rerender) {
        forceRefresh({});
      }
    },
    []
  );

  useEffect(() => {
    const persistenceManager = getPersistenceManager();
    persistenceManager.loadMetadata().then((metadata) => {
      setLayoutMetadata(metadata);
    });
    persistenceManager.loadApplicationLayout().then((layout) => {
      setApplicationLayout(layout);
    });
  }, [setApplicationLayout]);

  const saveApplicationLayout = useCallback(
    (layout: LayoutJSON) => {
      const persistenceManager = getPersistenceManager();
      setApplicationLayout(layout, false);
      persistenceManager.saveApplicationLayout(layout);
    },
    [setApplicationLayout]
  );

  const saveLayout = useCallback((metadata: Omit<LayoutMetadata, "id">) => {
    const layoutToSave = resolveJSONPath(
      applicationLayoutRef.current,
      "#main-tabs.ACTIVE_CHILD"
    );

    if (layoutToSave) {
      const persistenceManager = getPersistenceManager();
      persistenceManager
        .createLayout(metadata, layoutToSave)
        .then((generatedId) => {
          const newMetadata: LayoutMetadata = {
            ...metadata,
            id: generatedId,
          };

          setLayoutMetadata((prev) => [...prev, newMetadata]);
        });
    }
    //TODO else{ show error message}
  }, []);

  const loadLayoutById = useCallback(
    (id: string) => {
      const persistenceManager = getPersistenceManager();
      persistenceManager.loadLayout(id).then((layoutJson) => {
        const { current: prev } = applicationLayoutRef;
        setApplicationLayout({
          ...prev,
          active: prev.children?.length ?? 0,
          children: [...(prev.children || []), layoutJson],
        });
      });
    },
    [setApplicationLayout]
  );

  return (
    <LayoutManagementContext.Provider
      value={{
        layoutMetadata,
        saveLayout,
        applicationLayout: applicationLayoutRef.current,
        saveApplicationLayout,
        loadLayoutById,
      }}
    >
      {props.children}
    </LayoutManagementContext.Provider>
  );
};

export const useLayoutManager = () => useContext(LayoutManagementContext);
