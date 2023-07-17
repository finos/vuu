import { MenuActionHandler, MenuBuilder } from "@finos/vuu-data-types";
import { ContextMenuProvider, PopupMenu } from "@finos/vuu-popups";
import { useMemo } from "react";

let displaySequence = 1;

export const DefaultPopupMenu = () => {
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
    () => (type, options) => {
      console.log(`Menu Action ${type} invoked`, {
        options,
      });
      if (type === "action-1" || type === "action-1") {
        // invoke our action here
        return true;
      }
    },
    []
  );

  return (
    <div
      style={{ border: "solid 1px #ccc", height: 300, padding: 12, width: 600 }}
    >
      <PopupMenu menuBuilder={menuBuilder} menuActionHandler={menuHandler} />
    </div>
  );
};

DefaultPopupMenu.displaySequence = displaySequence++;

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
    () => (type, options) => {
      console.log(`Menu Action ${type} invoked`, {
        options,
      });
      if (type === "action-1" || type === "action-1") {
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
  const menuDescriptors = [
    { label: "Sort", action: "sort" },
    { label: "Filter", action: "sort" },
    { label: "Group", action: "group" },
  ];

  const handleContextMenuAction: MenuActionHandler = () => {
    console.log("handleContextMenu");
    return true;
  };

  const contextMenuBuilder = () => menuDescriptors;

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
    () => (type, options) => {
      console.log(`Menu Action ${type} invoked`, {
        options,
      });
      if (type === "action-1" || type === "action-1") {
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
          menuOptions={menuOptions}
        />
      </div>
    </ContextMenuProvider>
  );
};

PopupMenuUsingLocationAndContext.displaySequence = displaySequence++;
