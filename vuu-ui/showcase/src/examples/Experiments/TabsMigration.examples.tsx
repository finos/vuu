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
import { FlexboxLayout, LayoutProvider } from "@finos/vuu-layout";

import "./TabsMigration.examples.css";
import { TabState } from "@finos/vuu-layout/src/grid-layout/GridLayoutStackedtem";

const SPLITTER_WIDTH = 3;

let displaySequence = 1;

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
            <TabsNext onChange={handleChange} value={tabs[activeTabIndex]}>
              <TabBar divider>
                <TabListNext
                  appearance="transparent"
                  allowDragDrop
                  onMoveTab={handleMoveTab}
                >
                  {tabs.map((label, index) => (
                    <TabNext
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
TabstripDragDrop.displaySequence = displaySequence++;

const TabstripTemplate2 = () => {
  const [ts1, ts2] = useMemo(
    () => [
      new TabState(0, [
        "Home 1",
        "Transactions 1",
        "Loans 1",
        "Checks 1",
        "Liquidity 1",
      ]),
      new TabState(0, [
        "Home 2",
        "Transactions 2",
        "Loans 2",
        "Checks 2",
        "Liquidity 2",
      ]),
    ],
    [],
  );

  const [tabState1, setTabState1] = useState<TabState>(ts1);
  const [tabState2, setTabState2] = useState<TabState>(ts2);

  const handleChange1 = useCallback(
    (_: SyntheticEvent | null, value: string) => {
      setTabState1((state) => state.setActiveTab(value));
    },
    [],
  );

  const handleChange2 = useCallback(
    (_: SyntheticEvent | null, value: string) => {
      setTabState2((state) => state.setActiveTab(value));
    },
    [],
  );

  const handleMoveTab1 = useCallback(
    (fromIndex: number, toIndex: number) =>
      setTabState1((state) => state.moveTab(fromIndex, toIndex)),
    [],
  );

  const handleMoveTab2 = useCallback(
    (fromIndex: number, toIndex: number) =>
      setTabState2((state) => state.moveTab(fromIndex, toIndex)),
    [],
  );

  return (
    <LayoutProvider>
      <FlexboxLayout
        style={{ height: 200, width: 700 + SPLITTER_WIDTH }}
        path=""
      >
        <FlexboxLayout resizeable style={{ flexDirection: "column", flex: 1 }}>
          <div style={{ flex: 1 }}>
            <TabsNext
              onChange={handleChange1}
              value={tabState1.tabs[tabState1.active]}
            >
              <TabBar divider>
                <TabListNext
                  appearance="transparent"
                  allowDragDrop
                  onMoveTab={handleMoveTab1}
                >
                  {tabState1.tabs.map((label, index) => (
                    <TabNext
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
              value={tabState2.tabs[tabState2.active]}
            >
              <TabBar divider>
                <TabListNext
                  appearance="transparent"
                  allowDragDrop
                  onMoveTab={handleMoveTab2}
                >
                  {tabState2.tabs.map((label, index) => (
                    <TabNext
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
  );
};

export const TabstripDragDropBetweenTabs = () => <TabstripTemplate2 />;
TabstripDragDropBetweenTabs.displaySequence = displaySequence++;
