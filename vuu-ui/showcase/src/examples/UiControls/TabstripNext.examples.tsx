import {
  ExitTabEditModeHandler,
  Tab,
  TabstripNext,
  TabstripProps,
} from "@finos/vuu-ui-controls";
import { moveItem } from "@finos/vuu-utils";
import { useCallback, useState } from "react";
import { FlexboxLayout, LayoutProvider } from "@finos/vuu-layout";

import "./Tabstrip.examples.css";

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
  width = 1000,
}: Partial<TabstripProps> & { tabs?: string[]; width?: number }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(activeTabIndexProp);
  const [tabs, setTabs] = useState(tabsProp);

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
    []
  );

  const handleTabLabelChanged = useCallback<ExitTabEditModeHandler>(
    (originalValue, newValue) => {
      console.log(`tab label changed from '${originalValue}' to '${newValue}'`);
      setTabs((currentTabs) =>
        currentTabs.map((name) => (name === originalValue ? newValue : name))
      );
    },
    []
  );

  const handleMoveTab = useCallback((fromIndex: number, toIndex: number) => {
    setTabs((tabs) => moveItem(tabs, fromIndex, toIndex));
  }, []);

  return (
    <LayoutProvider>
      <FlexboxLayout
        style={{ height: 200, width: width + SPLITTER_WIDTH }}
        path=""
      >
        <div data-resizeable style={{ flex: 1 }}>
          <TabstripNext
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
          </TabstripNext>
        </div>
        <div data-resizeable style={{ position: "relative", width: 300 }}>
          <div
            id="dragImage"
            className="vuuTab"
            style={{
              position: "absolute",
            }}
          />
        </div>
      </FlexboxLayout>
    </LayoutProvider>
  );
};

export const DefaultTabstrip = ({
  activeTabIndex: activeTabIndexProp = 0,
  width = 500,
}) => <TabstripTemplate activeTabIndex={activeTabIndexProp} width={width} />;
DefaultTabstrip.displaySequence = displaySequence++;

export const OveflowingTabstrip = ({
  activeTabIndex: activeTabIndexProp = 0,
  width = 350,
}) => <TabstripTemplate activeTabIndex={activeTabIndexProp} width={width} />;
OveflowingTabstrip.displaySequence = displaySequence++;

export const OveflowingSelectedTab = ({
  activeTabIndex: activeTabIndexProp = 4,
  width = 350,
}) => <TabstripTemplate activeTabIndex={activeTabIndexProp} width={width} />;
OveflowingSelectedTab.displaySequence = displaySequence++;

export const TabstripAddTab = ({
  activeTabIndex: activeTabIndexProp = 4,
  width = 700,
}) => (
  <TabstripTemplate
    activeTabIndex={activeTabIndexProp}
    allowAddTab
    tabs={["Home"]}
    width={width}
  />
);
TabstripAddTab.displaySequence = displaySequence++;

export const TabstripRemoveTab = ({
  activeTabIndex: activeTabIndexProp = 4,
  width = 700,
}) => (
  <TabstripTemplate
    activeTabIndex={activeTabIndexProp}
    allowAddTab
    allowCloseTab
    width={width}
  />
);
TabstripRemoveTab.displaySequence = displaySequence++;

export const TabstripEditableLabels = ({
  activeTabIndex: activeTabIndexProp = 4,
  width = 700,
}) => (
  <TabstripTemplate
    activeTabIndex={activeTabIndexProp}
    allowRenameTab
    width={width}
  />
);
TabstripEditableLabels.displaySequence = displaySequence++;

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

