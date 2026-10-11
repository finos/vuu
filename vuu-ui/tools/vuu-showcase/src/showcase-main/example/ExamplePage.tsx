import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { isDocumentDescriptor } from "../../shared-utils";
import { IFrame } from "../iframe";
import { useShowcaseContext } from "../ShowcaseProvider";
import type { NavNodeData } from "../tree-nav/nav-tree";
import { getParentNode, routeOf } from "./example-model";
import { ExampleHeader } from "./ExampleHeader";
import { type ExampleTab, ExampleTabs, panelId, tabId } from "./ExampleTabs";
import { PreviewBar } from "./PreviewBar";
import { PreviewCanvas } from "./PreviewCanvas";
import { standaloneUrl } from "./preview-state";
import { usePreviewSource } from "./usePreviewSource";

import "./ExamplePage.css";

const classBase = "ShowcaseExamplePage";

export type ExampleTabId = "preview" | "docs";

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
    (tab: T) =>
      setSearchParams(
        (params) => {
          const next = new URLSearchParams(params);
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
  const { preview: previewState } = useShowcaseContext();
  const { preview, reload, reloadKey, src } = usePreviewSource();

  const docNode = useMemo(() => {
    const parent = getParentNode(pathname, treeSource);
    return isDocumentDescriptor(parent?.nodeData) ? parent : undefined;
  }, [pathname, treeSource]);

  const tabs = useMemo(() => {
    const tabs: ExampleTab<ExampleTabId>[] = [
      { id: "preview", label: "Preview" },
    ];
    if (docNode) {
      tabs.push({ id: "docs", label: "Docs" });
    }
    return tabs;
  }, [docNode]);

  const [selectedTab, setSelectedTab] = useSelectedTab(tabs);
  const isMounted = useVisited(selectedTab, pathname);

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
          standaloneHref={src}
          viewportControls
        />
        <PreviewCanvas
          density={preview.density}
          key={reloadKey}
          src={src}
          title={treeNode.label}
          viewport={preview.vp}
        />
      </div>
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
