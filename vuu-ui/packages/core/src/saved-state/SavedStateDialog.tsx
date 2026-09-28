import {
  Banner,
  BannerContent,
  Button,
  Dialog,
  DialogActions,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
  Dropdown,
  FlexLayout,
  Input,
  Option,
  Spinner,
  StackLayout,
  StatusIndicator,
  Text,
  Tooltip,
  useId,
} from "@salt-ds/core";
import {
  CollapseAllIcon,
  ExpandAllIcon,
  InfoIcon,
  SearchIcon,
} from "@salt-ds/icons";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  type ReactElement,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DocumentSummary } from "../persistence/PersistenceBackend";
import { usePortalPersistence } from "../persistence/PersistenceContext";
import type {
  ClearResult,
  ClearSelection,
} from "../persistence/PortalPersistenceService";
import { ClearSavedStateConfirmation } from "./ClearSavedStateConfirmation";
import { formatList, plural } from "./saved-state-format";
import {
  ALL_APPLICATIONS,
  buildSavedStateModel,
  collectParentIds,
  describeSelection,
  filterSavedStateModel,
  formatSelectionSummary,
  fromTreeSelection,
  nodeId,
  pruneSelection,
  type SavedStateApplicationInfo,
  type SavedStateModel,
  summariseSelection,
  toClearSelection,
  toTreeSelection,
} from "./saved-state-model";
import { useOptionalSavedState } from "./SavedStateContext";
import { SavedStateTree } from "./SavedStateTree";
import type { SavedStateToastProps } from "./SavedStateToasts";

import savedStateDialogCss from "./SavedStateDialog.css";

const classBase = "vuuSavedStateDialog";

export interface SavedStateDialogProps {
  /** Registered applications, in navigation order (§9.3). */
  applications?: readonly SavedStateApplicationInfo[];
  /** Scopes the dialog to one application (§9.4). */
  initialApplicationKey?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  /** Announces and shows the outcome of clearing. Defaults to the shell's toasts. */
  onNotify?: (toast: SavedStateToastProps) => void;
  portalTitle?: string;
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; summaries: readonly DocumentSummary[]; now: Date }
  | { status: "error"; error: unknown };

type Confirmation = { clearAll: boolean } | undefined;

/** Parents to expand for an application: itself and its groups (§9.4). */
const applicationExpansion = (model: SavedStateModel, applicationKey: string) =>
  collectParentIds(
    model.applications
      .filter((application) => application.applicationKey === applicationKey)
      .map(({ node }) => node),
  ).filter((id) => JSON.parse(id)[0] !== "previous-versions");

const initialExpansion = (model: SavedStateModel, scope: string) => {
  if (scope !== ALL_APPLICATIONS) {
    return applicationExpansion(model, scope);
  }
  const expanded = model.applications.flatMap(
    ({ applicationKey, node, open }) =>
      open ? applicationExpansion(model, applicationKey) : [node.id],
  );
  if (model.unavailable) expanded.push(model.unavailable.id);
  return expanded;
};

const selectionWeight = (model: SavedStateModel, selection: ClearSelection) => {
  let items = 0;
  for (const item of selection) {
    if (item.unreadable) {
      items += 1;
    } else if (item.keys === undefined) {
      const doc = model.documents.get(
        nodeId("document", item.applicationKey, item.applicationVersion),
      );
      const leaf = model.leaves.get(
        nodeId("document", item.applicationKey, item.applicationVersion),
      );
      items += doc
        ? doc.entries.length + doc.notCarriedForward.length
        : (leaf?.weight ?? 1);
    } else {
      items += item.keys.length + (item.notCarriedForward?.length ?? 0);
    }
  }
  return items;
};

const titleFor = (model: SavedStateModel, applicationKey: string) =>
  model.applications.find((app) => app.applicationKey === applicationKey)
    ?.title ??
  [...model.leaves.values()].find(
    (leaf) => leaf.applicationKey === applicationKey,
  )?.applicationTitle ??
  applicationKey;

