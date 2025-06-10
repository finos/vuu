import {
  ContextMenuProvider,
  MenuActionHandler,
  MenuBuilder,
} from "@vuu-ui/vuu-context-menu";
import {
  MenuCloseHandler,
  PopupMenu,
  PopupMenuProps,
} from "@vuu-ui/vuu-popups";
import { useCallback, useMemo } from "react";

const menuBuilder: MenuBuilder = () => [
  { id: "action-1", label: "Menu Item 1" },
  { id: "action-2", label: "Menu Item 2" },
];

const defaultMenuHandler: MenuActionHandler = (menuId) => {
  console.log(`Menu Action ${menuId} invoked`);
  if (menuId === "action-1" || menuId === "action-1") {
    // invoke our action here
    return true;
  }
};

export const DefaultPopupMenu = ({
  menuActionHandler,
}: Partial<PopupMenuProps>) => {
  const menuHandler = useMemo<MenuActionHandler>(
    () => menuActionHandler ?? defaultMenuHandler,
    [menuActionHandler],
  );

  const onMenuOpen = useCallback(() => {
    console.log("Menu opened");
  }, []);

  const onMenuClose = useCallback<MenuCloseHandler>((reason) => {
    console.log(`Menu closed`, {
      reason,
    });
  }, []);

  return (
    <div
      data-showcase-center
      style={{ gap: 24, display: "flex", alignItems: "center" }}
    >
      <input data-testid="input" defaultValue="test" />
      <PopupMenu
        menuBuilder={menuBuilder}
        menuActionHandler={menuHandler}
        onMenuOpen={onMenuOpen}
        onMenuClose={onMenuClose}
      />
    </div>
  );
};

export const PopupMenuWithLabel = ({ height = 300, width = 600 }) => {
  const menuBuilder = useMemo<MenuBuilder>(
    () => () => [
      {
        id: "action-1",
        label: "Menu Item 1",
      },
      {
        id: "action-2",
        label: "Menu Item 2",
      },
    ],
    [],
  );

  const menuHandler = useMemo<MenuActionHandler>(
    () => (menuId) => {
      console.log(`Menu Action ${menuId} invoked`);
      if (menuId === "action-1" || menuId === "action-1") {
        // invoke our action here
        return true;
      }
    },
    [],
  );

  return (
    <div
      style={{
        border: "solid 1px #ccc",
        gap: 24,
        height,
        padding: 12,
        width,
        display: "flex",
        alignItems: "center",
      }}
    >
      <input defaultValue="test" />
      <PopupMenu
        label="actions"
        menuBuilder={menuBuilder}
        menuActionHandler={menuHandler}
      />
    </div>
  );
};

export const PopupMenuWithMenuOptions = () => {
  const menuBuilder = useMemo<MenuBuilder>(
    () => (_locaction, options) => [
      {
        id: "action-1",
        label: "Menu Item 1",
        options,
      },
      {
        id: "action-2",
        label: "Menu Item 2",
        options,
      },
    ],
    [],
  );

  const menuHandler = useMemo<MenuActionHandler>(
    () => (menuId) => {
      console.log(`Menu Action ${menuId} invoked`);
      if (menuId === "action-1" || menuId === "action-1") {
        // invoke our action here
        return true;
      }
    },
    [],
  );

  const menuOptions = useMemo(
    () => ({
      test: "value-1",
    }),
    [],
  );

  return (
    <div
      style={{ border: "solid 1px #ccc", height: 300, padding: 12, width: 600 }}
    >
      <PopupMenu
        menuBuilder={menuBuilder}
        menuActionHandler={menuHandler}
        menuOptions={menuOptions}
      />
    </div>
  );
};

export const PopupMenuUsingLocationAndContext = () => {
  const contextMenuDescriptors = [
    { label: "Sort", id: "sort", location: "test-location" },
    { label: "Filter", id: "sort", location: "test-location" },
    { label: "Group", id: "group" },
  ];

  const handleContextMenuAction: MenuActionHandler = () => {
    return true;
  };

  const contextMenuBuilder: MenuBuilder = (location) =>
    contextMenuDescriptors.filter((menuItem) => menuItem.location === location);

  const menuBuilder = useMemo<MenuBuilder>(
    () => (_locaction, options) => [
      {
        id: "action-1",
        label: "Menu Item 1",
        options,
      },
      {
        id: "action-2",
        label: "Menu Item 2",
        options,
      },
    ],
    [],
  );

  const menuHandler = useMemo<MenuActionHandler>(
    () => (menuId) => {
      if (menuId === "action-1" || menuId === "action-1") {
        // invoke our action here
        return true;
      }
    },
    [],
  );

  const menuOptions = useMemo(
    () => ({
      test: "value-1",
    }),
    [],
  );

  return (
    <ContextMenuProvider
      menuBuilder={contextMenuBuilder}
      menuActionHandler={handleContextMenuAction}
    >
      <div
        style={{
          border: "solid 1px #ccc",
          height: 300,
          padding: 12,
          width: 600,
        }}
      >
        <PopupMenu
          menuBuilder={menuBuilder}
          menuActionHandler={menuHandler}
          menuLocation="test-location"
          menuOptions={menuOptions}
        />
      </div>
    </ContextMenuProvider>
  );
};
