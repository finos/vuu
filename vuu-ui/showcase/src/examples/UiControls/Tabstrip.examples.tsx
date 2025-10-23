import {
  ExitTabEditModeHandler,
  Tab,
  Tabstrip,
  TabstripProps,
} from "@vuu-ui/vuu-ui-controls";
import { moveItem } from "@vuu-ui/vuu-utils";
import { useCallback, useState } from "react";
import { FlexboxLayout, LayoutProvider } from "@vuu-ui/vuu-layout";

import "./Tabstrip.examples.css";
import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";

const SPLITTER_WIDTH = 9;

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
      console.log(`tab label changed from '${originalValue}' to '${newValue}'`);
      setTabs((currentTabs) =>
        currentTabs.map((name) => (name === originalValue ? newValue : name)),
      );
    },
    [],
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
        <div data-resizeable />
      </FlexboxLayout>
    </LayoutProvider>
  );
};

export const DefaultTabstrip = ({
  activeTabIndex: activeTabIndexProp = 0,
  width = 500,
}) => <TabstripTemplate activeTabIndex={activeTabIndexProp} width={width} />;

export const OveflowingTabstrip = ({
  activeTabIndex: activeTabIndexProp = 0,
  width = 350,
}) => <TabstripTemplate activeTabIndex={activeTabIndexProp} width={width} />;

export const OveflowingSelectedTab = ({
  activeTabIndex: activeTabIndexProp = 4,
  width = 350,
}) => <TabstripTemplate activeTabIndex={activeTabIndexProp} width={width} />;

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

export const TabstripRemoveTab = ({
  activeTabIndex: activeTabIndexProp = 4,
  width = 700,
}) => (
  <ContextMenuProvider>
    <TabstripTemplate
      activeTabIndex={activeTabIndexProp}
      allowAddTab
      allowCloseTab
      width={width}
    />
  </ContextMenuProvider>
);

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