export const TabstripVariations = () => {
  return (
    <div
      className="vuuToggleButtonExample"
      data-showcase-center
      style={{
        alignItems: "center",
        display: "grid",
        columnGap: 20,
        rowGap: 12,
        gridTemplateColumns: "auto 1fr",
        gridTemplateRows: "40px 40px 40px 40px 40px 40px 40px 40px 40px",
        justifyItems: "start",
      }}
    >
      <span>Primary</span>
      <TabstripTemplate variant="primary" />

      <span />
      <TabstripTemplate variant="primary" allowRenameTab allowCloseTab />

      <span />
      <TabstripTemplate variant="primary" allowAddTab />

      <span>Secondary</span>
      <TabstripTemplate animateSelectionThumb variant="secondary" />

      <span />
      <TabstripTemplate
        animateSelectionThumb
        variant="secondary"
        allowRenameTab
        allowCloseTab
      />

      <span />
      <TabstripTemplate animateSelectionThumb variant="secondary" allowAddTab />
    </div>
  );
};

TabstripVariations.displaySequence = displaySequence++;

export const TheFullMonty = ({
  activeTabIndex: activeTabIndexProp = 0,
  width = 700,
}) => (
  <TabstripTemplate
    activeTabIndex={activeTabIndexProp}
    allowAddTab
    allowCloseTab
    allowRenameTab
    allowDragDrop
    width={width}
  />
);
TheFullMonty.displaySequence = displaySequence++;

