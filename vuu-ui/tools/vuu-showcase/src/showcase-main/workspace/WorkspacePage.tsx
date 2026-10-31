import { Button, Input } from "@salt-ds/core";
import {
  GridLayout,
  GridLayoutProvider,
  type SerializedGridLayoutChangeHandler,
} from "@heswell/grid-layout";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  type DragEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { RouteLink } from "../chrome/RouteLink";
import {
  type ExampleTab,
  ExampleTabPanel,
  ExampleTabs,
} from "../example/ExampleTabs";
import { PreviewBar } from "../example/PreviewBar";
import { useRecent } from "../tree-nav/nav-store";
import type { NavNodeData } from "../tree-nav/nav-tree";
import { ExamplePicker } from "./ExamplePicker";
import {
  copyWorkspaceLink,
  deleteWorkspace,
  duplicateWorkspace,
} from "./workspace-actions";
import { useExampleDrag, useExampleDragSource } from "./workspace-drag";
import {
  collectWorkspaceExamples,
  type WorkspaceExample,
} from "./workspace-examples";
import {
  fromSerializedLayout,
  toSerializedLayout,
  workspaceGridId,
} from "./workspace-grid";
import {
  exampleCountLabel,
  type Workspace,
  workspaceIdFromPath,
} from "./workspace-model";
import { useWorkspace, workspaceStore } from "./workspace-store";
import { WorkspacePageContext } from "./WorkspacePageContext";
import { LAYOUT_SOURCE, WorkspaceSource } from "./WorkspaceSource";
// registers the panel component, before GridLayout restores a layout
import "./WorkspacePanel";

import "../example/ExamplePage.css";
import "./WorkspacePage.css";

const classBase = "ShowcaseWorkspacePage";
const MAX_SUGGESTIONS = 4;

type WorkspaceTabId = "layout" | "source";

const GRID_OPTIONS = { newChildItem: { header: false } };

export interface WorkspacePageProps {
  treeSource: TreeSourceNode<NavNodeData>[];
}

const WorkspaceName = ({ workspace }: { workspace: Workspace }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(workspace.name);
  const startEditing = () => {
    setValue(workspace.name);
    setEditing(true);
  };
  const handleKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === "Enter") {
      workspaceStore.rename(workspace.id, value);
      setEditing(false);
    } else if (evt.key === "Escape") {
      evt.stopPropagation();
      setEditing(false);
    }
  };
  return editing ? (
    <div className={`${classBase}-nameEditor`}>
      <Input
        className={`${classBase}-nameInput`}
        inputProps={{
          "aria-label": "Workspace name",
          autoFocus: true,
          onBlur: () => {
            workspaceStore.rename(workspace.id, value);
            setEditing(false);
          },
          onFocus: (evt) => evt.target.select(),
          onKeyDown: handleKeyDown,
        }}
        onChange={(evt) => setValue(evt.target.value)}
        value={value}
      />
      <span className={`${classBase}-hint`}>Enter to save · Esc to cancel</span>
    </div>
  ) : (
    <div className="ShowcaseExampleHeader-titleRow">
      <h1 className="ShowcaseExampleHeader-title">{workspace.name}</h1>
      <Button
        appearance="transparent"
        aria-label="Rename workspace"
        className={`${classBase}-rename`}
        onClick={startEditing}
        title="Rename"
      >
        <ChromeIcon name="pencil" size={14} />
      </Button>
    </div>
  );
};

const WorkspaceHeader = ({ workspace }: { workspace: Workspace }) => {
  const navigate = useNavigate();
  const count = workspace.panels.length;
  return (
    <header className="ShowcaseExampleHeader">
      <div className="ShowcaseExampleHeader-main">
        <nav
          aria-label="Breadcrumb"
          className="ShowcaseExampleHeader-breadcrumb"
        >
          <ChromeIcon name="layout" size={14} />
          <span className="ShowcaseExampleHeader-crumb">Workspaces</span>
          <ChromeIcon name="chevron-right" size={12} />
          <span className="ShowcaseExampleHeader-crumb">{workspace.name}</span>
        </nav>
        <WorkspaceName key={workspace.id} workspace={workspace} />
        <div className={`${classBase}-meta`}>
          <span>{count === 0 ? "Empty" : exampleCountLabel(count)}</span>
          <span aria-hidden>·</span>
          <span className={`${classBase}-saved`}>
            <ChromeIcon name="check" size={13} />
            Saved locally
          </span>
        </div>
      </div>
      <div className="ShowcaseExampleHeader-actions">
        <Button
          appearance="bordered"
          onClick={() => duplicateWorkspace(workspace.id, navigate)}
        >
          <ChromeIcon name="copy" />
          Duplicate
        </Button>
        <Button
          appearance="bordered"
          onClick={() => copyWorkspaceLink(workspace.id)}
        >
          <ChromeIcon name="link" />
          Copy link
        </Button>
        <Button
          appearance="bordered"
          aria-label="Delete workspace"
          className="ShowcaseExampleHeader-iconButton"
          onClick={() => deleteWorkspace(workspace.id, navigate)}
          title="Delete workspace"
        >
          <ChromeIcon name="trash" />
        </Button>
      </div>
    </header>
  );
};

