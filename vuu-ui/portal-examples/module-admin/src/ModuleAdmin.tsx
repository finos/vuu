import type { ModuleConfig } from "@heswell/module-admin/contracts";
import {
  Banner,
  BannerContent,
  Button,
  Input,
  Spinner,
  Text,
} from "@salt-ds/core";
import {
  AddIcon,
  CloseIcon,
  LayersIcon,
  RefreshIcon,
  SearchIcon,
} from "@salt-ds/icons";
import {
  NotificationType,
  NotificationsProvider,
  useNotifications,
} from "@vuu-ui/vuu-notifications";
import cx from "clsx";
import { inputValue } from "./components/ModuleForm";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreateModulePage } from "./components/CreateModulePage";
import { EditModulePanel } from "./components/EditModulePanel";
import { EmptyState } from "./components/EmptyState";
import {
  type ModuleActions,
  ModuleActionsContext,
} from "./components/ModuleActions";
import { ModuleDetailsPanel } from "./components/ModuleDetailsPanel";
import {
  DeleteModuleDialog,
  DisableModuleDialog,
} from "./components/ModuleDialogs";
import { ModuleGrid } from "./components/ModuleGrid";
import { ModuleKpis } from "./components/ModuleKpis";
import { ModuleTableView } from "./components/ModuleTableView";
import { ModuleToolbar, type ViewMode } from "./components/ModuleToolbar";
import { MenuTreeView } from "./components/MenuTreeView";
import { errorMessage } from "./data/errors";
import {
  type GroupBy,
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
import { useModuleAdminData } from "./data/useModuleAdminData";
import { useRemoteChecks } from "./data/useRemoteChecks";
import "./themeFallbacks.css";
import "./ModuleAdmin.css";

const classBase = "vuuModuleAdmin";

type Page =
  | { kind: "overview" }
  | { kind: "create"; initial?: ModuleConfig; sourceTitle?: string };

type Panel = { kind: "details" | "edit"; id: number } | undefined;
type Dialog = { kind: "disable" | "delete"; id: number } | undefined;

const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "enabled",
  "disabled",
  "attention",
];

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

