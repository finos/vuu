import {
  ContextMenuItemDescriptor,
  MenuActionHandler,
  MenuBuilder,
} from "@finos/vuu-data-types";
import { Flexbox } from "@finos/vuu-layout";
import {
  ContextMenu,
  ContextMenuProps,
  ContextMenuProvider,
  MenuItem,
  MenuItemGroup,
  PopupCloseReason,
  reasonIsMenuAction,
  Separator,
  useContextMenu,
} from "@finos/vuu-popups";

import { Button } from "@salt-ds/core";

import {
  HTMLAttributes,
  MouseEvent,
  MouseEventHandler,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

let displaySequence = 1;

const usePosition = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: -1,
    y: -1,
  });
  useLayoutEffect(() => {
    if (ref.current) {
      const { left: x, top: y } = ref.current.getBoundingClientRect();
      setPosition({ x, y });
    }
  }, []);

  return { ref, position };
};

const SampleContextMenu = (props: Partial<ContextMenuProps>) => (
  <ContextMenu {...props}>
    <MenuItemGroup label="Item 1">
      <MenuItem action="ACT 1.1">Item 1.1</MenuItem>
      <MenuItem>Item 1.2</MenuItem>
      <MenuItem>Item 1.3</MenuItem>
      <Separator />
      <MenuItem>Item 1.4</MenuItem>
      <MenuItem>Item 1.5</MenuItem>
    </MenuItemGroup>
    <MenuItem action="ACT 2" options={{ name: "petie" }}>
      Item 2
    </MenuItem>
    <MenuItemGroup label="Item 3">
      <MenuItemGroup label="Item 3.1">
        <MenuItem>Item 3.1.1</MenuItem>
        <MenuItem>Item 3.1.2</MenuItem>
        <MenuItem>Item 3.1.3</MenuItem>
        <MenuItem action="ACT 3.1.4">Item 3.1.4</MenuItem>
      </MenuItemGroup>
      <MenuItem>Item 3.2</MenuItem>
      <MenuItem>Item 3.3</MenuItem>
      <MenuItem>Item 3.3</MenuItem>
    </MenuItemGroup>
  </ContextMenu>
);

export const DefaultContextMenu = () => {
  const handleClose: ContextMenuProps["onClose"] = () => {
    console.log(`clicked menu action`);
  };

  const { ref, position } = usePosition();

  return (
    <div
      ref={ref}
      style={{ background: "ivory", height: "100vh", width: "100vw" }}
    >
      {position.x !== -1 && position.y !== -1 ? (
        <SampleContextMenu position={position} onClose={handleClose} />
      ) : null}
    </div>
  );
};

DefaultContextMenu.displaySequence = displaySequence++;

type IdProps = { children: string | JSX.Element };
const Id = ({ children }: IdProps) => (
  <span style={{ color: "blue" }}>{children}</span>
);

