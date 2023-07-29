import { Tab, Tabstrip } from "@finos/vuu-ui-controls";
import { useCallback, useState } from "react";
import { FlexboxLayout, LayoutProvider } from "@finos/vuu-layout";

import "./Tabstrip.examples.css";
import { ExitEditModeHandler } from "@heswell/salt-lab/dist-types/tabs/useEditableItem";

const SPLITTER_WIDTH = 3;

let displaySequence = 1;

export const DefaultTabstripNext = ({
  activeTabIndex: activeTabIndexProp = 4,
  width = 700,
}) => {
  const [activeTabIndex, setActiveTabIndex] = useState(activeTabIndexProp);
  const tabs = ["Home", "Transactions", "Loans", "Checks", "Liquidity"];
  return (
    <LayoutProvider>
      <FlexboxLayout
        style={{ height: 200, width: width + SPLITTER_WIDTH }}
        path=""
      >
        <div data-resizeable style={{ flex: 1 }}>
          <Tabstrip
            activeTabIndex={activeTabIndex}
            animateSelectionThumb
            onActiveChange={setActiveTabIndex}
          >
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

DefaultTabstripNext.displaySequence = displaySequence++;

export const TabstripNextAddTab = ({ width = 700 }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [tabs, setTabs] = useState([{ label: "Home" }]);

  const handleAddTab = () => {
    const count = tabs.length;
    setTabs((state) => state.concat([{ label: `Tab ${state.length + 1}` }]));
    setActiveTabIndex(count);
  };

  return (
    <LayoutProvider>
      <FlexboxLayout
        style={{ height: 200, width: width + SPLITTER_WIDTH }}
        path=""
      >
        <div data-resizeable style={{ flex: 1 }}>
          <Tabstrip
            activeTabIndex={activeTabIndex}
            animateSelectionThumb
            allowAddTab
            onActiveChange={setActiveTabIndex}
            onAddTab={handleAddTab}
          >
            {tabs.map(({ label }, i) => (
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

TabstripNextAddTab.displaySequence = displaySequence++;

export const TabstripNextRemoveTab = ({ width = 700 }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [tabs, setTabs] = useState([{ label: "Home" }]);

  const handleAddTab = () => {
    const count = tabs.length;
    setTabs((state) => state.concat([{ label: `Tab ${state.length + 1}` }]));
    setActiveTabIndex(count);
  };
  const handleCloseTab = useCallback(
    (tabIndex: number, newActiveTabIndex: number) => {
      setTabs((state) => state.filter((_, i) => i !== tabIndex));
      setActiveTabIndex(newActiveTabIndex);
    },
    []
  );

  return (
    <LayoutProvider>
      <FlexboxLayout
        style={{ height: 200, width: width + SPLITTER_WIDTH }}
        path=""
      >
        <div data-resizeable style={{ flex: 1 }}>
          <Tabstrip
            activeTabIndex={activeTabIndex}
            allowAddTab
            allowCloseTab
            animateSelectionThumb
            onActiveChange={setActiveTabIndex}
            onAddTab={handleAddTab}
            onCloseTab={handleCloseTab}
          >
            {tabs.map(({ label }, i) => (
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

TabstripNextRemoveTab.displaySequence = displaySequence++;

export const TabstripNextEditableLabels = ({
  activeTabIndex: activeTabIndexProp = 0,
  width = 700,
}) => {
  const [activeTabIndex, setActiveTabIndex] = useState(activeTabIndexProp);
  const tabs = ["Home", "Transactions", "Loans", "Checks", "Liquidity"];

  const handleTabLabelChanged = useCallback<ExitEditModeHandler>(
    (originalValue, newValue) => {
      console.log(`tab label changed from '${originalValue}' to '${newValue}'`);
    },
    []
  );

  return (
    <LayoutProvider>
      <FlexboxLayout
        style={{ height: 200, width: width + SPLITTER_WIDTH }}
        path=""
      >
        <div data-resizeable style={{ flex: 1 }}>
          <Tabstrip
            activeTabIndex={activeTabIndex}
            allowRenameTab
            animateSelectionThumb
            onActiveChange={setActiveTabIndex}
            onExitEditMode={handleTabLabelChanged}
          >
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

TabstripNextEditableLabels.displaySequence = displaySequence++;

export const TabstripNextDragDrop = ({ width = 700 }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [tabs, setTabs] = useState([
    "Home",
    "Transactions",
    "Loans",
    "Checks",
    "Liquidity",
  ]);

  const handleDrop = useCallback((fromIndex, toIndex) => {
    setTabs((tabs) => {
      const newTabs = tabs.slice();
      const [tab] = newTabs.splice(fromIndex, 1);
      if (toIndex === -1) {
        return newTabs.concat(tab);
      } else {
        newTabs.splice(toIndex, 0, tab);
        return newTabs;
      }
    });
  }, []);

  return (
    <LayoutProvider>
      <FlexboxLayout
        style={{ height: 200, width: width + SPLITTER_WIDTH }}
        path=""
      >
        <div data-resizeable style={{ flex: 1 }}>
          <Tabstrip
            activeTabIndex={activeTabIndex}
            animateSelectionThumb
            allowDragDrop
            onActiveChange={setActiveTabIndex}
            onMoveTab={handleDrop}
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
        <div data-resizeable />
      </FlexboxLayout>
    </LayoutProvider>
  );
};

TabstripNextDragDrop.displaySequence = displaySequence++;

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
