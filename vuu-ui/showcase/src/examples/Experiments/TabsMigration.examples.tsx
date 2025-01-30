import {
  TabBar,
  TabListNext,
  TabNext,
  TabNextTrigger,
  TabsNext,
} from "@salt-ds/lab";
import { SyntheticEvent, useCallback, useMemo, useState } from "react";
import {
  DragDropProviderNext,
  type DropHandler,
  FlexboxLayout,
  LayoutProvider,
} from "@finos/vuu-layout";

import "./TabsMigration.examples.css";
import { TabbedComponentDragSource } from "@finos/vuu-layout/src/grid-layout/GridLayoutContext";

const SPLITTER_WIDTH = 3;

export class TabState {
  constructor(
    public active: number,
    public tabs: string[],
  ) {}
  get activeTab() {
    return this.tabs[this.active];
  }

  setActiveTab(value: string) {
    return new TabState(this.tabs.indexOf(value), this.tabs);
  }

  moveTab(fromIndex: number, position: "before" | "after", target: string) {
    const newTabs = this.tabs.slice();
    const [movedTab] = newTabs.splice(fromIndex, 1);
    const pos = newTabs.indexOf(target);
    if (position === "after") {
      newTabs.splice(pos + 1, 0, movedTab);
    } else {
      newTabs.splice(pos, 0, movedTab);
    }
    return this.setTabs(newTabs);
  }
  insertTab(tab: string, position: "before" | "after", target: string) {
    const newTabs = this.tabs.slice();
    const pos = newTabs.indexOf(target);
    if (position === "after") {
      newTabs.splice(pos + 1, 0, tab);
    } else {
      newTabs.splice(pos, 0, tab);
    }
    return this.setTabs(newTabs);
  }

  removeTab(index: number) {
    return this.setTabs(this.tabs.toSpliced(index, 1));
  }
  setTabs(tabs: string[]) {
    if (tabs.includes(this.activeTab)) {
      return new TabState(tabs.indexOf(this.activeTab), tabs);
    } else {
      const i = this.tabs.indexOf(this.activeTab);
      return new TabState(Math.min(tabs.length - 1, i), tabs);
    }
  }
}

