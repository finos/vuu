import { MenuActionHandler, MenuBuilder } from "@finos/vuu-data-types";
import {
  ContextMenuProvider,
  MenuCloseHandler,
  PopupMenu,
  PopupMenuProps,
} from "@finos/vuu-popups";
import { useCallback, useMemo } from "react";

let displaySequence = 1;

const menuBuilder: MenuBuilder = () => [
  { action: "action-1", label: "Menu Item 1" },
  { action: "action-2", label: "Menu Item 2" },
];

const defaultMenuHandler: MenuActionHandler = ({ menuId }) => {
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
    [menuActionHandler]
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

DefaultPopupMenu.displaySequence = displaySequence++;

export const PopupMenuWithLabel = ({ height = 300, width = 600 }) => {
  const menuBuilder = useMemo<MenuBuilder>(
    () => () =>
      [
        {
          action: "action-1",
          label: "Menu Item 1",
        },
        {
          action: "action-2",
          label: "Menu Item 2",
        },
      ],
    []
  );

  const menuHandler = useMemo<MenuActionHandler>(
    () =>
      ({ menuId }) => {
        console.log(`Menu Action ${menuId} invoked`);
        if (menuId === "action-1" || menuId === "action-1") {
          // invoke our action here
          return true;
        }
      },
    []
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

PopupMenuWithLabel.displaySequence = displaySequence++;

export const PopupMenuWithMenuOptions = () => {
  const menuBuilder = useMemo<MenuBuilder>(
    () => (_locaction, options) =>
      [
        {
          action: "action-1",
          label: "Menu Item 1",
          options,
        },
        {
          action: "action-2",
          label: "Menu Item 2",
          options,
        },
      ],
    []
  );

  const menuHandler = useMemo<MenuActionHandler>(
    () =>
      ({ menuId }) => {
        console.log(`Menu Action ${menuId} invoked`);
        if (menuId === "action-1" || menuId === "action-1") {
          // invoke our action here
          return true;
        }
      },
    []
  );

  const menuOptions = useMemo(
    () => ({
      test: "value-1",
    }),
    []
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

PopupMenuWithMenuOptions.displaySequence = displaySequence++;

export const PopupMenuUsingLocationAndContext = () => {
  const contextMenuDescriptors = [
    { label: "Sort", action: "sort", location: "test-location" },
    { label: "Filter", action: "sort", location: "test-location" },
    { label: "Group", action: "group" },
  ];

  const handleContextMenuAction: MenuActionHandler = () => {
    return true;
  };

  const contextMenuBuilder: MenuBuilder = (location) =>
    contextMenuDescriptors.filter((menuItem) => menuItem.location === location);

  const menuBuilder = useMemo<MenuBuilder>(
    () => (_locaction, options) =>
      [
        {
          action: "action-1",
          label: "Menu Item 1",
          options,
        },
        {
          action: "action-2",
          label: "Menu Item 2",
          options,
        },
      ],
    []
  );

  const menuHandler = useMemo<MenuActionHandler>(
    () =>
      ({ menuId }) => {
        if (menuId === "action-1" || menuId === "action-1") {
          // invoke our action here
          return true;
        }
      },
    []
  );

  const menuOptions = useMemo(
    () => ({
      test: "value-1",
    }),
    []
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

PopupMenuUsingLocationAndContext.displaySequence = displaySequence++;
