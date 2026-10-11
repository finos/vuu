import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { isDocumentDescriptor } from "../../shared-utils";
import { IFrame } from "../iframe";
import { useShowcaseContext } from "../ShowcaseProvider";
import type { NavNodeData } from "../tree-nav/nav-tree";
import { getParentNode, getRelated, routeOf } from "./example-model";
import { ComparePanel } from "./ComparePanel";
import { ExampleHeader } from "./ExampleHeader";
import { type ExampleTab, ExampleTabs, panelId, tabId } from "./ExampleTabs";
import { PreviewBar } from "./PreviewBar";
import { PreviewCanvas } from "./PreviewCanvas";
import { PropsPanel } from "./PropsPanel";
import { RelatedPanel } from "./RelatedPanel";
import { SourceDock, useSourceDock } from "./SourceDock";
import { SourceView } from "./SourceView";
import {
  type PreviewState,
  standaloneUrl,
  writePreviewParams,
} from "./preview-state";
import { useExampleProps, usePropsPanelOpen } from "./useExampleProps";
import { usePreviewSource } from "./usePreviewSource";

import "./ExamplePage.css";

const classBase = "ShowcaseExamplePage";

export type ExampleTabId =
  "preview" | "compare" | "source" | "docs" | "related";

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
  const idPrefix = useId();
  const { pathname } = useLocation();
  const { preview: previewState, setPreview } = useShowcaseContext();
  const { preview, reload, reloadKey, src } = usePreviewSource();

  const docNode = useMemo(() => {
    const parent = getParentNode(pathname, treeSource);
    return isDocumentDescriptor(parent?.nodeData) ? parent : undefined;
  }, [pathname, treeSource]);

  const related = useMemo(
    () => getRelated(pathname, treeSource),
    [pathname, treeSource],
  );
  const relatedCount = related.docs.length + related.siblings.length;

  const tabs = useMemo(() => {
    const tabs: ExampleTab<ExampleTabId>[] = [
      { id: "preview", label: "Preview" },
      { id: "compare", label: "Compare" },
      { id: "source", label: "Source" },
    ];
    if (docNode) {
      tabs.push({ id: "docs", label: "Docs" });
    }
    if (relatedCount > 0) {
      tabs.push({ count: relatedCount, id: "related", label: "Related" });
    }
    return tabs;
  }, [docNode, relatedCount]);

  const [selectedTab, setSelectedTab] = useSelectedTab(tabs);
  const isMounted = useVisited(selectedTab, pathname);
  const sourceDock = useSourceDock();
  const exampleProps = useExampleProps(reloadKey);
  // flagged at build time, so the panel is there before the example loads.
  // In dev, a declaration added since the server started is reported at load
  const hasProps =
    treeNode.nodeData?.props === true || exampleProps.defs !== undefined;
  const [propsPanelOpen, togglePropsPanel] = usePropsPanelOpen();

  const panelProps = (tab: ExampleTabId) => ({
    "aria-labelledby": tabId(idPrefix, tab),
    className: `${classBase}-panel`,
    hidden: tab !== selectedTab,
    id: panelId(idPrefix, tab),
    role: "tabpanel",
  });

  return (
    <div className={classBase}>
      <ExampleHeader treeNode={treeNode} treeSource={treeSource} />
      <ExampleTabs
        idPrefix={idPrefix}
        onChange={setSelectedTab}
        tabs={tabs}
        value={selectedTab}
      />
      <div {...panelProps("preview")}>
        <PreviewBar
          dataConsumer={isDataConsumer(treeNode.nodeData)}
          onReload={reload}
          onTogglePropsPanel={hasProps ? togglePropsPanel : undefined}
          onToggleSourceDock={sourceDock.toggle}
          propsPanelOpen={propsPanelOpen}
          sourceDockOpen={sourceDock.open}
          standaloneHref={src}
          viewportControls
        />
        <div className={`${classBase}-previewBody`}>
          <PreviewCanvas
            density={preview.density}
            key={reloadKey}
            src={src}
            title={treeNode.label}
            viewport={preview.vp}
          />
          {hasProps && propsPanelOpen ? (
            <PropsPanel
              componentName={treeNode.nodeData?.componentName ?? "Example"}
              defs={exampleProps.defs}
              log={exampleProps.log}
              onChange={exampleProps.setValue}
              onClearLog={exampleProps.clearLog}
              onReset={exampleProps.reset}
              values={exampleProps.values}
            />
          ) : null}
        </div>
        {sourceDock.open ? (
          <SourceDock
            height={sourceDock.height}
            nodeData={treeNode.nodeData ?? {}}
            onResize={sourceDock.setHeight}
          />
        ) : null}
      </div>
      {/* not kept mounted, leaving the tab releases all its iframes */}
      {selectedTab === "compare" ? (
        <div {...panelProps("compare")}>
          <ComparePanel
            onPromote={(state) => {
              setPreview(state);
              // setSearchParams updates don't chain, so the tab change must
              // also carry the preview params
              setSelectedTab("preview", state);
            }}
            title={treeNode.label}
          />
        </div>
      ) : null}
      {selectedTab === "related" ? (
        <div {...panelProps("related")}>
          <RelatedPanel
            docs={related.docs}
            fileLabel={getParentNode(pathname, treeSource)?.label}
            siblings={related.siblings}
          />
        </div>
      ) : null}
      {selectedTab === "source" ? (
        <div {...panelProps("source")}>
          <SourceView nodeData={treeNode.nodeData ?? {}} />
        </div>
      ) : null}
      {docNode && isMounted("docs") ? (
        <div {...panelProps("docs")}>
          <div className={`${classBase}-docFrame`}>
            <IFrame
              src={standaloneUrl(routeOf(docNode), previewState)}
              title={docNode.label}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};