export const AdditionalNesting = () => {
  const { ref, position } = usePosition();
  const handleClose: ContextMenuProps["onClose"] = (
    reason?: PopupCloseReason
  ) => {
    if (reasonIsMenuAction(reason)) {
      console.log(`menu closed ${reason.menuId}`);
    }
  };

  return (
    <div
      ref={ref}
      style={{ background: "ivory", height: "100vh", width: "100vw" }}
    >
      {position.x !== -1 && position.y !== -1 ? (
        <ContextMenu position={position} id="test" onClose={handleClose}>
          <MenuItemGroup>
            <MenuItem.Label>
              Item 1 <Id>menuitem-test-0</Id>
            </MenuItem.Label>
            <MenuItem action="action-0">
              Item 1.1 <Id>menuitem-test-0-0</Id>
            </MenuItem>
            <MenuItem>
              Item 1.2 <Id>#test-0-1</Id>
            </MenuItem>
            <MenuItem>
              Item 1.3 <Id>#test-0/2</Id>
            </MenuItem>
            <Separator />
            <MenuItem>
              Item 1.4 <Id>#test-0/3</Id>
            </MenuItem>
            <MenuItem>
              Item 1.5 <Id>#test-0/4</Id>
            </MenuItem>
          </MenuItemGroup>
          <MenuItemGroup label="Item 2 #test-1">
            <MenuItemGroup label="Item 2.1 #1.0">
              <MenuItem>Item 2.1.0</MenuItem>
              <MenuItem>Item 2.1.1</MenuItem>
              <MenuItem>Item 2.1.2</MenuItem>
              <Separator />
              <MenuItem>Item 2.1.4</MenuItem>
              <MenuItem>Item 2.1.5</MenuItem>
            </MenuItemGroup>
            <MenuItem>Item 2.2 #1.1</MenuItem>
            <MenuItem>Item 2.3 #1.2</MenuItem>
            <MenuItem>Item 2.4 #1.0</MenuItem>
            <MenuItem>Item 2.5 #1.0</MenuItem>
          </MenuItemGroup>
          <MenuItemGroup label="Item 3 #test-2">
            <MenuItem>Item 3.1</MenuItem>
            <MenuItem>Item 3.2</MenuItem>
            <MenuItem>Item 3.3</MenuItem>
            <Separator />
            <MenuItem>Item 3.4</MenuItem>
            <MenuItem>Item 3.5</MenuItem>
          </MenuItemGroup>
          <MenuItemGroup label="Item 4 #test-3">
            <MenuItem>Item 4.1</MenuItem>
            <MenuItem>Item 4.2</MenuItem>
            <MenuItem>Item 4.3</MenuItem>
            <Separator />
            <MenuItem>Item 4.4</MenuItem>
            <MenuItem>Item 4.5</MenuItem>
          </MenuItemGroup>
          <MenuItemGroup label="Item 5 #test-4">
            <MenuItemGroup label="Item 5.1 #4.0">
              <MenuItem>Item 5.1.1</MenuItem>
              <MenuItem>Item 5.1.2</MenuItem>
              <MenuItem>Item 5.1.3</MenuItem>
              <MenuItem>Item 5.1.4</MenuItem>
            </MenuItemGroup>
            <MenuItem>Item 5.2</MenuItem>
            <MenuItem>Item 5.3</MenuItem>
            <MenuItem>Item 5.4</MenuItem>
          </MenuItemGroup>
        </ContextMenu>
      ) : null}
    </div>
  );
};

AdditionalNesting.displaySequence = displaySequence++;