const SuggestionCard = ({
  example,
  onAdd,
}: {
  example: WorkspaceExample;
  onAdd: () => void;
}) => {
  const dragProps = useExampleDragSource({
    path: example.path,
    title: example.title,
  });
  return (
    <div className={`${classBase}-suggestion`} {...dragProps}>
      <ChromeIcon name="grip" size={14} />
      <span className={`${classBase}-suggestionText`}>
        <span className={`${classBase}-suggestionTitle`}>{example.title}</span>
        <span className={`${classBase}-suggestionFolder`}>
          {example.folder}
        </span>
      </span>
      <Button
        appearance="transparent"
        aria-label={`Add ${example.title}`}
        onClick={onAdd}
        title="Add to workspace"
      >
        <ChromeIcon name="plus" />
      </Button>
    </div>
  );
};

const EmptyWorkspace = ({
  examples,
  onAdd,
  onOpenPicker,
}: {
  examples: WorkspaceExample[];
  onAdd: (example: WorkspaceExample) => void;
  onOpenPicker: () => void;
}) => {
  const exampleDrag = useExampleDrag();
  const [over, setOver] = useState(false);
  const recent = useRecent();
  const suggestions = useMemo(() => {
    const byPath = new Map(examples.map((example) => [example.path, example]));
    const recentExamples = recent
      .map((path) => byPath.get(path))
      .filter((example): example is WorkspaceExample => example !== undefined);
    return (recentExamples.length > 0 ? recentExamples : examples).slice(
      0,
      MAX_SUGGESTIONS,
    );
  }, [examples, recent]);

  const handleDragOver = (evt: DragEvent) => {
    if (exampleDrag) {
      evt.preventDefault();
      evt.dataTransfer.dropEffect = "copy";
      setOver(true);
    }
  };
  const handleDrop = (evt: DragEvent) => {
    setOver(false);
    if (exampleDrag) {
      evt.preventDefault();
      onAdd({ folder: "", ...exampleDrag });
    }
  };

  return (
    <div
      className={cx(`${classBase}-empty`, {
        [`${classBase}-empty-dragging`]: exampleDrag !== undefined,
        [`${classBase}-empty-over`]: over,
      })}
      onDragLeave={() => setOver(false)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className={`${classBase}-emptyIcon`}>
        <ChromeIcon name="layout" size={28} />
      </div>
      <h2 className={`${classBase}-emptyTitle`}>
        {exampleDrag
          ? "Drop to add to this workspace"
          : "This workspace is empty"}
      </h2>
      <p className={`${classBase}-emptyText`}>
        Drag examples from the sidebar and drop them here. Once there are
        panels, drag their headers to rearrange, split or stack them.
      </p>
      <Button appearance="solid" onClick={onOpenPicker} sentiment="accented">
        <ChromeIcon name="plus" />
        Add example…
      </Button>
      {suggestions.length > 0 ? (
        <section className={`${classBase}-suggestions`}>
          <h3 className={`${classBase}-suggestionsHeading`}>
            {recent.length > 0 ? "Recent examples" : "Examples"}
          </h3>
          <div className={`${classBase}-suggestionGrid`}>
            {suggestions.map((example) => (
              <SuggestionCard
                example={example}
                key={example.path}
                onAdd={() => onAdd(example)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};

const tabs = (workspace: Workspace): ExampleTab<WorkspaceTabId>[] => [
  { id: "layout", label: "Layout" },
  { count: workspace.panels.length + 1, id: "source", label: "Source" },
];

const WorkspaceView = ({
  treeSource,
  workspace,
}: {
  treeSource: TreeSourceNode<NavNodeData>[];
  workspace: Workspace;
}) => {
  const { id, preview, revision } = workspace;
  const [selectedTab, setSelectedTab] = useState<WorkspaceTabId>("layout");
  const [selectedSource, setSelectedSource] = useState(LAYOUT_SOURCE);
  const [maximisedItemId, setMaximisedItemId] = useState<string>();
  const [reloadCount, setReloadCount] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;

  const examples = useMemo(
    () => collectWorkspaceExamples(treeSource),
    [treeSource],
  );

  // The grid is re-created only when the layout is replaced (revision),
  // changes made within the grid are already reflected by it.
  const serializedLayout = useMemo(
    () => toSerializedLayout(workspaceRef.current),
    [id, revision],
  );

  const handleGridChange = useCallback<SerializedGridLayoutChangeHandler>(
    (serialized) => {
      const current = workspaceStore.get(id);
      const result = fromSerializedLayout(serialized, current?.panels);
      if (result) {
        workspaceStore.syncFromGrid(id, result.panels, result.layout);
      }
    },
    [id],
  );

  const addExample = useCallback(
    ({ path, title }: Pick<WorkspaceExample, "path" | "title">) => {
      setMaximisedItemId(undefined);
      workspaceStore.addExample(id, path, title);
    },
    [id],
  );

  const showSource = useCallback((examplePath: string) => {
    setSelectedSource(examplePath);
    setSelectedTab("source");
  }, []);

  useEffect(() => {
    if (maximisedItemId) {
      const restore = (evt: globalThis.KeyboardEvent) => {
        if (evt.key === "Escape") setMaximisedItemId(undefined);
      };
      window.addEventListener("keydown", restore);
      return () => window.removeEventListener("keydown", restore);
    }
  }, [maximisedItemId]);

  const pageContext = useMemo(
    () => ({
      maximisedItemId,
      preview,
      reloadCount,
      setMaximisedItemId,
      showSource,
      workspaceId: id,
    }),
    [id, maximisedItemId, preview, reloadCount, showSource],
  );

  const isEmpty = workspace.panels.length === 0;

  return (
    <WorkspacePageContext.Provider value={pageContext}>
      <div className={cx("ShowcaseExamplePage", classBase)}>
        <WorkspaceHeader workspace={workspace} />
        <ExampleTabs
          onChange={setSelectedTab}
          tabs={tabs(workspace)}
          value={selectedTab}
        >
          <ExampleTabPanel className="ShowcaseExamplePage-panel" value="layout">
            <PreviewBar
              endContent={
                <>
                  <Button
                    appearance="bordered"
                    onClick={() => setPickerOpen(true)}
                  >
                    <ChromeIcon name="plus" />
                    Add example
                  </Button>
                  <Button
                    appearance="transparent"
                    disabled={isEmpty}
                    onClick={() => {
                      setMaximisedItemId(undefined);
                      workspaceStore.resetLayout(id);
                    }}
                  >
                    <ChromeIcon name="refresh" />
                    Reset layout
                  </Button>
                  <span className="ShowcasePreviewBar-separator" />
                </>
              }
              onPreviewChange={(changes) =>
                workspaceStore.setPreview(id, changes)
              }
              onReload={() => setReloadCount((count) => count + 1)}
              preview={preview}
            />
            {isEmpty ? (
              <EmptyWorkspace
                examples={examples}
                onAdd={addExample}
                onOpenPicker={() => setPickerOpen(true)}
              />
            ) : (
              <div
                className={cx(`${classBase}-canvas`, {
                  [`${classBase}-canvas-maximised`]: maximisedItemId,
                })}
              >
                <GridLayoutProvider
                  onChange={handleGridChange}
                  options={GRID_OPTIONS}
                  serializedLayout={serializedLayout}
                >
                  <GridLayout
                    className={`${classBase}-grid`}
                    id={workspaceGridId(id)}
                    key={`${id}:${revision}`}
                  />
                </GridLayoutProvider>
                <div className={`${classBase}-status`}>
                  Workspace · {exampleCountLabel(workspace.panels.length)} ·{" "}
                  {preview.theme} {preview.mode} · {preview.density}
                </div>
              </div>
            )}
          </ExampleTabPanel>
          {selectedTab === "source" ? (
            <ExampleTabPanel
              className="ShowcaseExamplePage-panel"
              value="source"
            >
              <WorkspaceSource
                onSelect={setSelectedSource}
                selected={selectedSource}
                treeSource={treeSource}
                workspace={workspace}
              />
            </ExampleTabPanel>
          ) : null}
        </ExampleTabs>
        <ExamplePicker
          examples={examples}
          onClose={() => setPickerOpen(false)}
          onPick={addExample}
          open={pickerOpen}
        />
      </div>
    </WorkspacePageContext.Provider>
  );
};

/** A user's workspace, examples arranged in a GridLayout */
export const WorkspacePage = ({ treeSource }: WorkspacePageProps) => {
  const { pathname } = useLocation();
  const id = workspaceIdFromPath(pathname);
  const workspace = useWorkspace(id);
  if (workspace === undefined) {
    return (
      <div className={cx("ShowcaseExamplePage", classBase)}>
        <div className={`${classBase}-notFound`}>
          <h1 className="ShowcaseExampleHeader-title">Workspace not found</h1>
          <p>
            Workspaces are saved in this browser. This one may have been
            deleted, or saved in another browser.
          </p>
          <RouteLink path="/">Back to the showcase</RouteLink>
        </div>
      </div>
    );
  }
  return (
    <WorkspaceView
      key={workspace.id}
      treeSource={treeSource}
      workspace={workspace}
    />
  );
};
