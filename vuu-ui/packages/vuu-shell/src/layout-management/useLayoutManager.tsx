import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ApplicationJSON,
  ApplicationSettings,
  LayoutJSON,
  resolveJSONPath,
  ApplicationSetting,
} from "@finos/vuu-layout";
import { NotificationLevel, useNotifications } from "@finos/vuu-popups";
import { LayoutMetadata, LayoutMetadataDto } from "./layoutTypes";
import {
  defaultApplicationJson,
  PersistenceManager,
  loadingApplicationJson,
  LocalPersistenceManager,
  RemotePersistenceManager,
} from "../persistence-management";

let _persistenceManager: PersistenceManager;

const getPersistenceManager = () => {
  if (_persistenceManager === undefined) {
    _persistenceManager = process.env.LOCAL
      ? new LocalPersistenceManager()
      : new RemotePersistenceManager();
  }
  return _persistenceManager;
};

export const LayoutManagementContext = React.createContext<{
  layoutMetadata: LayoutMetadata[];
  saveLayout: (n: LayoutMetadataDto) => void;
  applicationJson: ApplicationJSON;
  saveApplicationLayout: (layout: LayoutJSON) => void;
  getApplicationSettings: (
    key?: keyof ApplicationSettings
  ) => ApplicationSettings | ApplicationSetting | undefined;
  saveApplicationSettings: (
    settings: ApplicationSettings | ApplicationSetting,
    key?: keyof ApplicationSettings
  ) => void;
  loadLayoutById: (id: string) => void;
}>({
  getApplicationSettings: () => undefined,
  layoutMetadata: [],
  saveLayout: () => undefined,
  // The default Application JSON will be served if no LayoutManagementProvider
  applicationJson: defaultApplicationJson,
  saveApplicationLayout: () => undefined,
  saveApplicationSettings: () => undefined,
  loadLayoutById: () => undefined,
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
  const { notify } = useNotifications();
  const applicationJSONRef = useRef<ApplicationJSON>(loadingApplicationJson);

  const setApplicationJSON = useCallback(
    (applicationJSON: ApplicationJSON, rerender = true) => {
      applicationJSONRef.current = applicationJSON;
      if (rerender) {
        forceRefresh({});
      }
    },
    []
  );

  const setApplicationLayout = useCallback(
    (layout: LayoutJSON, rerender = true) => {
      setApplicationJSON(
        {
          ...applicationJSONRef.current,
          applicationLayout: layout,
        },
        rerender
      );
    },
    [setApplicationJSON]
  );

  const setApplicationSettings = useCallback(
    (settings: ApplicationSettings) => {
      setApplicationJSON(
        {
          ...applicationJSONRef.current,
          settings: {
            ...applicationJSONRef.current.settings,
            ...settings,
          },
        },
        false
      );
    },
    [setApplicationJSON]
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
      .loadApplicationJSON()
      .then((applicationJSON: ApplicationJSON) => {
        setApplicationJSON(applicationJSON);
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
  }, [notify, setApplicationJSON]);

  const saveApplicationLayout = useCallback(
    (layout: LayoutJSON) => {
      setApplicationLayout(layout, false);
      getPersistenceManager().saveApplicationJSON(applicationJSONRef.current);
    },
    [setApplicationLayout]
  );

  const saveLayout = useCallback(
    (metadata: LayoutMetadataDto) => {
      const layoutToSave = resolveJSONPath(
        applicationJSONRef.current.applicationLayout,
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

  const saveApplicationSettings = useCallback(
    (
      settings: ApplicationSettings | ApplicationSetting,
      key?: keyof ApplicationSettings
    ) => {
      const { settings: applicationSettings } = applicationJSONRef.current;
      if (key) {
        setApplicationSettings({
          ...applicationSettings,
          [key]: settings,
        });
      } else {
        setApplicationSettings(settings as ApplicationSettings);
      }
      getPersistenceManager().saveApplicationJSON(applicationJSONRef.current);
    },
    [setApplicationSettings]
  );

  const getApplicationSettings = useCallback(
    (key?: keyof ApplicationSettings) => {
      const { settings } = applicationJSONRef.current;
      return key ? settings?.[key] : settings;
    },
    []
  );

  const loadLayoutById = useCallback(
    (id: string) => {
      getPersistenceManager()
        .loadLayout(id)
        .then((layoutJson) => {
          const { applicationLayout: currentLayout } = applicationJSONRef.current;
          setApplicationLayout({
            ...currentLayout,
            children: (currentLayout.children || []).concat(layoutJson),
            props: {
              ...currentLayout.props,
              active: currentLayout.children?.length ?? 0,
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
        getApplicationSettings,
        layoutMetadata,
        saveLayout,
        applicationJson: applicationJSONRef.current,
        saveApplicationLayout,
        saveApplicationSettings,
        loadLayoutById,
      }}
    >
      {props.children}
    </LayoutManagementContext.Provider>
  );
};

export const useLayoutManager = () => useContext(LayoutManagementContext);
