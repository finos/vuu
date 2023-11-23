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
import { NotificationLevel, useNotifications } from "@finos/vuu-popups";
import { LayoutMetadata, LayoutMetadataDto } from "./layoutTypes";

let _persistenceManager: LayoutPersistenceManager;

const getPersistenceManager = () => {
  if (_persistenceManager === undefined) {
    _persistenceManager = process.env.LOCAL
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

const ensureLayoutHasTitle = (
  layout: LayoutJSON,
  layoutMetadata: LayoutMetadataDto
) => {
  if (layout.props?.title !== undefined) {
    return layout;
  } else {
    return {
      ...layout,
      props: {
        ...layout.props,
        title: layoutMetadata.name,
      },
    };
  }
};

export const LayoutManagementProvider = (
  props: LayoutManagementProviderProps
) => {
  const [layoutMetadata, setLayoutMetadata] = useState<LayoutMetadata[]>([]);
  // TODO this default should probably be a loading state rather than the placeholder
  // It will be replaced as soon as the localStorage/remote layout is resolved
  const [, forceRefresh] = useState({});
  const applicationLayoutRef = useRef<LayoutJSON>(defaultLayout);
  const { notify } = useNotifications();

  const setApplicationLayout = useCallback(
    (layout: LayoutJSON, rerender = true) => {
      applicationLayoutRef.current = layout;
      if (rerender) {
        console.log(`set new applicationLayout`, {
          layout,
        });
        forceRefresh({});
      }
    },
    []
  );

  useEffect(() => {
    const persistenceManager = getPersistenceManager();

    persistenceManager
      .loadMetadata()
      .then((metadata) => {
        setLayoutMetadata(metadata);
      })
      .catch((error: Error) => {
        notify({
          type: NotificationLevel.Error,
          header: "Failed to Load Layouts",
          body: "Could not load list of available layouts",
        });
        console.error("Error occurred while retrieving metadata", error);
      });

    persistenceManager
      .loadApplicationLayout()
      .then((layout: LayoutJSON) => {
        setApplicationLayout(layout);
      })
      .catch((error: Error) => {
        notify({
          type: NotificationLevel.Error,
          header: "Failed to Load Layout",
          body: "Could not load your latest view",
        });
        console.error(
          "Error occurred while retrieving application layout",
          error
        );
      });
  }, [notify, setApplicationLayout]);

  const saveApplicationLayout = useCallback(
    (layout: LayoutJSON) => {
      setApplicationLayout(layout, false);
      getPersistenceManager().saveApplicationLayout(layout);
    },
    [setApplicationLayout]
  );

  const saveLayout = useCallback(
    (metadata: LayoutMetadataDto) => {
      const layoutToSave = resolveJSONPath(
        applicationLayoutRef.current,
        "#main-tabs.ACTIVE_CHILD"
      );

      if (layoutToSave) {
        getPersistenceManager()
          .createLayout(metadata, ensureLayoutHasTitle(layoutToSave, metadata))
          .then((metadata) => {
            notify({
              type: NotificationLevel.Success,
              header: "Layout Saved Successfully",
              body: `${metadata.name} saved successfully`,
            });
            setLayoutMetadata((prev) => [...prev, metadata]);
          })
          .catch((error: Error) => {
            notify({
              type: NotificationLevel.Error,
              header: "Failed to Save Layout",
              body: `Failed to save layout ${metadata.name}`,
            });
            console.error("Error occurred while saving layout", error);
          });
      } else {
        notify({
          type: NotificationLevel.Error,
          header: "Failed to Save Layout",
          body: "Cannot save undefined layout",
        });
      }
    },
    [notify]
  );

  const loadLayoutById = useCallback(
    (id: string) => {
      getPersistenceManager()
        .loadLayout(id)
        .then((layoutJson) => {
          const { current: prev } = applicationLayoutRef;
          setApplicationLayout({
            ...prev,
            children: [...(prev.children || []), layoutJson],
            props: {
              ...prev.props,
              active: prev.children?.length ?? 0,
            },
          });
        })
        .catch((error: Error) => {
          notify({
            type: NotificationLevel.Error,
            header: "Failed to Load Layout",
            body: "Failed to load the requested layout",
          });
          console.error("Error occurred while loading layout", error);
        });
    },
    [notify, setApplicationLayout]
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
