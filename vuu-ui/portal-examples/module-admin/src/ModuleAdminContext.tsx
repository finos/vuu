import type {
  ManagedModule,
  ModuleConfig,
} from "@heswell/module-admin/contracts";
import { useModal } from "@vuu-ui/core";
import { NotificationType, useNotifications } from "@vuu-ui/vuu-notifications";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useBeforeUnload,
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  type ModuleActions,
  ModuleActionsContext,
} from "./components/ModuleActions";
import {
  DeleteModuleDialog,
  DisableModuleDialog,
} from "./components/ModuleDialogs";
import { errorMessage } from "./data/errors";
import {
  type GroupBy,
  type ModuleKpis,
  type ModuleView,
  type SortBy,
  type StatusFilter,
  groupModules,
  matchesSearch,
  matchesStatus,
  moduleKpis,
  sortModules,
  toConfig,
  toModuleViews,
} from "./data/module-model";
import type { ModuleAdminClient } from "./data/module-admin-rpc";
import { useModuleAdminData } from "./data/useModuleAdminData";
import { type RemoteChecks, useRemoteChecks } from "./data/useRemoteChecks";

export type ViewMode = "cards" | "table";

/** How the Modules page is filtered, grouped and sorted. */
export interface ListPrefs {
  filter: string;
  groupBy: GroupBy;
  sortBy: SortBy;
  status: StatusFilter;
  view: ViewMode;
}

export const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "enabled",
  "disabled",
  "attention",
];

export const isStatusFilter = (value: unknown): value is StatusFilter =>
  STATUS_FILTERS.includes(value as StatusFilter);

/** Absolute paths for the pages of Module Admin. */
export interface ModulePaths {
  base: string;
  overview: (search?: string) => string;
  modules: (status?: StatusFilter) => string;
  module: (name: string) => string;
  edit: (name: string) => string;
  newModule: (from?: string) => string;
  menu: string;
}

export const modulePaths = (base: string): ModulePaths => ({
  base,
  edit: (name) => `${base}/modules/${encodeURIComponent(name)}/edit`,
  menu: `${base}/menu`,
  module: (name) => `${base}/modules/${encodeURIComponent(name)}`,
  modules: (status) =>
    status && status !== "all"
      ? `${base}/modules?status=${status}`
      : `${base}/modules`,
  newModule: (from) =>
    from
      ? `${base}/modules/new?from=${encodeURIComponent(from)}`
      : `${base}/modules/new`,
  overview: (search) =>
    search
      ? `${base}/overview?${new URLSearchParams({ search })}`
      : `${base}/overview`,
});

/**
 * The path Module Admin is mounted at. The portal mounts a remote module at
 * `${path}/*`, so the base is the location without the splat.
 */
export const useModuleBase = () => {
  const { pathname } = useLocation();
  const splat = useParams()["*"] ?? "";
  const depth = splat.split("/").filter(Boolean).length;
  const segments = pathname.split("/").filter(Boolean);
  const base = segments.slice(0, segments.length - depth).join("/");
  return base ? `/${base}` : "";
};

/** Prefill for duplicating a module: name, route and scope must be unique. */
export const duplicateConfig = (module: ModuleView): ModuleConfig => {
  const config = toConfig(module);
  return {
    ...config,
    enabled: true,
    name: `${config.name}-copy`,
    path: config.path ? `${config.path}-copy` : "",
    title: `${config.title} (copy)`,
    accessRole: module.accessRole,
  };
};

type Dialog = { kind: "disable" | "delete"; id: number } | undefined;

export interface ModuleAdminState {
  checkAll: () => Promise<void>;
  client: ModuleAdminClient;
  createModule: (config: ModuleConfig) => Promise<boolean>;
  error?: string;
  kpis: ModuleKpis;
  listPrefs: ListPrefs;
  loading: boolean;
  /** Modules as published by module discovery. */
  modules: ManagedModule[];
  paths: ModulePaths;
  remoteChecks: RemoteChecks;
  /** Marks the current page as having unsaved edits. */
  setEditing: (editing: boolean) => void;
  setListPrefs: (changes: Partial<ListPrefs>) => void;
  updateModule: (
    module: ModuleView,
    changes: Partial<ModuleConfig>,
    expectedVersion: number,
  ) => Promise<boolean>;
  /** Modules enriched with issues, parent, children and remote status. */
  views: ModuleView[];
}

