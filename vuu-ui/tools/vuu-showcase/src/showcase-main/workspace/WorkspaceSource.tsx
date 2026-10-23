import { Button, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { type SyntheticEvent, useMemo, useState } from "react";
import { findTreeNode } from "../../shared-utils";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { SourceView } from "../example/SourceView";
import { toastStore } from "../toast";
import type { NavNodeData } from "../tree-nav/nav-tree";
import { toSerializedLayout } from "./workspace-grid";
import type { Workspace } from "./workspace-model";
import {
  type ExampleSourceInfo,
  workspaceComponentName,
  workspaceLayoutSource,
} from "./workspace-source";

const classBase = "ShowcaseWorkspaceSource";

/** the generated layout, rather than the source of an example */
export const LAYOUT_SOURCE = "layout";

type Format = "tsx" | "json";

export interface WorkspaceSourceProps {
  onSelect: (selected: string) => void;
  /** LAYOUT_SOURCE or the route of an example in the workspace */
  selected: string;
  treeSource: TreeSourceNode<NavNodeData>[];
  workspace: Workspace;
}

const nodeDataOf = (path: string, treeSource: TreeSourceNode<NavNodeData>[]) =>
  findTreeNode<NavNodeData>(path, treeSource)?.nodeData;

const sourceFile = (path = "") => path.replace(/^\.\//, "");

const download = (fileName: string, text: string, type: string) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};

const LayoutSource = ({
  treeSource,
  workspace,
}: Pick<WorkspaceSourceProps, "treeSource" | "workspace">) => {
  const [format, setFormat] = useState<Format>("tsx");
  const componentName = workspaceComponentName(workspace.name);
  const fileName = `${componentName}.${format}`;
  const text = useMemo(() => {
    if (format === "json") {
      return JSON.stringify(toSerializedLayout(workspace), null, 2);
    }
    return workspaceLayoutSource(workspace, (route) => {
      const nodeData = nodeDataOf(route, treeSource);
      return typeof nodeData?.componentName === "string" &&
        typeof nodeData.path === "string"
        ? ({
            componentName: nodeData.componentName,
            path: nodeData.path,
          } satisfies ExampleSourceInfo)
        : undefined;
    });
  }, [format, treeSource, workspace]);
  const lines = text.split("\n");

  return (
    <div className={cx("ShowcaseSource", `${classBase}-code`)}>
      <div className="ShowcaseSource-toolbar">
        <ToggleButtonGroup
          aria-label="Format"
          className="ShowcasePreviewBar-segmented"
          onChange={(e: SyntheticEvent<HTMLButtonElement>) =>
            setFormat(e.currentTarget.value as Format)
          }
          value={format}
        >
          <ToggleButton value="tsx">TSX</ToggleButton>
          <ToggleButton value="json">JSON</ToggleButton>
        </ToggleButtonGroup>
        <span className={`${classBase}-fileName`}>{fileName}</span>
        <div className="ShowcaseSource-actions">
          <Button
            appearance="bordered"
            onClick={() =>
              navigator.clipboard
                ?.writeText(text)
                .then(() =>
                  toastStore.show({ duration: 2500, message: "Copied" }),
                )
            }
          >
            <ChromeIcon name="copy" />
            Copy
          </Button>
          <Button
            appearance="bordered"
            onClick={() =>
              download(
                fileName,
                text,
                format === "json" ? "application/json" : "text/plain",
              )
            }
          >
            <ChromeIcon name="download" />
            Download
          </Button>
        </div>
      </div>
      <div className="ShowcaseSource-scroller">
        <pre className="ShowcaseSource-code">
          {lines.map((line, i) => (
            <div className="ShowcaseSource-line" key={i}>
              <span className="ShowcaseSource-lineNumber">{i + 1}</span>
              <span>{line}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};

/**
 * Source of a workspace, the generated layout and the source of each
 * example in the workspace.
 */
export const WorkspaceSource = ({
  onSelect,
  selected,
  treeSource,
  workspace,
}: WorkspaceSourceProps) => {
  const examples = useMemo(
    () =>
      workspace.panels
        .filter(
          // a workspace may contain the same example more than once
          (panel, i, panels) =>
            panels.findIndex(({ path }) => path === panel.path) === i,
        )
        .map((panel) => ({
          ...panel,
          nodeData: nodeDataOf(panel.path, treeSource),
        })),
    [treeSource, workspace.panels],
  );
  const selectedExample = examples.find(({ path }) => path === selected);
  const showLayout = selectedExample === undefined;

  return (
    <div className={classBase}>
      <nav aria-label="Workspace source" className={`${classBase}-list`}>
        <div className={`${classBase}-heading`}>Workspace</div>
        <button
          aria-current={showLayout || undefined}
          className={cx(`${classBase}-item`, {
            [`${classBase}-item-selected`]: showLayout,
          })}
          onClick={() => onSelect(LAYOUT_SOURCE)}
          type="button"
        >
          <ChromeIcon name="layout" size={15} />
          <span className={`${classBase}-itemText`}>
            <span className={`${classBase}-itemTitle`}>Layout</span>
            <span className={`${classBase}-itemFile`}>
              Generated · GridLayout
            </span>
          </span>
        </button>
        {examples.length > 0 ? (
          <div className={`${classBase}-heading`}>Examples</div>
        ) : null}
        {examples.map(({ id, nodeData, path, title }) => (
          <button
            aria-current={path === selected || undefined}
            className={cx(`${classBase}-item`, {
              [`${classBase}-item-selected`]: path === selected,
            })}
            key={id}
            onClick={() => onSelect(path)}
            title={sourceFile(nodeData?.path)}
            type="button"
          >
            <ChromeIcon name="docs" size={15} />
            <span className={`${classBase}-itemText`}>
              <span className={`${classBase}-itemTitle`}>{title}</span>
              <span className={`${classBase}-itemFile`}>
                {sourceFile(nodeData?.path) || "Example not found"}
              </span>
            </span>
          </button>
        ))}
        <p className={`${classBase}-note`}>
          The layout is generated from the current arrangement. Copy it into an
          example or app to reproduce this workspace.
        </p>
      </nav>
      {showLayout ? (
        <LayoutSource treeSource={treeSource} workspace={workspace} />
      ) : selectedExample.nodeData ? (
        <SourceView
          className={`${classBase}-code`}
          key={selectedExample.path}
          nodeData={selectedExample.nodeData}
        />
      ) : (
        <p className="ShowcaseSource-message">
          This example is no longer available.
        </p>
      )}
    </div>
  );
};
