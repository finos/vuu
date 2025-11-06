import type { TableRowSelectHandler } from "@vuu-ui/vuu-table-types";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import {
  GridLayout,
  GridLayoutChangeHandler,
  GridLayoutItem,
  GridLayoutProvider,
} from "@heswell/grid-layout";
import { SaltProvider, Text } from "@salt-ds/core";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getTargetTreeNode,
  keyFromPath,
  loadTheme,
  pathFromKey,
} from "../shared-utils";
import { ContentToolbar } from "./ContentToolbar";
import { IFrame } from "./iframe";
import { ShowcaseProvider } from "./ShowcaseProvider";
import { TreeNavPanel } from "./tree-nav/TreeNavPanel";

import "./ShowcaseShell.css";

export interface AppProps {
  treeSource: TreeSourceNode[];
}

export const ShowcaseShell = ({ treeSource }: AppProps) => {
  const navigate = useNavigate();
  const initialIsDataConsumer = useMemo(() => {
    const url = new URL(document.location.href);
    const treeNode = getTargetTreeNode(url, treeSource, false) as any;
    return (
      (treeNode && treeNode.nodeData.tags?.includes("data-consumer")) ?? false
    );
  }, [treeSource]);
  const [themeReady, setThemeReady] = useState(false);
  const [dataConsumer, setDataConsumer] = useState(initialIsDataConsumer);

  useEffect(() => {
    loadTheme("vuu-theme").then(() => {
      setThemeReady(true);
    });
  }, []);

  // // TODO cache source in localStorage
  const { pathname } = useLocation();
  const handleSelect: TableRowSelectHandler = (row) => {
    if (row) {
      const path = pathFromKey(row.key);
      setDataConsumer(row.data.nodeData?.tags?.includes("data-consumer"));
      navigate(path);
    }
  };

  const handleGridLayoutChanged = useCallback<GridLayoutChangeHandler>(
    (/*gridId, gridLayoutDescriptor*/) => {
      // TODO
    },
    [],
  );

  return themeReady ? (
    <SaltProvider density="high" theme="vuu-theme" mode="light">
      <ShowcaseProvider isDataConsumer={dataConsumer}>
        <GridLayoutProvider>
          <GridLayout
            colsAndRows={{
              cols: ["200px", "1fr"],
              rows: ["48px", "40px", "1fr"],
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
                gridArea: "2/1/4/2",
              }}
            >
              <TreeNavPanel
                className="ShowcaseNav"
                autoSelectRowKey={keyFromPath(pathname)}
                onSelect={handleSelect}
                resizeable
                source={treeSource}
                style={{ flexGrow: 0, flexShrink: 0, flexBasis: 200 }}
              />
            </GridLayoutItem>

            {/* ------ Content Toolbar -------*/}
            <GridLayoutItem
              id="app-toolbar"
              resizeable="h"
              style={{ gridArea: "2/2/3/3" }}
            >
              <ContentToolbar />
            </GridLayoutItem>

            {/* ------ Content Container -------*/}
            <GridLayoutItem
              id="ContentContainer"
              style={{ gridArea: "3/2/4/3" }}
              title="Showcase Content"
            >
              <div
                className={`ShowcaseContent`}
                style={{
                  flex: "1 1 auto",
                  position: "relative",
                }}
              >
                <IFrame />
              </div>
            </GridLayoutItem>
          </GridLayout>
        </GridLayoutProvider>
      </ShowcaseProvider>
    </SaltProvider>
  ) : null;
};
