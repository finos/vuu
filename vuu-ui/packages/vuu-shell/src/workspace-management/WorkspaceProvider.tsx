import { StackProps, isLayoutJSON, resolveJSONPath } from "@finos/vuu-layout";
import { useNotifications } from "@finos/vuu-popups";
import {
  LayoutMetadata,
  LayoutMetadataDto,
  VuuShellLocation,
  WorkspaceContext,
  logger,
  type ApplicationJSON,
  type ApplicationSetting,
  type ApplicationSettings,
  type LayoutJSON,
} from "@finos/vuu-utils";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePersistenceManager } from "../persistence-manager";
import {
  getWorkspaceWithLayoutJSON,
  loadingJSON,
} from "./defaultWorkspaceJSON";

const { info } = logger("useLayoutManager");

export type WorkspaceProps = Pick<
  WorkspaceProviderProps,
  "layoutJSON" | "workspaceJSON"
> &
  Pick<StackProps, "showTabs" | "TabstripProps"> & {
    layoutPlaceholderJSON?: LayoutJSON;
  };

export interface WorkspaceProviderProps {
  /**
   * props applied to the default workspace (Stack),
   * ignored if workspaceJSON is provided.
   */
  WorkspaceProps?: WorkspaceProps;

  children: JSX.Element | JSX.Element[];
  /**
   * layoutJSON defines the default layout to render on first load and until such time as
   * layout state has been persisted. After that, the persisted state will be rendered.
   */
  layoutJSON?: LayoutJSON;

  /**
   * layoutPlaceholderJSON defines the layout to render when a new workspace layout is created.
   */
  layoutPlaceholderJSON?: LayoutJSON;
  /**
   * The Vuu workspace is the container into which layouts are loaded. By default, it will be
   * a Tabbed Panel (Stack + Tabstrip), showing a tab per Layout.
   */
  workspaceJSON?: LayoutJSON;
}

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

const loadingApplicationJSON: ApplicationJSON = {
  workspaceJSON: loadingJSON,
};

/**
 * LayoutManagementProvider supplies an API for loading and saving layout documents.
 * Initial layout is automatically loaded on startup. Because this hook is responsible
 * only for loading and saving layouts, it only triggers a render when content is loaded.
 *
 * Initial layout displays a loading state
 * User may supply a default layout. This will not be displayed until call has been made to
 * persistenceManager to retrieve stored layout state. If no stored state is returned, the
 * default layout provided by user will be set as current state (and hence rendered). If no
 * default layout has been provided by user, the sysem default will be used (simple PlaceHolder)
 * If saved layout state has been returned, that will be set as current state (and rendered)
 *
 */
