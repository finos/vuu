import { useCallback, useMemo, useState } from "react";
import { Button } from "@heswell/uitk-core";
import {
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Tab,
  TabDescriptor,
  Tabstrip,
  TabPanel,
} from "@heswell/uitk-lab";

import "@heswell/component-anatomy/esm/index.css";
import { FlexboxLayout, LayoutProvider } from "@vuu-ui/layout";

export const Default = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const tabs = ["Home", "Transactions", "Loans", "Checks", "Liquidity"];
  return (
    <LayoutProvider>
      <FlexboxLayout style={{ height: 200, width: 353 }}>
        <div data-resizeable style={{ flex: 1 }}>
          <Tabstrip onActiveChange={setActiveTabIndex}>
            {tabs.map((label, i) => (
              <Tab
                key={label}
                label={label}
                ariaControls={
                  i === activeTabIndex ? `ts-panel-${i}` : undefined
                }
              />
            ))}
          </Tabstrip>
        </div>
        <div data-resizeable />
      </FlexboxLayout>
    </LayoutProvider>
  );
};

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

  //TODO add confirmation dialog
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
    // This will always be true if we reach this code path, but TypeScript needs the clarification
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
        enableRenameTab
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

  //TODO add confirmation dialog
  const handleAddTab = () => {
    const count = tabs.length;
    setTabs((state) => state.concat([{ label: `Tab ${state.length + 1}` }]));
    setSelectedTab(count);
  };

  const onTabDidClose = (closingTabIndex: number) => {
    // This will always be true if we reach this code path, but TypeScript needs the clarification
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
        enableCloseTab
        enableRenameTab
        onAddTab={handleAddTab}
        onActiveChange={handleTabSelection}
        onCloseTab={onTabDidClose}
        activeTabIndex={selectedTab}
      >
        {tabs.map(({ label, closeable }) => (
          <Tab closeable={closeable} label={label} key={label} />
        ))}
      </Tabstrip>
      <TabPanel tabs={tabs} activeTabIndex={selectedTab} />
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
  const [selectedTab, setSelectedTab] = useState(0);

  const [tabs, setTabs] = useState(tabLabels);
  const handleDrop = useCallback(
    (fromIndex, toIndex) => {
      const newTabs = tabs.slice();
      const [tab] = newTabs.splice(fromIndex, 1);
      if (toIndex === -1) {
        setTabs(newTabs.concat(tab));
      } else {
        // const offset = toIndex < fromIndex ? +1 : 0;
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
        // const offset = toIndex < fromIndex ? +1 : 0;
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