const TabstripTemplate = () => {
  const initialState = useMemo<Record<string, TabState>>(
    () => ({
      tabs1: new TabState(0, [
        "Home 1",
        "Transactions 1",
        "Loans 1",
        "Checks 1",
        "Liquidity 1",
      ]),
      tabs2: new TabState(0, [
        "Home 2",
        "Transactions 2",
        "Loans 2",
        "Checks 2",
        "Liquidity 2",
      ]),
    }),
    [],
  );

  const [tabState, setTabState] =
    useState<Record<string, TabState>>(initialState);

  const handleDetachTab = useCallback((tabsId: string, tabIndex: number) => {
    console.log(`detach tab ${tabsId} [${tabIndex}]`);
    // if (tabsId in tabState) {
    //   setTabState((state) => ({
    //     ...state,
    //     [tabsId]: state[tabsId].removeTab(tabIndex),
    //   }));
    // }
  }, []);

  const handleChange1 = useCallback(
    (_: SyntheticEvent | null, value: string) =>
      setTabState((state) => ({
        ...state,
        tabs1: state.tabs1.setActiveTab(value),
      })),
    [],
  );

  const handleChange2 = useCallback(
    (_: SyntheticEvent | null, value: string) =>
      setTabState((state) => ({
        ...state,
        tabs2: state.tabs2.setActiveTab(value),
      })),
    [],
  );

  const handleDrop = useCallback<DropHandler<TabbedComponentDragSource>>(
    ({ dragSource, tabsId, dropPosition }) => {
      // if (sourceIsComponent(dragSource)) {
      console.log(
        `[TabsMigration.examples] handleDrop ${tabsId} ${dropPosition?.position} ${dropPosition?.target}`,
      );

      if (dropPosition && tabsId) {
        const { position, target } = dropPosition;

        setTabState(({ tabs1, tabs2 }) => {
          if (dragSource.tabsId === "tabs1" && tabsId === "tabs1") {
            return {
              tabs1: tabs1.moveTab(dragSource.tabIndex, position, target),
              tabs2,
            };
          } else if (dragSource.tabsId === "tabs2" && tabsId === "tabs2") {
            return {
              tabs1,
              tabs2: tabs2.moveTab(dragSource.tabIndex, position, target),
            };
          } else if (dragSource.tabsId === "tabs1" && tabsId === "tabs2") {
            const newTabs1 = tabs1.tabs.slice();
            const [movedTab] = newTabs1.splice(dragSource.tabIndex, 1);

            return {
              tabs1: tabs1.setTabs(newTabs1),
              tabs2: tabs2.insertTab(movedTab, position, target),
            };
          } else if (dragSource.tabsId === "tabs2" && tabsId === "tabs1") {
            const newTabs2 = tabs2.tabs.slice();
            const [movedTab] = newTabs2.splice(dragSource.tabIndex, 1);

            return {
              tabs1: tabs1.insertTab(movedTab, position, target),
              tabs2: tabs2.setTabs(newTabs2),
            };
          } else {
            throw Error();
          }
        });
      } else {
        throw Error(
          "[TabsMigration.examples] handleDrop missing required params",
        );
      }
    },
    [],
  );

  console.log(`
    tabs1: ${tabState.tabs1.tabs.join(",")}
    tabs2: ${tabState.tabs2.tabs.join(",")}
    active1: ${tabState.tabs1.activeTab}
    active2: ${tabState.tabs2.activeTab}
    `);

  return (
    <DragDropProviderNext
      dragSources={{
        tabs1: { dropTargets: ["tabs1", "tabs2"] },
        tabs2: { dropTargets: ["tabs1", "tabs2"] },
      }}
      onDrop={handleDrop}
      onDetachTab={handleDetachTab}
    >
      <LayoutProvider>
        <FlexboxLayout
          style={{ height: 200, width: 700 + SPLITTER_WIDTH }}
          path=""
        >
          <FlexboxLayout
            resizeable
            style={{ flexDirection: "column", flex: 1 }}
          >
            <div style={{ flex: 1 }}>
              <TabsNext
                onChange={handleChange1}
                value={tabState.tabs1.activeTab}
              >
                <TabBar divider>
                  <TabListNext
                    appearance="transparent"
                    className="vuuDragContainer"
                    id="tabs1"
                  >
                    {tabState.tabs1.tabs.map((label, index) => (
                      <TabNext
                        className="vuuDraggableItem"
                        data-index={index}
                        data-label={label}
                        data-grid-layout-item-id={label}
                        draggable
                        value={label}
                        key={label}
                      >
                        <TabNextTrigger>{label}</TabNextTrigger>
                      </TabNext>
                    ))}
                  </TabListNext>
                </TabBar>
              </TabsNext>
            </div>
            <div style={{ flex: 1 }}>
              <TabsNext
                onChange={handleChange2}
                value={tabState.tabs2.activeTab}
              >
                <TabBar divider>
                  <TabListNext
                    appearance="transparent"
                    className="vuuDragContainer"
                    id="tabs2"
                  >
                    {tabState.tabs2.tabs.map((label, index) => (
                      <TabNext
                        className="vuuDraggableItem"
                        data-index={index}
                        data-label={label}
                        draggable
                        value={label}
                        key={label}
                      >
                        <TabNextTrigger>{label}</TabNextTrigger>
                      </TabNext>
                    ))}
                  </TabListNext>
                </TabBar>
              </TabsNext>
            </div>
            <div
              style={{ background: "yellow", flex: 1 }}
              onDragEnter={() => console.log("drag enter")}
              onDragLeave={() => console.log("drag leave")}
              onDragOver={(e) => {
                e.preventDefault();
                console.log("drag over");
              }}
              onDrop={() => console.log("drop")}
            />
          </FlexboxLayout>
          <div data-resizeable></div>
        </FlexboxLayout>
      </LayoutProvider>
    </DragDropProviderNext>
  );
};

export const TabstripDragDropBetweenTabs = () => <TabstripTemplate />;