export const WorkspaceProvider = ({
  WorkspaceProps,
  layoutJSON,
  layoutPlaceholderJSON,
  workspaceJSON: customWorkspaceJSON,
  ...props
}: WorkspaceProviderProps) => {
  const [layoutMetadata, setLayoutMetadata] = useState<LayoutMetadata[]>([]);
  // TODO this default should probably be a loading state rather than the placeholder
  // It will be replaced as soon as the localStorage/remote layout is resolved
  const [, forceRefresh] = useState({});
  const notify = useNotifications();
  const persistenceManager = usePersistenceManager();
  const applicationJSONRef = useRef<ApplicationJSON>(loadingApplicationJSON);

  const setApplicationJSON = useCallback(
    (applicationJSON: ApplicationJSON, rerender = true) => {
      applicationJSONRef.current = applicationJSON;
      if (rerender) {
        forceRefresh({});
      }
    },
    []
  );

  const setWorkspaceJSON = useCallback(
    (workspaceJSON: LayoutJSON, rerender = true) => {
      setApplicationJSON(
        {
          ...applicationJSONRef.current,
          workspaceJSON,
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
    //TODO this does not need to be done ahead of time
    persistenceManager
      ?.loadMetadata()
      .then((metadata) => {
        setLayoutMetadata(metadata);
      })
      .catch((error: Error) => {
        notify({
          type: "error",
          header: "Failed to Load Layouts",
          body: "Could not load list of available layouts",
        });
        console.error("Error occurred while retrieving metadata", error);
      });

    persistenceManager
      ?.loadApplicationJSON()
      .then((applicationJSON?: ApplicationJSON) => {
        if (applicationJSON) {
          info?.("applicationJSON loaded successfully");
          setApplicationJSON(applicationJSON);
        } else {
          // No applicationJSON has been saved yet. Construct our
          // initial applicationJSON from user configuration and
          // default values.
          const workspaceJSON = getWorkspaceWithLayoutJSON(
            customWorkspaceJSON,
            layoutJSON,
            WorkspaceProps
          );
          info?.(`applicationJSON not found, getting defaultWorkspaceJSON,
            ${JSON.stringify(workspaceJSON, null, 2)}
            `);
          setApplicationJSON({
            workspaceJSON,
          });
        }
      })
      .catch((error: Error) => {
        notify({
          type: "error",
          header: "Failed to Load Layout",
          body: "Could not load your latest view",
        });
        console.error(
          "Error occurred while retrieving application layout",
          error
        );
      });
  }, [
    WorkspaceProps,
    customWorkspaceJSON,
    layoutJSON,
    notify,
    persistenceManager,
    setApplicationJSON,
  ]);

  const saveApplicationLayout = useCallback(
    (layout: LayoutJSON) => {
      if (isLayoutJSON(layout)) {
        setWorkspaceJSON(layout, false);
        persistenceManager?.saveApplicationJSON(applicationJSONRef.current);
      } else {
        console.error("Tried to save invalid application layout", layout);
      }
    },
    [persistenceManager, setWorkspaceJSON]
  );

  const saveLayout = useCallback(
    (metadata: LayoutMetadataDto) => {
      let layoutToSave: LayoutJSON | undefined;
      try {
        layoutToSave = resolveJSONPath(
          applicationJSONRef.current.workspaceJSON,
          `#${VuuShellLocation.Workspace}.ACTIVE_CHILD`
        );
      } catch (e) {
        // ignore, code below will handle
      }

      if (layoutToSave && isLayoutJSON(layoutToSave)) {
        persistenceManager
          ?.createLayout(metadata, ensureLayoutHasTitle(layoutToSave, metadata))
          .then((metadata) => {
            notify({
              type: "success",
              header: "Layout Saved Successfully",
              body: `${metadata.name} saved successfully`,
            });
            setLayoutMetadata((prev) => [...prev, metadata]);
          })
          .catch((error: Error) => {
            notify({
              type: "error",
              header: "Failed to Save Layout",
              body: `Failed to save layout ${metadata.name}`,
            });
            console.error("Error occurred while saving layout", error);
          });
      } else {
        console.error("Tried to save invalid layout", layoutToSave);
        notify({
          type: "error",
          header: "Failed to Save Layout",
          body: "Cannot save invalid layout",
        });
      }
    },
    [notify, persistenceManager]
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
      persistenceManager?.saveApplicationJSON(applicationJSONRef.current);
    },
    [persistenceManager, setApplicationSettings]
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
      persistenceManager
        ?.loadLayout(id)
        .then((layoutJson) => {
          const { workspaceJSON: currentLayout } = applicationJSONRef.current;
          setWorkspaceJSON({
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
            type: "error",
            header: "Failed to Load Layout",
            body: "Failed to load the requested layout",
          });
          console.error("Error occurred while loading layout", error);
        });
    },
    [notify, persistenceManager, setWorkspaceJSON]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        getApplicationSettings,
        layoutMetadata,
        layoutPlaceholderJSON,
        saveLayout,
        workspaceJSON: applicationJSONRef.current.workspaceJSON,
        saveApplicationLayout,
        saveApplicationSettings,
        loadLayoutById,
      }}
    >
      {props.children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  // The default Application JSON will be served if no LayoutManagementProvider
  const { workspaceJSON = getWorkspaceWithLayoutJSON(), ...contextProps } =
    useContext(WorkspaceContext);

  return {
    ...contextProps,
    workspaceJSON,
  };
};