/** Describes the outcome of clearing (§9.7). */
export const describeClearResult = (
  model: SavedStateModel,
  selection: ClearSelection,
  result: ClearResult,
): SavedStateToastProps => {
  const failedKeys = new Set(
    result.failed.map(
      ({ ref }) => `${ref.applicationKey}\u0000${ref.applicationVersion}`,
    ),
  );
  const succeeded = selection.filter(
    (item) =>
      !failedKeys.has(`${item.applicationKey}\u0000${item.applicationVersion}`),
  );
  const items = selectionWeight(model, succeeded);
  const applications = new Set(succeeded.map((item) => item.applicationKey))
    .size;
  const reload =
    result.requiresReload.length > 0
      ? ` Reload to return ${formatList([
          ...new Set(
            result.requiresReload.map(({ applicationKey }) =>
              titleFor(model, applicationKey),
            ),
          ),
        ])} to its default view.`
      : "";

  if (result.failed.length > 0) {
    const failedTitles = [
      ...new Set(
        result.failed.map(({ ref }) => titleFor(model, ref.applicationKey)),
      ),
    ];
    return {
      status: "error",
      title:
        succeeded.length > 0
          ? "Some saved state couldn't be cleared"
          : "Saved state couldn't be cleared",
      body: `Saved state for ${formatList(failedTitles)} couldn't be cleared. It is still selected, so you can try again.${reload}`,
    };
  }
  return {
    status: "success",
    title: "Saved state cleared",
    body: `${plural(items, "item")} cleared from ${plural(applications, "application")}.${reload}`,
  };
};