export const ContextMenuPopup = () => {
  const contextMenu = useMemo(() => {
    const handleClose: ContextMenuProps["onClose"] = (
      reason?: PopupCloseReason
    ) => {
      if (reasonIsMenuAction(reason)) {
        console.log(`menu closed ${reason.menuId}`);
      }
    };

    return (
      <ContextMenu onClose={handleClose}>
        <MenuItemGroup label="Item 1">
          <MenuItem action="1.1">Item 1.1</MenuItem>
          <MenuItem>Item 1.2</MenuItem>
          <MenuItem>Item 1.3</MenuItem>
          <Separator />
          <MenuItem>Item 1.4</MenuItem>
          <MenuItem>Item 1.5</MenuItem>
        </MenuItemGroup>
        <MenuItem>Item 2</MenuItem>
        <MenuItemGroup label="Item 3">
          <MenuItemGroup label="Item 3.1">
            <MenuItem>Item 3.1.1</MenuItem>
            <MenuItem>Item 3.1.2</MenuItem>
            <MenuItem>Item 3.1.3</MenuItem>
            <MenuItem>Item 3.1.4</MenuItem>
          </MenuItemGroup>
          <MenuItem>Item 3.2</MenuItem>
          <MenuItem>Item 3.3</MenuItem>
          <MenuItem>Item 3.3</MenuItem>
        </MenuItemGroup>
      </ContextMenu>
    );
  }, []);

  const [showContextMenu] = useContextMenu();
  const ref = useRef(null);

  const handleClick = (evt: MouseEvent<HTMLElement>) => {
    showContextMenu(evt, "", {
      contextMenu,
    });
  };

  return (
    <div
      style={{
        background: "ivory",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100vw",
      }}
    >
      <Button
        onClick={handleClick}
        ref={ref}
        style={{ justifySelf: "flex-end" }}
      >
        Show Context Menu
      </Button>
      <div
        style={{
          alignSelf: "stretch",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Button
          onClick={handleClick}
          ref={ref}
          style={{ justifySelf: "flex-end" }}
        >
          Show Context Menu
        </Button>
        <Button
          onClick={handleClick}
          ref={ref}
          style={{ justifySelf: "flex-end" }}
        >
          Show Context Menu
        </Button>
        <Button
          onClick={handleClick}
          ref={ref}
          style={{ justifySelf: "flex-end" }}
        >
          Show Context Menu
        </Button>
      </div>
      <Button
        onClick={handleClick}
        ref={ref}
        style={{ justifySelf: "flex-end" }}
      >
        Show Context Menu
      </Button>
    </div>
  );
};

ContextMenuPopup.displaySequence = displaySequence++;

const ComponentWithMenu = ({
  location,
  ...props
}: HTMLAttributes<HTMLDivElement> & { location: "left" | "right" }) => {
  const [showContextMenu] = useContextMenu();
  const handleContextMenu: MouseEventHandler<HTMLDivElement> = (e) => {
    console.log(`ComponentWithMenu<${location}> handleContextMenu`);
    showContextMenu(e, location, { type: "outer" });
  };
  return <div {...props} onContextMenu={handleContextMenu} />;
};

export const SimpleContextMenuProvider = () => {
  const menuDescriptors = [
    { label: "Sort", action: "sort" },
    { label: "Filter", action: "sort" },
    { label: "Group", action: "group" },
  ];

  const handleMenuAction: MenuActionHandler = (reason) => {
    console.log(`handleContextMenu ${reason.menuId}`);
    return true;
  };

  const menuBuilder = () => menuDescriptors;

  return (
    <ContextMenuProvider
      menuBuilder={menuBuilder}
      menuActionHandler={handleMenuAction}
    >
      <ComponentWithMenu
        style={{ height: 200, width: 200, backgroundColor: "yellow" }}
        location="right"
      />
    </ContextMenuProvider>
  );
};

SimpleContextMenuProvider.displaySequence = displaySequence++;

export const ContextMenuProviderWithLocationAwareMenuBuilder = () => {
  const menuDescriptors: ContextMenuItemDescriptor[] = [
    { label: "Sort", action: "sort", icon: "sort-up" },
    { label: "Filter", action: "filter", icon: "filter" },
    { label: "Group", action: "group" },
    { label: "Left 1", action: "left1", location: "left" },
    { label: "Left 2", action: "left2", location: "left" },
    {
      label: "Right1",
      action: "right1",
      location: "right",
      children: [
        { label: "Right 1.1", action: "right1.1", location: "right" },
        { label: "Right 1.2", action: "right1.2", location: "right" },
      ],
    },
  ];

  const handleMenuAction: MenuActionHandler = (action) => {
    console.log(`handleContextMenu ${action.menuId}`);
    return true;
  };

  const menuBuilder: MenuBuilder = (location: string) =>
    menuDescriptors.filter(
      (descriptor) =>
        descriptor.location === undefined || descriptor.location === location
    );

  const localMenuBuilder: MenuBuilder = (/* location: string */) => {
    // localMenuBuilder isn't using location, as we just return hardcoded options
    return [
      {
        label: "Local 1",
        action: "local1",
        options: { LookAtMeMa: "no-hands" },
      },
      { label: "Local 2", action: "local2" },
    ];
  };

  return (
    <ContextMenuProvider
      menuBuilder={menuBuilder}
      menuActionHandler={handleMenuAction}
    >
      <Flexbox style={{ width: 400, height: 200 }}>
        <ComponentWithMenu
          style={{ flex: 1, backgroundColor: "red" }}
          location="left"
        />
        <ContextMenuProvider menuBuilder={localMenuBuilder}>
          <ComponentWithMenu
            style={{ flex: 1, backgroundColor: "yellow" }}
            location="right"
          />
        </ContextMenuProvider>
      </Flexbox>
    </ContextMenuProvider>
  );
};
ContextMenuProviderWithLocationAwareMenuBuilder.displaySequence =
  displaySequence++;