const ModuleAdminContext = createContext<ModuleAdminState | undefined>(
  undefined,
);

export const useModuleAdmin = () => {
  const context = useContext(ModuleAdminContext);
  if (!context) throw new Error("useModuleAdmin needs a ModuleAdminProvider");
  return context;
};

/** Modules matching the list preferences, in display order. */
export const listModules = (
  views: readonly ModuleView[],
  { filter, groupBy, sortBy, status }: ListPrefs,
) =>
  groupModules(
    sortModules(
      views.filter(
        (module) =>
          matchesSearch(module, filter) && matchesStatus(module, status),
      ),
      sortBy,
    ),
    groupBy,
  );

const useUnsavedChangesGuard = () => {
  // A ref, so a save can clear it and navigate in the same event.
  const editing = useRef(false);
  const [, setEditingState] = useState(false);
  const setEditing = useCallback((value: boolean) => {
    editing.current = value;
    setEditingState(value);
  }, []);

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        editing.current && currentLocation.pathname !== nextLocation.pathname,
      [],
    ),
  );
  const { closePrompt, showPrompt } = useModal();
  const { proceed, reset, state } = blocker;

  useEffect(() => {
    if (state !== "blocked") return;
    showPrompt(
      <p>
        Save or discard your changes before leaving this module. Choose Cancel
        to keep editing.
      </p>,
      {
        cancelButtonLabel: "Cancel",
        confirmButtonLabel: "Discard changes",
        onCancel: reset,
        onClose: reset,
        onConfirm: () => {
          setEditing(false);
          proceed();
        },
        title: "Unsaved changes",
      },
    );
    return closePrompt;
  }, [closePrompt, proceed, reset, setEditing, showPrompt, state]);

  useBeforeUnload((event) => {
    if (editing.current) {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  return setEditing;
};

export const ModuleAdminProvider = ({
  base,
  children,
}: {
  base: string;
  children: ReactNode;
}) => {
  const { client, error, loading, modules } = useModuleAdminData();
  const remoteChecks = useRemoteChecks();
  const { showNotification } = useNotifications();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const setEditing = useUnsavedChangesGuard();
  const paths = useMemo(() => modulePaths(base), [base]);
  const [dialog, setDialog] = useState<Dialog>();
  const [listPrefs, setPrefs] = useState<ListPrefs>({
    filter: "",
    groupBy: "section",
    sortBy: "menu",
    status: "all",
    view: "cards",
  });
  const setListPrefs = useCallback(
    (changes: Partial<ListPrefs>) =>
      setPrefs((current) => ({ ...current, ...changes })),
    [],
  );

  const notify = useCallback(
    (status: "success" | "error", header: string, content?: string) =>
      showNotification({
        content: content ?? "",
        header,
        status,
        type: NotificationType.Toast,
      }),
    [showNotification],
  );

  const checkAll = useCallback(
    () => remoteChecks.check(modules.map(({ mfUrl }) => mfUrl)),
    [modules, remoteChecks],
  );

  // Check every remote once, when the modules first arrive.
  const checkedOnLoad = useRef(false);
  useEffect(() => {
    if (!checkedOnLoad.current && !loading && modules.length > 0) {
      checkedOnLoad.current = true;
      void checkAll();
    }
  }, [checkAll, loading, modules.length]);

  const views = useMemo(
    () => toModuleViews(modules, remoteChecks.manifests),
    [modules, remoteChecks.manifests],
  );
  const kpis = useMemo(() => moduleKpis(views), [views]);
  const dialogModule = views.find(({ id }) => id === dialog?.id);

  const setEnabled = useCallback(
    async (module: ModuleView, enabled: boolean) => {
      try {
        await client.setModuleEnabled(module.id, enabled);
        notify(
          "success",
          `${module.title} ${enabled ? "enabled" : "disabled"}`,
        );
      } catch (cause) {
        notify(
          "error",
          `Could not ${enabled ? "enable" : "disable"} ${module.title}`,
          errorMessage(cause),
        );
      }
    },
    [client, notify],
  );

  const actions = useMemo<ModuleActions>(
    () => ({
      checkRemote: (module) => remoteChecks.check([module.mfUrl]),
      delete: (module) => setDialog({ id: module.id, kind: "delete" }),
      duplicate: (module) => navigate(paths.newModule(module.name)),
      edit: (module) => navigate(paths.edit(module.name)),
      select: (module) => navigate(paths.module(module.name)),
      toggleEnabled: (module) =>
        module.enabled
          ? setDialog({ id: module.id, kind: "disable" })
          : void setEnabled(module, true),
    }),
    [navigate, paths, remoteChecks, setEnabled],
  );

  const createModule = useCallback(
    async (config: ModuleConfig) => {
      try {
        await client.createModule(config);
        notify(
          "success",
          `${config.title} registered`,
          config.enabled
            ? "Users holding its access role can now open it"
            : "Saved as disabled",
        );
        navigate(paths.module(config.name));
        return true;
      } catch (cause) {
        notify("error", "Could not create module", errorMessage(cause));
        return false;
      }
    },
    [client, navigate, notify, paths],
  );

  const updateModule = useCallback(
    async (
      module: ModuleView,
      changes: Partial<ModuleConfig>,
      expectedVersion: number,
    ) => {
      try {
        await client.updateModule(module.id, changes, expectedVersion);
        notify("success", `${module.title} updated`);
        return true;
      } catch (cause) {
        notify(
          "error",
          `Could not update ${module.title}`,
          errorMessage(cause),
        );
        return false;
      }
    },
    [client, notify],
  );

  const deleteModule = async (module: ModuleView, deleteChildren: boolean) => {
    setDialog(undefined);
    try {
      const { deletedIds } = await client.deleteModule(
        module.id,
        deleteChildren,
      );
      notify(
        "success",
        deletedIds.length > 1
          ? `${deletedIds.length} modules deleted`
          : `${module.title} deleted`,
      );
      const deletedPaths = views
        .filter(({ id }) => deletedIds.includes(id))
        .map(({ name }) => paths.module(name));
      if (
        deletedPaths.some(
          (path) => pathname === path || pathname.startsWith(`${path}/`),
        )
      ) {
        navigate(paths.modules(listPrefs.status));
      }
    } catch (cause) {
      notify("error", `Could not delete ${module.title}`, errorMessage(cause));
    }
  };

  const state: ModuleAdminState = {
    checkAll,
    client,
    createModule,
    error,
    kpis,
    listPrefs,
    loading,
    modules,
    paths,
    remoteChecks,
    setEditing,
    setListPrefs,
    updateModule,
    views,
  };

  return (
    <ModuleAdminContext.Provider value={state}>
      <ModuleActionsContext.Provider value={actions}>
        {children}
        {dialogModule && dialog?.kind === "disable" ? (
          <DisableModuleDialog
            module={dialogModule}
            onCancel={() => setDialog(undefined)}
            onConfirm={() => {
              setDialog(undefined);
              void setEnabled(dialogModule, false);
            }}
          />
        ) : null}
        {dialogModule && dialog?.kind === "delete" ? (
          <DeleteModuleDialog
            module={dialogModule}
            onCancel={() => setDialog(undefined)}
            onConfirm={(deleteChildren) =>
              deleteModule(dialogModule, deleteChildren)
            }
            onDisableInstead={() =>
              setDialog({ id: dialogModule.id, kind: "disable" })
            }
          />
        ) : null}
      </ModuleActionsContext.Provider>
    </ModuleAdminContext.Provider>
  );
};