/** Lists saved state and lets the user clear it (§9). */
export const SavedStateDialog = ({
  applications,
  initialApplicationKey,
  onNotify,
  onOpenChange,
  open,
  portalTitle,
}: SavedStateDialogProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-saved-state-dialog",
    css: savedStateDialogCss,
    window: targetWindow,
  });
  const service = usePortalPersistence();
  const savedState = useOptionalSavedState();
  const notify = onNotify ?? savedState?.notify;

  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [scope, setScope] = useState(initialApplicationKey ?? ALL_APPLICATIONS);
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<ReadonlySet<string>>(new Set());
  const [expanded, setExpanded] = useState<string[] | undefined>(undefined);
  const [searchExpanded, setSearchExpanded] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState<Confirmation>(undefined);
  const [clearing, setClearing] = useState(false);
  const [problems, setProblems] = useState(() => service.problems());
  const loadCount = useRef(0);

  const refresh = useCallback(() => {
    const count = ++loadCount.current;
    service.list().then(
      (summaries) => {
        if (count !== loadCount.current) return;
        setLoad({ status: "ready", summaries, now: new Date() });
        setProblems(service.problems());
      },
      (error: unknown) => {
        if (count !== loadCount.current) return;
        setLoad({ status: "error", error });
      },
    );
  }, [service]);

  useEffect(() => {
    if (!open) return;
    refresh();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = service.subscribe(() => {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(refresh, 50);
    });
    return () => {
      loadCount.current += 1;
      if (timer !== undefined) clearTimeout(timer);
      unsubscribe();
    };
  }, [open, refresh, service]);

  const model = useMemo(
    () =>
      buildSavedStateModel({
        applications,
        isOpen: (key, version) => service.isOpen(key, version),
        now: load.status === "ready" ? load.now : new Date(),
        portalTitle,
        summaries: load.status === "ready" ? load.summaries : [],
      }),
    [applications, load, portalTitle, service],
  );

  const currentSelection = pruneSelection(model, selection);
  const view = useMemo(
    () => filterSavedStateModel(model, { scope, search }),
    [model, scope, search],
  );

  // Expand once the first listing arrives.
  const expandedState = useMemo(() => {
    if (expanded !== undefined) return expanded;
    return load.status === "ready" ? initialExpansion(model, scope) : [];
  }, [expanded, load.status, model, scope]);
  const treeExpanded = search.trim() ? searchExpanded : expandedState;

  const treeSelected = useMemo(
    () => toTreeSelection(view.nodes, currentSelection),
    [currentSelection, view.nodes],
  );
  const summary = summariseSelection(model, currentSelection);

  const handleSelectionChange = useCallback(
    (_event: SyntheticEvent, selected: string[]) => {
      setSelection((current) =>
        fromTreeSelection(view.nodes, pruneSelection(model, current), selected),
      );
    },
    [model, view.nodes],
  );

  const handleExpandedChange = useCallback(
    (_event: SyntheticEvent, next: string[]) => {
      if (search.trim()) {
        setSearchExpanded(next);
      } else {
        setExpanded(next);
      }
    },
    [search],
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    setSearchExpanded(
      filterSavedStateModel(model, {
        scope,
        search: value,
      }).matchedAncestors.slice(),
    );
  };

  const handleScope = (_event: SyntheticEvent, [value]: string[]) => {
    const next = value ?? ALL_APPLICATIONS;
    setScope(next);
    if (next !== ALL_APPLICATIONS) {
      setExpanded([
        ...new Set([...expandedState, ...applicationExpansion(model, next)]),
      ]);
    }
    if (search.trim()) {
      setSearchExpanded(
        filterSavedStateModel(model, {
          scope: next,
          search,
        }).matchedAncestors.slice(),
      );
    }
  };

  const expandAll = () => {
    const all = collectParentIds(view.nodes);
    if (search.trim()) setSearchExpanded(all);
    else setExpanded(all);
  };
  const collapseAll = () => {
    if (search.trim()) setSearchExpanded([]);
    else setExpanded([]);
  };

  const clearSelection = useMemo(
    () => toClearSelection(model, currentSelection),
    [currentSelection, model],
  );
  const confirmationLines = useMemo(
    () => describeSelection(model, currentSelection),
    [currentSelection, model],
  );
  const openApplications = useMemo(() => {
    const titles = confirmation?.clearAll
      ? model.applications.filter(({ open }) => open).map(({ title }) => title)
      : confirmationLines.filter(({ open }) => open).map(({ title }) => title);
    return [...new Set(titles)];
  }, [confirmation, confirmationLines, model]);

  const runClear = async () => {
    const clearAll = confirmation?.clearAll ?? false;
    setConfirmation(undefined);
    setClearing(true);
    const selectionToClear: ClearSelection = clearAll
      ? [
          ...(load.status === "ready" ? load.summaries : []).map(
            ({ applicationKey, applicationVersion, unreadable }) => ({
              applicationKey,
              applicationVersion,
              ...(unreadable ? { unreadable } : {}),
            }),
          ),
        ]
      : clearSelection;
    let result: ClearResult;
    try {
      result = clearAll
        ? await service.clearAll()
        : await service.clear(selectionToClear);
    } catch (error) {
      result = {
        cleared: [],
        failed: selectionToClear.map((item) => ({
          ref: { ...item, user: service.user },
          error: error instanceof Error ? error : Error(String(error)),
        })),
        requiresReload: [],
      };
    }
    const toast = describeClearResult(model, selectionToClear, result);
    const reloadAction =
      result.requiresReload.length > 0
        ? {
            label: "Reload",
            onAction: () => (targetWindow ?? window).location.reload(),
          }
        : undefined;
    notify?.({ ...toast, action: reloadAction });

    // Keep only what failed, so the user can try again (§9.7).
    const failed = new Set(
      result.failed.map(
        ({ ref }) => `${ref.applicationKey}\u0000${ref.applicationVersion}`,
      ),
    );
    setSelection((current) => {
      if (failed.size === 0) return new Set();
      return new Set(
        [...current].filter((id) => {
          const leaf = model.leaves.get(id);
          if (!leaf) return false;
          const versions =
            leaf.kind === "removed"
              ? leaf.applicationVersions
              : [leaf.applicationVersion];
          return versions.some((version) =>
            failed.has(`${leaf.applicationKey}\u0000${version}`),
          );
        }),
      );
    });
    setClearing(false);
    refresh();
  };

  const quotaProblem = problems.some(
    ({ error }) => error.name === "PersistenceQuotaError",
  );
  const empty = load.status === "ready" && model.empty;
  const scopeOptions = [
    { key: ALL_APPLICATIONS, title: "All applications" },
    ...model.applications.map(({ applicationKey, title }) => ({
      key: applicationKey,
      title,
    })),
  ];
  if (!scopeOptions.some(({ key }) => key === scope)) {
    scopeOptions.push({
      key: scope,
      title:
        applications?.find(({ applicationKey }) => applicationKey === scope)
          ?.title ?? scope,
    });
  }
  const scopeTitle = (key: string) =>
    scopeOptions.find((option) => option.key === key)?.title ?? key;

  const showLabelId = useId();

  let body: ReactElement;
  if (load.status === "loading") {
    body = (
      <div className={`${classBase}-status`}>
        <Spinner aria-label="Loading saved state" size="medium" />
        <Text>Loading saved state</Text>
      </div>
    );
  } else if (load.status === "error") {
    body = (
      <div className={`${classBase}-status`} role="alert">
        <StatusIndicator size={2} status="error" />
        <Text styleAs="h3">Saved state couldn't be loaded</Text>
        <Button appearance="bordered" onClick={refresh} sentiment="neutral">
          Retry
        </Button>
      </div>
    );
  } else if (empty || view.nodes.length === 0) {
    body = (
      <div className={cx(`${classBase}-status`, `${classBase}-empty`)}>
        {search.trim() ? (
          <Text>No saved state matches "{search.trim()}"</Text>
        ) : (
          <>
            <StatusIndicator size={2} status="info" />
            <Text styleAs="h3">No saved state</Text>
            <Text>
              Applications save state, such as filters and sort order, as you
              use them. It will appear here.
            </Text>
          </>
        )}
      </div>
    );
  } else {
    body = (
      <div className={`${classBase}-treeContainer`}>
        <SavedStateTree
          expanded={treeExpanded}
          nodes={view.nodes}
          onExpandedChange={handleExpandedChange}
          onSelectionChange={handleSelectionChange}
          selected={treeSelected}
        />
      </div>
    );
  }

  return (
    <Dialog
      className={classBase}
      disableDismiss={confirmation !== undefined}
      onOpenChange={onOpenChange}
      open={open}
      size="large"
    >
      <DialogHeader
        description="Applications remember how you left them, such as filters, sort order and column layout, and restore it when you next open them."
        header="Saved state"
      />
      <DialogContent className={`${classBase}-content`}>
        <StackLayout className={`${classBase}-stack`} gap={1.5}>
          <FlexLayout align="center" className={`${classBase}-note`} gap={0.75}>
            <InfoIcon aria-hidden />
            <Text color="secondary">
              Clearing saved state returns an application to its default view.
              It doesn't change your Settings.
            </Text>
          </FlexLayout>
          {problems.length > 0 ? (
            <Banner status="warning">
              <BannerContent>
                Some state couldn't be saved.
                {quotaProblem
                  ? " Browser storage is full. Clearing saved state you no longer need will free up space."
                  : null}
              </BannerContent>
            </Banner>
          ) : null}
          {empty || load.status !== "ready" ? null : (
            <FlexLayout
              align="center"
              className={`${classBase}-filterBar`}
              gap={1}
            >
              <Input
                bordered
                className={`${classBase}-search`}
                inputProps={{ "aria-label": "Find saved state" }}
                onChange={(event) =>
                  handleSearch((event.target as HTMLInputElement).value)
                }
                placeholder="Find saved state"
                startAdornment={<SearchIcon aria-hidden />}
                value={search}
              />
              <Text
                as="label"
                className={`${classBase}-scopeLabel`}
                color="secondary"
                id={showLabelId}
              >
                Show
              </Text>
              <Dropdown<string>
                aria-labelledby={showLabelId}
                bordered
                className={`${classBase}-scope`}
                onSelectionChange={handleScope}
                selected={[scope]}
                value={scopeTitle(scope)}
                valueToString={scopeTitle}
              >
                {scopeOptions.map(({ key, title }) => (
                  <Option key={key} value={key}>
                    {title}
                  </Option>
                ))}
              </Dropdown>
              <FlexLayout className={`${classBase}-treeActions`} gap={0.5}>
                <Tooltip content="Expand all">
                  <Button
                    appearance="transparent"
                    aria-label="Expand all"
                    onClick={expandAll}
                    sentiment="neutral"
                  >
                    <ExpandAllIcon aria-hidden />
                  </Button>
                </Tooltip>
                <Tooltip content="Collapse all">
                  <Button
                    appearance="transparent"
                    aria-label="Collapse all"
                    onClick={collapseAll}
                    sentiment="neutral"
                  >
                    <CollapseAllIcon aria-hidden />
                  </Button>
                </Tooltip>
              </FlexLayout>
            </FlexLayout>
          )}
          {body}
        </StackLayout>
      </DialogContent>
      <DialogActions className={`${classBase}-actions`}>
        <Button
          appearance="transparent"
          className={`${classBase}-clearAll`}
          disabled={clearing || load.status !== "ready" || model.empty}
          onClick={() => setConfirmation({ clearAll: true })}
          sentiment="negative"
        >
          Clear all saved state…
        </Button>
        <Text
          aria-live="polite"
          className={`${classBase}-summary`}
          color="secondary"
        >
          {formatSelectionSummary(summary)}
        </Text>
        <Button
          appearance="bordered"
          onClick={() => onOpenChange(false)}
          sentiment="neutral"
        >
          Close
        </Button>
        <Button
          appearance="solid"
          disabled={clearing || summary.items === 0}
          onClick={() => setConfirmation({ clearAll: false })}
          sentiment="negative"
        >
          Clear selected…
        </Button>
      </DialogActions>
      <DialogCloseButton onClick={() => onOpenChange(false)} />
      {confirmation ? (
        <ClearSavedStateConfirmation
          clearAll={confirmation.clearAll}
          lines={confirmationLines}
          onCancel={() => setConfirmation(undefined)}
          onConfirm={runClear}
          open
          openApplications={openApplications}
        />
      ) : null}
    </Dialog>
  );
};
