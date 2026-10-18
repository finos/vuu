import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { isDocumentDescriptor } from "../../shared-utils";
import { IFrame } from "../iframe";
import { useShowcaseContext } from "../ShowcaseProvider";
import type { NavNodeData } from "../tree-nav/nav-tree";
import { getParentNode, routeOf } from "./example-model";
import { ComparePanel } from "./ComparePanel";
import { ExampleHeader } from "./ExampleHeader";
import { type ExampleTab, ExampleTabPanel, ExampleTabs } from "./ExampleTabs";
import { PreviewBar } from "./PreviewBar";
import { PreviewCanvas } from "./PreviewCanvas";
import { SourceDock, useSourceDock } from "./SourceDock";
import { SourceView } from "./SourceView";
import {
  type PreviewState,
  standaloneUrl,
  writePreviewParams,
} from "./preview-state";
import { usePreviewSource } from "./usePreviewSource";
import { ExampleDropOverlay } from "../workspace/ExampleDropOverlay";
import { isWorkspaceExample } from "../workspace/workspace-model";

import "./ExamplePage.css";

const classBase = "ShowcaseExamplePage";

export type ExampleTabId = "preview" | "compare" | "source" | "docs";

export const isDataConsumer = (nodeData?: NavNodeData) =>
  nodeData?.tags?.includes("data-consumer") ?? false;

export interface ExamplePageProps {
  treeNode: TreeSourceNode<NavNodeData>;
  treeSource: TreeSourceNode<NavNodeData>[];
}

const useSelectedTab = <T extends string>(tabs: ExampleTab<T>[]) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get("tab");
  const selected = tabs.find((tab) => tab.id === param)?.id ?? tabs[0].id;
  const setSelected = useCallback(
    (tab: T, changes?: Partial<PreviewState>) =>
      setSearchParams(
        (params) => {
          const next = changes
            ? writePreviewParams(params, changes)
            : new URLSearchParams(params);
          if (tab === tabs[0].id) {
            next.delete("tab");
          } else {
            next.set("tab", tab);
          }
          return next;
        },
        { replace: true },
      ),
    [setSearchParams, tabs],
  );
  return [selected, setSelected] as const;
};

/** Mounted on first selection, then kept mounted, so iframes don't reload */
const useVisited = (selected: string, pathname: string) => {
  const [visited, setVisited] = useState(() => new Set([selected]));
  useEffect(() => setVisited(new Set()), [pathname]);
  useEffect(() => {
    setVisited((current) =>
      current.has(selected) ? current : new Set(current).add(selected),
    );
  }, [selected]);
  return (tab: string) => tab === selected || visited.has(tab);
};

export const ExamplePage = ({ treeNode, treeSource }: ExamplePageProps) => {
  const { pathname } = useLocation();
  const { preview: previewState, setPreview } = useShowcaseContext();
  const { preview, reload, reloadKey, src } = usePreviewSource();

  const docNode = useMemo(() => {
    const parent = getParentNode(pathname, treeSource);
    return isDocumentDescriptor(parent?.nodeData) ? parent : undefined;
  }, [pathname, treeSource]);

  const tabs = useMemo(() => {
    const tabs: ExampleTab<ExampleTabId>[] = [
      { id: "preview", label: "Preview" },
      { id: "compare", label: "Compare" },
      { id: "source", label: "Source" },
    ];
    if (docNode) {
      tabs.push({ id: "docs", label: "Docs" });
    }
    return tabs;
  }, [docNode]);

  const [selectedTab, setSelectedTab] = useSelectedTab(tabs);
  const isMounted = useVisited(selectedTab, pathname);
  const sourceDock = useSourceDock();

  const panelProps = (tab: ExampleTabId) => ({
    className: `${classBase}-panel`,
    value: tab,
  });

  return (
    <div className={classBase}>
      <ExampleHeader treeNode={treeNode} treeSource={treeSource} />
      <ExampleTabs onChange={setSelectedTab} tabs={tabs} value={selectedTab}>
        <ExampleTabPanel {...panelProps("preview")}>
          <PreviewBar
            dataConsumer={isDataConsumer(treeNode.nodeData)}
            onReload={reload}
            onToggleSourceDock={sourceDock.toggle}
            sourceDockOpen={sourceDock.open}
            standaloneHref={src}
            viewportControls
          />
          <PreviewCanvas
            density={preview.density}
            key={reloadKey}
            overlay={
              isWorkspaceExample(treeNode.nodeData) ? (
                <ExampleDropOverlay
                  target={{ path: routeOf(treeNode), title: treeNode.label }}
                />
              ) : null
            }
            src={src}
            title={treeNode.label}
            viewport={preview.vp}
          />
          {sourceDock.open ? (
            <SourceDock
              height={sourceDock.height}
              nodeData={treeNode.nodeData ?? {}}
              onResize={sourceDock.setHeight}
            />
          ) : null}
        </ExampleTabPanel>
        {/* not kept mounted, leaving the tab releases all its iframes */}
        {selectedTab === "compare" ? (
          <ExampleTabPanel {...panelProps("compare")}>
            <ComparePanel
              onPromote={(state) => {
                setPreview(state);
                // setSearchParams updates don't chain, so the tab change must
                // also carry the preview params
                setSelectedTab("preview", state);
              }}
              title={treeNode.label}
            />
          </ExampleTabPanel>
        ) : null}
        {selectedTab === "source" ? (
          <ExampleTabPanel {...panelProps("source")}>
            <SourceView nodeData={treeNode.nodeData ?? {}} />
          </ExampleTabPanel>
        ) : null}
        {docNode && isMounted("docs") ? (
          <ExampleTabPanel {...panelProps("docs")}>
            <div className={`${classBase}-docFrame`}>
              <IFrame
                src={standaloneUrl(routeOf(docNode), previewState)}
                title={docNode.label}
              />
            </div>
          </ExampleTabPanel>
        ) : null}
      </ExampleTabs>
    </div>
  );
};