/*
const CloseTabWarningDialog = ({
  closedTab,
  onCancel,
  onClose,
  onConfirm,
  open = false,
}: {
  closedTab: TabDescriptor;
  onCancel: () => void;
  onClose: () => void;
  onConfirm: () => void;
  open?: boolean;
}) => (
  <Dialog open={open} status="warning" onClose={onClose}>
    <DialogTitle onClose={onClose}>Do you want to close this tab?</DialogTitle>
    <DialogContent>
      {`Closing the tab will cause any changes made to
                '${closedTab.label}' to be lost.`}
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Cancel</Button>
      <Button onClick={onConfirm} variant="cta">
        Close Tab
      </Button>
    </DialogActions>
  </Dialog>
);

export const TheFullMonty = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [tabs, setTabs] = useState([
    { label: "Home", closeable: false },
    { label: "Transactions" },
    { label: "Loans" },
    { label: "Checks" },
    { label: "Liquidity" },
  ]);
  const [closingTabIndex, setClosingTabIndex] = useState<number | undefined>(
    undefined
  );

  const handleAddTab = () => {
    const count = tabs.length;
    setTabs((state) => state.concat([{ label: `Tab ${state.length + 1}` }]));
    setSelectedTab(count);
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const onTabShouldClose = (index: number) => {
    setIsDialogOpen(true);
    setClosingTabIndex(index);
  };

  const onTabDidClose = () => {
    if (closingTabIndex !== undefined) {
      const newTabs = [...tabs];
      newTabs.splice(closingTabIndex, 1);

      let newSelectedTab = selectedTab;
      if (selectedTab > closingTabIndex || newTabs.length === selectedTab) {
        newSelectedTab--;
      }

      setSelectedTab(newSelectedTab);
      setTabs(newTabs);
    }
  };

  const handleTabSelection = (tabIndex: number) => {
    setSelectedTab(tabIndex);
  };

  const onDidConfirmTabClose = () => {
    onTabDidClose();
    setIsDialogOpen(false);
    setClosingTabIndex(undefined);
  };

  const onDialogDidClose = () => {
    setIsDialogOpen(false);
  };

  return (
    <div style={{ height: 300, width: 600 }}>
      <Tabstrip
        enableAddTab
        enableCloseTab
        allowRenameTab
        onAddTab={handleAddTab}
        onActiveChange={handleTabSelection}
        onCloseTab={onTabShouldClose}
        activeTabIndex={selectedTab}
      >
        {tabs.map(({ label, closeable }) => (
          <Tab closeable={closeable} label={label} key={label} />
        ))}
      </Tabstrip>
      {isDialogOpen && typeof closingTabIndex === "number" && (
        <CloseTabWarningDialog
          closedTab={tabs[closingTabIndex]}
          onCancel={onDialogDidClose}
          onClose={onDialogDidClose}
          onConfirm={onDidConfirmTabClose}
          open
        />
      )}
    </div>
  );
};

export const TheFullMontyNoConfirmation = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [tabs, setTabs] = useState([
    { label: "Home", closeable: false },
    { label: "Transactions" },
    { label: "Loans" },
    { label: "Checks" },
    { label: "Liquidity" },
  ]);

  const handleAddTab = () => {
    const count = tabs.length;
    setTabs((state) => state.concat([{ label: `Tab ${state.length + 1}` }]));
    setSelectedTab(count);
  };

  const onTabDidClose = (closingTabIndex: number) => {
    if (closingTabIndex !== undefined) {
      const newTabs = [...tabs];
      newTabs.splice(closingTabIndex, 1);

      let newSelectedTab = selectedTab;
      if (selectedTab > closingTabIndex || newTabs.length === selectedTab) {
        newSelectedTab--;
      }

      setSelectedTab(newSelectedTab);
      setTabs(newTabs);
    }
  };

  const handleTabSelection = (tabIndex: number) => {
    setSelectedTab(tabIndex);
  };

  return (
    <div style={{ height: 300, width: 600 }}>
      <Tabstrip
        enableAddTab
        allowRenameTab
        onAddTab={handleAddTab}
        onActiveChange={handleTabSelection}
        onCloseTab={onTabDidClose}
        activeTabIndex={selectedTab}
      >
        {tabs.map(({ label, closeable }) => (
          <Tab closeable={closeable} label={label} key={label} />
        ))}
      </Tabstrip>
    </div>
  );
};

const tabLabels = [
  "Tab Test 1",
  "Tab Test 2",
  "Tab Test 3",
  "Tab Test 4",
  "Tab Test 5",
  "Tab Test 6",
  "Tab Test 7",
  "Tab Test 8",
];

export const DraggableTabs = () => {
  const [, setSelectedTab] = useState(0);

  const [tabs, setTabs] = useState(tabLabels);
  const handleDrop = useCallback(
    (fromIndex, toIndex) => {
      const newTabs = tabs.slice();
      const [tab] = newTabs.splice(fromIndex, 1);
      if (toIndex === -1) {
        setTabs(newTabs.concat(tab));
      } else {
        newTabs.splice(toIndex, 0, tab);
        setTabs(newTabs);
      }
    },
    [tabs]
  );
  return (
    <div style={{ height: 300, width: 700 }}>
      <Tabstrip
        allowDragDrop
        onActiveChange={setSelectedTab}
        onMoveTab={handleDrop}
      >
        {tabs.map((label, i) => (
          <Tab label={label} key={i} />
        ))}
      </Tabstrip>
    </div>
  );
};
export const DraggableTabsWithOverflow = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [tabs, setTabs] = useState([
    "Home",
    "Transactions",
    "Loans",
    "Checks",
    "Liquidity",
    "Reports",
    "Statements",
    "Administration",
    "Virtual Branch",
    "More Services",
  ]);

  const handleDrop = useCallback(
    (fromIndex: number, toIndex: number) => {
      const tab = tabs[fromIndex];
      const newTabs = tabs.filter((t) => t !== tab);
      console.log(`handleDrop from ${fromIndex} to ${toIndex} 
        existing tabs ${tabs.join(",")}
      `);
      if (toIndex === -1) {
        setTabs(newTabs.concat(tab));
      } else {
        newTabs.splice(toIndex, 0, tab);
        console.log(`new tabs ${newTabs.join(",")}`);
        setTabs(newTabs);
      }
    },
    [tabs]
  );

  const childTabs = useMemo(
    () => tabs.map((label, i) => <Tab label={label} key={i} />),
    [tabs]
  );

  return (
    <div style={{ height: 300, width: 600 }}>
      <Tabstrip
        activeTabIndex={activeTabIndex}
        allowDragDrop
        onActiveChange={setActiveTabIndex}
        onMoveTab={handleDrop}
      >
        {childTabs}
      </Tabstrip>
    </div>
  );
};
*/
