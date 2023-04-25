import { ContextMenuProvider, MenuActionHandler } from "@finos/vuu-popups";
import { ThemedPanel } from "./components/ThemedPanel";

import "./ThemeProvider.examples.css";

const menuDescriptors = [
  { label: "Sort", action: "sort" },
  { label: "Filter", action: "sort" },
  { label: "Group", action: "group" },
];

const menuBuilder = () => menuDescriptors;

const handleMenuAction: MenuActionHandler = () => {
  console.log("handleContextMenu");
  return true;
};

export const NestedThemeProviders = () => {
  return (
    <ContextMenuProvider
      menuBuilder={menuBuilder}
      menuActionHandler={handleMenuAction}
    >
      <div className="vuuNestedThemeProviders">
        <ThemedPanel>
          <ThemedPanel />
        </ThemedPanel>
      </div>
    </ContextMenuProvider>
  );
};
