import { CSSProperties, useState } from "react";
import {
  Tab,
  Tabstrip,
  Toolbar,
  ToolbarButton,
  ToolbarField,
  Tooltray,
} from "@heswell/uitk-lab";
import { CloseIcon } from "@heswell/uitk-icons";
import { Header } from "@vuu-ui/layout";

import "@heswell/component-anatomy/esm/index.css";
import { Flexbox } from "@vuu-ui/layout";

const toolbarStyle = {
  "--uitkToolbar-background": "white",
} as CSSProperties;

export const DefaultHeader = () => {
  return <Header closeable title="Default Header" />;
};

export const HeaderWithTabs = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const [tabs, setTabs] = useState([{ label: "Home", closeable: false }]);

  const handleTabSelection = (tabIndex: number) => {
    console.log(`handleTabSelection ${tabIndex}`);
    setActiveTabIndex(tabIndex);
  };

  const handleAddTab = () => {
    const count = tabs.length;
    setTabs((state) => state.concat([{ label: `Tab ${state.length + 1}` }]));
    setActiveTabIndex(count);
  };

  const logItemName = (buttonName: string) =>
    console.log(`${buttonName} button clicked'`);

  return (
    <Flexbox style={{ height: 200, width: 425 }}>
      <div data-resizeable style={{ flex: 1 }}>
        <Toolbar id="toolbar-default" style={toolbarStyle}>
          <ToolbarField
            disableFocusRing
            data-collapsible="dynamic"
            data-priority="3"
          >
            <Tabstrip
              activeTabIndex={activeTabIndex}
              onActiveChange={handleTabSelection}
              enableAddTab
              enableRenameTab
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
          </ToolbarField>

          <ToolbarButton data-align-end onClick={() => logItemName("expand")}>
            <CloseIcon /> Close
          </ToolbarButton>
        </Toolbar>
      </div>
      <div data-resizeable />
    </Flexbox>
  );
};

export const HeaderWithTitle = () => {
  return (
    <Flexbox style={{ height: 200, width: 425 }}>
      <div data-resizeable style={{ flex: 1 }}>
        <Toolbar id="toolbar-default" style={toolbarStyle}>
          <ToolbarField
            disableFocusRing
            data-collapsible="dynamic"
            data-priority="3"
          >
            <span className="vuuTitle">Component Title</span>
          </ToolbarField>

          <Tooltray data-align-end>
            <ToolbarButton>
              <CloseIcon /> Close
            </ToolbarButton>
          </Tooltray>
        </Toolbar>
      </div>
      <div data-resizeable />
    </Flexbox>
  );
};