const ModuleAdminApp = () => {
  const { client, error, loading, modules } = useModuleAdminData();
  const remoteChecks = useRemoteChecks();
  const { showNotification } = useNotifications();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [sortBy, setSortBy] = useState<SortBy>("menu");
  const [view, setView] = useState<ViewMode>("cards");
  const [page, setPage] = useState<Page>({ kind: "overview" });
  const [panel, setPanel] = useState<Panel>();
  const [dialog, setDialog] = useState<Dialog>();

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
  const byId = useCallback(
    (id?: number) => views.find((module) => module.id === id),
    [views],
  );
  const counts = useMemo(
    () =>
      Object.fromEntries(
        STATUS_FILTERS.map((status) => [
          status,
          views.filter(
            (module) =>
              matchesSearch(module, search) && matchesStatus(module, status),
          ).length,
        ]),
      ) as Record<StatusFilter, number>,
    [search, views],
  );
  const visible = useMemo(
    () =>
      sortModules(
        views.filter(
          (module) =>
            matchesSearch(module, search) && matchesStatus(module, filter),
        ),
        sortBy,
      ),
    [filter, search, sortBy, views],
  );
  const groups = useMemo(
    () => groupModules(visible, groupBy),
    [groupBy, visible],
  );
  const kpis = useMemo(() => moduleKpis(views), [views]);

  const panelModule = byId(panel?.id);
  const dialogModule = byId(dialog?.id);

  // A module deleted elsewhere closes its panel.
  useEffect(() => {
    if (panel && !loading && !panelModule) setPanel(undefined);
  }, [loading, panel, panelModule]);

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
      duplicate: (module) =>
        setPage({
          initial: duplicateConfig(module),
          kind: "create",
          sourceTitle: module.title,
        }),
      edit: (module) => setPanel({ id: module.id, kind: "edit" }),
      select: (module) => setPanel({ id: module.id, kind: "details" }),
      toggleEnabled: (module) =>
        module.enabled
          ? setDialog({ id: module.id, kind: "disable" })
          : void setEnabled(module, true),
    }),
    [remoteChecks, setEnabled],
  );

  const createModule = async (config: ModuleConfig) => {
    try {
      const { id } = await client.createModule(config);
      notify(
        "success",
        `${config.title} registered`,
        config.enabled
          ? "Users holding its access role can now open it"
          : "Saved as disabled",
      );
      setPage({ kind: "overview" });
      setPanel({ id, kind: "details" });
      return true;
    } catch (cause) {
      notify("error", "Could not create module", errorMessage(cause));
      return false;
    }
  };

  const updateModule = async (
    module: ModuleView,
    changes: Partial<ModuleConfig>,
    expectedVersion: number,
  ) => {
    try {
      await client.updateModule(module.id, changes, expectedVersion);
      notify("success", `${module.title} updated`);
      return true;
    } catch (cause) {
      notify("error", `Could not update ${module.title}`, errorMessage(cause));
      return false;
    }
  };

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
      if (panel && deletedIds.includes(panel.id)) setPanel(undefined);
    } catch (cause) {
      notify("error", `Could not delete ${module.title}`, errorMessage(cause));
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
  };
  const openCreate = () => setPage({ kind: "create" });

  const renderBody = () => {
    if (loading) {
      return (
        <div className={`${classBase}-loading`}>
          <Spinner aria-label="Loading modules" />
        </div>
      );
    }
    if (visible.length === 0) {
      return (
        <EmptyState
          filtered={views.length > 0}
          onClearFilters={clearFilters}
          onCreate={openCreate}
        />
      );
    }
    if (view === "tree")
      return <MenuTreeView modules={visible} selectedId={panel?.id} />;
    if (view === "table")
      return <ModuleTableView groups={groups} selectedId={panel?.id} />;
    return (
      <ModuleGrid
        groups={groups}
        onCreate={openCreate}
        selectedId={panel?.id}
      />
    );
  };

  return (
    <ModuleActionsContext.Provider value={actions}>
      <div className={classBase}>
        <header className={`${classBase}-appHeader`}>
          <span className={`${classBase}-brandIcon`}>
            <LayersIcon aria-hidden />
          </span>
          <strong>Module Admin</strong>
          <Text color="secondary">
            Remote modules registered with module discovery
          </Text>
          <span className={`${classBase}-spacer`} />
          {page.kind === "overview" ? (
            <Input
              aria-label="Search modules"
              bordered
              className={`${classBase}-search`}
              endAdornment={
                search ? (
                  <Button
                    appearance="transparent"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <CloseIcon aria-hidden />
                  </Button>
                ) : null
              }
              inputProps={{
                placeholder: "Search title, name, scope, route or role…",
              }}
              onChange={(event) => setSearch(inputValue(event))}
              startAdornment={<SearchIcon aria-hidden />}
              value={search}
            />
          ) : null}
        </header>
        {page.kind === "create" ? (
          <CreateModulePage
            initial={page.initial}
            key={page.sourceTitle ?? "new"}
            modules={modules}
            onCancel={() => setPage({ kind: "overview" })}
            onCreate={createModule}
            remoteChecks={remoteChecks}
            sourceTitle={page.sourceTitle}
          />
        ) : (
          <div
            className={cx(`${classBase}-workspace`, {
              [`${classBase}-withPanel`]: panelModule,
            })}
          >
            <main className={`${classBase}-main`}>
              <div className={`${classBase}-pageHeader`}>
                <div>
                  <h1 className={`${classBase}-title`}>Modules</h1>
                  <Text color="secondary">
                    Define new remote modules and maintain how existing modules
                    are loaded, connected, secured and placed in the portal
                    menu.
                  </Text>
                </div>
                <span className={`${classBase}-spacer`} />
                <Button
                  appearance="bordered"
                  disabled={modules.length === 0}
                  onClick={checkAll}
                >
                  <RefreshIcon aria-hidden /> Check all remotes
                </Button>
                <Button onClick={openCreate} sentiment="accented">
                  <AddIcon aria-hidden /> New module
                </Button>
              </div>
              {error ? (
                <Banner status="error">
                  <BannerContent>
                    Module discovery is unavailable: {error}
                  </BannerContent>
                </Banner>
              ) : null}
              {views.length > 0 ? (
                <>
                  <ModuleKpis
                    kpis={kpis}
                    onShowIssues={() => setFilter("attention")}
                  />
                  <ModuleToolbar
                    counts={counts}
                    filter={filter}
                    groupBy={groupBy}
                    lastCheckedAt={remoteChecks.lastCheckedAt}
                    onFilterChange={setFilter}
                    onGroupByChange={setGroupBy}
                    onSortByChange={setSortBy}
                    onViewChange={setView}
                    sortBy={sortBy}
                    view={view}
                  />
                </>
              ) : null}
              <div className={`${classBase}-body`}>{renderBody()}</div>
            </main>
            {panelModule && panel?.kind === "details" ? (
              <ModuleDetailsPanel
                module={panelModule}
                onClose={() => setPanel(undefined)}
              />
            ) : null}
            {panelModule && panel?.kind === "edit" ? (
              <EditModulePanel
                key={panelModule.id}
                module={panelModule}
                modules={modules}
                onClose={() =>
                  setPanel({ id: panelModule.id, kind: "details" })
                }
                onSave={(changes, expectedVersion) =>
                  updateModule(panelModule, changes, expectedVersion)
                }
                remoteChecks={remoteChecks}
              />
            ) : null}
          </div>
        )}
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
      </div>
    </ModuleActionsContext.Provider>
  );
};

const ModuleAdmin = () => (
  <NotificationsProvider>
    <ModuleAdminApp />
  </NotificationsProvider>
);

export default ModuleAdmin;
