import { Flexbox, Header } from "@finos/vuu-layout";
import { Tab, Tabstrip } from "@finos/vuu-ui-controls";
import { Button } from "@salt-ds/core";
import { CSSProperties, useState } from "react";

import "@heswell/component-anatomy/esm/index.css";

let displaySequence = 1;

const toolbarStyle = {
  "--saltToolbar-background": "white",
} as CSSProperties;

export const DefaultHeader = () => {
  return (
    <Header
      closeable
      title="Default Header"
      onEditTitle={() => {
        return;
      }}
    />
  );
};
DefaultHeader.displaySequence = displaySequence++;

export const HeaderWithTabs = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const [tabs, setTabs] = useState<
    Array<{ label: string; closeable?: boolean }>
  >([{ label: "Home", closeable: false }]);

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
        <div
          className="vuuToolbarProxy"
          id="toolbar-default"
          style={toolbarStyle}
        >
          <Tabstrip
            activeTabIndex={activeTabIndex}
            onActiveChange={handleTabSelection}
            allowAddTab
            allowRenameTab
            onAddTab={handleAddTab}
          >
            {tabs.map(({ label }, i) => (
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

          <Button
            data-align-end
            onClick={() => logItemName("expand")}
            data-icon="close"
          />
        </div>
      </div>
      <div data-resizeable />
    </Flexbox>
  );
};
HeaderWithTabs.displaySequence = displaySequence++;

export const HeaderWithTitle = () => {
  return (
    <Flexbox style={{ height: 200, width: 425 }}>
      <div data-resizeable style={{ flex: 1 }}>
        <div
          className="vuuToolbarProxy"
          id="toolbar-default"
          style={toolbarStyle}
        >
          <span className="vuuTitle">Component Title</span>

          <div className="vuuTooltrayProxy" data-align-end>
            <Button data-icon="close" />
          </div>
        </div>
      </div>
      <div data-resizeable />
    </Flexbox>
  );
};
HeaderWithTitle.displaySequence = displaySequence++;
