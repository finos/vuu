import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  defaultLayout,
  LayoutJSON,
  LayoutPersistenceManager,
  LocalLayoutPersistenceManager,
  RemoteLayoutPersistenceManager,
  resolveJSONPath,
} from "@finos/vuu-layout";
import { LayoutMetadata, LayoutMetadataDto } from "./layoutTypes";

const local = process.env.LOCAL ?? true;

let _persistenceManager: LayoutPersistenceManager;

const getPersistenceManager = () => {
  if (_persistenceManager === undefined) {
    _persistenceManager = local
      ? new LocalLayoutPersistenceManager()
      : new RemoteLayoutPersistenceManager();
  }
  return _persistenceManager;
};

export const LayoutManagementContext = React.createContext<{
  layoutMetadata: LayoutMetadata[];
  saveLayout: (n: LayoutMetadataDto) => void;
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

    persistenceManager.loadMetadata()
      .then((metadata) => {
        setLayoutMetadata(metadata);
      })
      .catch((error: Error) => {
        //TODO: Show error toaster
        console.error("Error occurred while retrieving metadata", error);
      });

    persistenceManager.loadApplicationLayout()
      .then((layout: LayoutJSON) => {
        setApplicationLayout(layout);
      })
      .catch((error: Error) => {
        //TODO: Show error toaster
        console.error(
          "Error occurred while retrieving application layout",
          error
        );
      });
  }, [setApplicationLayout]);

  const saveApplicationLayout = useCallback(
    (layout: LayoutJSON) => {
      console.log(`save application layout ${JSON.stringify(layout, null, 2)}`);
      setApplicationLayout(layout, false);
      getPersistenceManager().saveApplicationLayout(layout);
    },
    [setApplicationLayout]
  );

  const saveLayout = useCallback((metadata: LayoutMetadataDto) => {
    const layoutToSave = resolveJSONPath(
      applicationLayoutRef.current,
      "#main-tabs.ACTIVE_CHILD"
    );

    if (layoutToSave) {
      getPersistenceManager()
        .createLayout(metadata, layoutToSave)
        .then((metadata) => {
          //TODO: Show success toast
          setLayoutMetadata((prev) => [...prev, metadata]);
        })
        .catch((error: Error) => {
          //TODO: Show error toaster
          console.error("Error occurred while saving layout", error);
        });
    }
    //TODO else{ show error message}
  }, []);

  const loadLayoutById = useCallback(
    (id: string) => {
      getPersistenceManager()
        .loadLayout(id)
        .then((layoutJson) => {
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
