import type { TableRowSelectHandler } from "@vuu-ui/vuu-table-types";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import {
  GridLayout,
  GridLayoutChangeHandler,
  GridLayoutItem,
  GridLayoutProvider,
} from "@vuu-ui/grid-layout";
import { SaltProviderNext, Text } from "@salt-ds/core";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getDefaultHostMode,
  getTargetTreeNode,
  type HostMode,
  isComponentDescriptor,
  loadTheme,
} from "../shared-utils";
import { ShowcaseContent } from "./ShowcaseContent";
import { ShowcaseProvider } from "./ShowcaseProvider";
import {
  buildNavTree,
  navKeyFromPath,
  pathFromNavKey,
} from "./tree-nav/nav-tree";
import { TreeNavPanel } from "./tree-nav/TreeNavPanel";

import "./ShowcaseShell.css";

export interface AppProps {
  treeSource: TreeSourceNode[];
}

export const ShowcaseShell = ({ treeSource }: AppProps) => {
  const navigate = useNavigate();
  const initialNodeData = useMemo(() => {
    const url = new URL(document.location.href);
    return getTargetTreeNode(url, treeSource, false)?.nodeData;
  }, [treeSource]);
  const navTree = useMemo(() => buildNavTree(treeSource), [treeSource]);
  const [themeReady, setThemeReady] = useState(false);
  const [nodeData, setNodeData] = useState<unknown>(initialNodeData);
  const [hostMode, setHostMode] = useState<HostMode>(() =>
    getDefaultHostMode(initialNodeData),
  );
  const isComponent = isComponentDescriptor(nodeData);
  const dataConsumer =
    isComponent && (nodeData.tags?.includes("data-consumer") ?? false);

  useEffect(() => {
    loadTheme("vuu-theme").then(() => {
      setThemeReady(true);
    });
  }, []);

  // // TODO cache source in localStorage
  const { pathname } = useLocation();
  const handleSelect: TableRowSelectHandler = (dataRow) => {
    if (dataRow) {
      const path = pathFromNavKey(dataRow.key);
      if (path !== undefined) {
        setNodeData(dataRow.nodeData);
        setHostMode(getDefaultHostMode(dataRow.nodeData));
        navigate(path);
      }
    }
  };

  const handleGridLayoutChanged = useCallback<GridLayoutChangeHandler>((
    /*gridId, gridLayoutDescriptor*/
  ) => {
    // TODO
  }, []);

  return themeReady ? (
    <SaltProviderNext
      accent="purple"
      density="high"
      corner="rounded"
      theme="vuu-theme"
      mode="light"
    >
      <ShowcaseProvider
        hostMode={isComponent ? hostMode : undefined}
        isDataConsumer={dataConsumer}
        onChangeHostMode={setHostMode}
      >
        <GridLayoutProvider>
          <GridLayout
            colsAndRows={{
              cols: ["200px", "1fr"],
              rows: ["48px", "1fr"],
            }}
            full-page
            id="ShowcaseShell"
            onChange={handleGridLayoutChanged}
          >
            {/* ------ App Header -------*/}
            <GridLayoutItem
              id="app-header"
              style={{
                gridArea: "1/1/2/3",
              }}
            >
              <div
                className="vuuToolbarProxy ShowcaseToolbar"
                style={{ height: 30 }}
              >
                <Text styleAs="h3">Vuu Showcase</Text>
              </div>
            </GridLayoutItem>

            {/* ------ Left Nav -------*/}
            <GridLayoutItem
              id="palette"
              resizeable="hv"
              style={{
                gridArea: "2/1/3/2",
              }}
            >
              <TreeNavPanel
                className="ShowcaseNav"
                autoSelectRowKey={navKeyFromPath(pathname)}
                onSelect={handleSelect}
                resizeable
                source={navTree}
                style={{ flexGrow: 0, flexShrink: 0, flexBasis: 200 }}
              />
            </GridLayoutItem>

            {/* ------ Content Container -------*/}
            <GridLayoutItem
              id="ContentContainer"
              resizeable="h"
              style={{ gridArea: "2/2/3/3" }}
              title="Showcase Content"
            >
              <ShowcaseContent />
            </GridLayoutItem>
          </GridLayout>
        </GridLayoutProvider>
      </ShowcaseProvider>
    </SaltProviderNext>
  ) : null;
};
