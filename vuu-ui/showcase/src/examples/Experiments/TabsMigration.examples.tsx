import {
  ExitTabEditModeHandler,
  Tab,
  TabBar,
  TabListNext,
  TabNext,
  TabNextTrigger,
  TabsNext,
  Tabstrip,
  TabstripProps,
} from "@finos/vuu-ui-controls";
import { moveItem } from "@finos/vuu-utils";
import { SyntheticEvent, useCallback, useMemo, useRef, useState } from "react";
import {
  DragDropProviderNext,
  DropHandler,
  FlexboxLayout,
  LayoutProvider,
} from "@finos/vuu-layout";
import { TabState } from "@finos/vuu-layout/src/grid-layout/GridLayoutStackedtem";

import "./TabsMigration.examples.css";

const SPLITTER_WIDTH = 3;

const TabstripTemplate = ({
  activeTabIndex: activeTabIndexProp = 0,
  allowAddTab = false,
  allowCloseTab = false,
  allowDragDrop = false,
  allowRenameTab = false,
  animateSelectionThumb = true,
  tabs: tabsProp = ["Home", "Transactions", "Loans", "Checks", "Liquidity"],
  variant = "secondary",
  width = 700,
}: Partial<TabstripProps> & { tabs?: string[]; width?: number }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(activeTabIndexProp);
  const [tabs, setTabs] = useState(tabsProp);
  const activeTabRef = useRef<string>(tabs[activeTabIndex]);

  const handleChange = useCallback(
    (_: SyntheticEvent | null, value: string) => {
      setActiveTabIndex(tabs.indexOf(value));
      activeTabRef.current = value;
    },
    [tabs],
  );

  const handleAddTab = useCallback(() => {
    const count = tabs.length;
    setTabs((state) => state.concat(`Tab ${state.length + 1}`));
    setActiveTabIndex(count);
  }, [tabs.length]);

  const handleCloseTab = useCallback(
    (tabIndex: number, newActiveTabIndex: number) => {
      setTabs((state) => state.filter((_, i) => i !== tabIndex));
      setActiveTabIndex(newActiveTabIndex);
    },
    [],
  );

  const handleTabLabelChanged = useCallback<ExitTabEditModeHandler>(
    (originalValue, newValue) => {
      setTabs((currentTabs) =>
        currentTabs.map((name) => (name === originalValue ? newValue : name)),
      );
    },
    [],
  );

  const handleMoveTab = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newTabs = moveItem(tabs, fromIndex, toIndex);
      setTabs(newTabs);
      setActiveTabIndex(newTabs.indexOf(activeTabRef.current));
    },
    [tabs],
  );
  const handleDrop = useCallback<DropHandler>(
    ({ dragSource, toIndex }) => {
      const newTabs = moveItem(tabs, dragSource.index, toIndex);
      setTabs(newTabs);
      setActiveTabIndex(newTabs.indexOf(activeTabRef.current));
    },
    [tabs],
  );

  return (
    <LayoutProvider>
      <FlexboxLayout
        style={{ height: 200, width: width + SPLITTER_WIDTH }}
        path=""
      >
        <FlexboxLayout resizeable style={{ flexDirection: "column", flex: 1 }}>
          <div style={{ flex: 1 }}>
            <Tabstrip
              activeTabIndex={activeTabIndex}
              allowAddTab={allowAddTab}
              allowCloseTab={allowCloseTab}
              allowDragDrop={allowDragDrop}
              allowRenameTab={allowRenameTab}
              animateSelectionThumb={animateSelectionThumb}
              onActiveChange={setActiveTabIndex}
              onAddTab={handleAddTab}
              onCloseTab={handleCloseTab}
              onExitEditMode={handleTabLabelChanged}
              onMoveTab={handleMoveTab}
              variant={variant}
            >
              {tabs.map((label, i) => (
                <Tab
                  index={i}
                  key={label}
                  label={label}
                  ariaControls={
                    i === activeTabIndex ? `ts-panel-${i}` : undefined
                  }
                />
              ))}
            </Tabstrip>
          </div>
          <div style={{ flex: 1 }}>
            <DragDropProviderNext
              dragSources={{ tabs1: { dropTargets: ["tabs1"] } }}
              onDrop={handleDrop}
            >
              <TabsNext onChange={handleChange} value={tabs[activeTabIndex]}>
                <TabBar divider>
                  <TabListNext
                    appearance="transparent"
                    className="vuuDragContainer"
                    id="tabs1"
                  >
                    {tabs.map((label, index) => (
                      <TabNext
                        className="vuuDraggableItem"
                        data-index={index}
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
            </DragDropProviderNext>
          </div>
        </FlexboxLayout>
        <div data-resizeable></div>
      </FlexboxLayout>
    </LayoutProvider>
  );
};

export const TabstripDragDrop = ({
  activeTabIndex: activeTabIndexProp = 4,
  width = 700,
}) => (
  <TabstripTemplate
    activeTabIndex={activeTabIndexProp}
    allowDragDrop
    width={width}
  />
);

const TabstripTemplate2 = () => {
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

  const handleDrop = useCallback<DropHandler>(
    ({ dragSource, toId, toIndex }) => {
      if (dragSource.id === "tabs1" && toId === "tabs1") {
        setTabState((state) => ({
          ...state,
          tabs1: state.tabs1.moveTab(dragSource.index, toIndex),
        }));
      } else if (dragSource.id === "tabs2" && toId === "tabs2") {
        setTabState((state) => ({
          ...state,
          tabs2: state.tabs2.moveTab(dragSource.index, toIndex),
        }));
      } else {
        if (dragSource.id === "tabs1") {
          setTabState(({ tabs1, tabs2 }) => {
            const newTabs1 = tabs1.tabs.slice();
            const newTabs2 = tabs2.tabs.slice();
            const [movedTab] = newTabs1.splice(dragSource.index, 1);
            newTabs2.splice(toIndex, 0, movedTab);
            return {
              tabs1: tabs1.setTabs(newTabs1),
              tabs2: tabs2.setTabs(newTabs2),
            };
          });
        } else {
          setTabState(({ tabs1, tabs2 }) => {
            const newTabs1 = tabs1.tabs.slice();
            const newTabs2 = tabs2.tabs.slice();
            const [movedTab] = newTabs2.splice(dragSource.index, 1);
            newTabs1.splice(toIndex, 0, movedTab);
            return {
              tabs1: tabs1.setTabs(newTabs1),
              tabs2: tabs2.setTabs(newTabs2),
            };
          });
        }
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

export const TabstripDragDropBetweenTabs = () => <TabstripTemplate2 />;
