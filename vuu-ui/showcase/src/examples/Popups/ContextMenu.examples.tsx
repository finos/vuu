import { Flexbox } from "@vuu-ui/vuu-layout";

import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuPanel,
  MenuTrigger,
  type MenuProps,
} from "@salt-ds/core";
import {
  type ContextMenuItemDescriptor,
  ContextMenuProvider,
  MenuActionHandler,
  MenuBuilder,
  useContextMenu,
} from "@vuu-ui/vuu-context-menu";

import { Button } from "@salt-ds/core";

import { VirtualElement } from "@floating-ui/dom";
import {
  HTMLAttributes,
  MouseEvent,
  MouseEventHandler,
  RefCallback,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

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

const SampleContextMenu = ({
  onClickMenuItem,
  ...props
}: Pick<MenuProps, "getVirtualElement" | "open"> & {
  onClickMenuItem?: (id: string) => void;
}) => (
  <Menu {...props}>
    <MenuPanel>
      <Menu>
        <MenuTrigger>
          <MenuItem>Item 1</MenuItem>
        </MenuTrigger>
        <MenuPanel>
          <MenuGroup>
            <MenuItem onClick={() => onClickMenuItem?.("item-1.1")}>
              Item 1.1{" "}
            </MenuItem>
            <MenuItem onClick={() => onClickMenuItem?.("item-1.2")}>
              Item 1.2
            </MenuItem>
            <MenuItem onClick={() => onClickMenuItem?.("item-1.3")}>
              Item 1.3
            </MenuItem>
          </MenuGroup>
          <MenuGroup>
            <MenuItem>Item 1.4</MenuItem>
            <MenuItem>Item 1.5</MenuItem>
          </MenuGroup>
        </MenuPanel>
      </Menu>
      <MenuItem>Item 2</MenuItem>
      <Menu>
        <MenuTrigger>
          <MenuItem>Item 3</MenuItem>
        </MenuTrigger>
        <MenuPanel>
          <Menu>
            <MenuTrigger>
              <MenuItem>Item 3.1</MenuItem>
            </MenuTrigger>
            <MenuPanel>
              <MenuItem>Item 3.1.1 </MenuItem>
              <MenuItem>Item 3.1.2</MenuItem>
              <MenuItem>Item 3.1.3</MenuItem>
              <MenuItem>Item 3.1.4</MenuItem>
            </MenuPanel>
          </Menu>
          <MenuItem>Item 3.2</MenuItem>
          <MenuItem>Item 3.3</MenuItem>
          <MenuItem>Item 3.4</MenuItem>
        </MenuPanel>
      </Menu>
    </MenuPanel>
  </Menu>
);

const NullVirtualElement: VirtualElement = {
  getBoundingClientRect: () => ({
    height: 0,
    width: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    x: 0,
    y: 0,
  }),
};
export const DefaultContextMenu = () => {
  const [virtualElement, setVirtualElement] =
    useState<VirtualElement>(NullVirtualElement);
  const [open, setOpen] = useState(true);
  const callbackRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    if (el) {
      const { top, left } = el.getBoundingClientRect();
      setVirtualElement({
        getBoundingClientRect: () => ({
          width: 0,
          height: 0,
          x: left,
          y: top,
          top,
          right: 0,
          bottom: 0,
          left,
        }),
      });
    }
  }, []);

  const onClickMenuItem = useCallback((id: string) => {
    console.log(`menuItem clicked ${id}`);
    setOpen(false);
  }, []);

  return (
    <div
      ref={callbackRef}
      style={{
        background: "ivory",
        height: 300,
        width: 300,
        margin: 100,
      }}
    >
      <SampleContextMenu
        getVirtualElement={() => virtualElement}
        onClickMenuItem={onClickMenuItem}
        open={open}
      />
    </div>
  );
};

export const FlatContextMenu = () => {
  const { ref } = usePosition();

  return (
    <div
      ref={ref}
      style={{
        background: "ivory",
        height: 300,
        width: 300,
        margin: 100,
      }}
    >
      <Menu open={true}>
        <MenuPanel>
          <MenuGroup>
            <MenuItem>Item 1.1</MenuItem>
            <MenuItem>Item 1.2</MenuItem>
            <MenuItem>Item 1.3</MenuItem>
          </MenuGroup>
          <MenuGroup>
            <MenuItem>Item 1.4</MenuItem>
            <MenuItem>Item 1.5</MenuItem>
            <MenuItem>Item 3.1.1</MenuItem>
            <MenuItem>Item 3.1.2</MenuItem>
            <MenuItem>Item 3.1.3</MenuItem>
            <MenuItem>Item 3.1.4</MenuItem>
            <MenuItem>Item 3.2</MenuItem>
            <MenuItem>Item 3.3</MenuItem>
            <MenuItem>Item 3.3</MenuItem>
          </MenuGroup>
        </MenuPanel>
      </Menu>
    </div>
  );
};

export const AdditionalNesting = () => {
  return (
    <div style={{ background: "ivory", height: "100vh", width: "100vw" }}>
      <Menu open={true}>
        <MenuPanel>
          <Menu>
            <MenuTrigger>
              <MenuItem>Item 1</MenuItem>
            </MenuTrigger>
            <MenuPanel>
              <MenuItem>Item 1.1 </MenuItem>
              <MenuItem>Item 1.2</MenuItem>
              <MenuItem>Item 1.3</MenuItem>
              <MenuItem>Item 1.4</MenuItem>
              <MenuItem>Item 1.5</MenuItem>
            </MenuPanel>
          </Menu>
          <Menu>
            <MenuTrigger>
              <MenuItem>Item 2</MenuItem>
            </MenuTrigger>
            <MenuPanel>
              <Menu>
                <MenuTrigger>
                  <MenuItem>Item 2.1</MenuItem>
                </MenuTrigger>
                <MenuPanel>
                  <MenuGroup>
                    <MenuItem>Item 2.1.1 </MenuItem>
                    <MenuItem>Item 2.1.2</MenuItem>
                    <MenuItem>Item 2.1.3</MenuItem>
                  </MenuGroup>
                  <MenuGroup>
                    <MenuItem>Item 2.1.4</MenuItem>
                    <MenuItem>Item 2.1.5</MenuItem>
                  </MenuGroup>
                </MenuPanel>
              </Menu>
              <MenuItem>Item 2.2</MenuItem>
              <MenuItem>Item 2.3</MenuItem>
              <MenuGroup>
                <MenuItem>Item 2.4</MenuItem>
                <MenuItem>Item 2.5</MenuItem>
              </MenuGroup>
            </MenuPanel>
          </Menu>
        </MenuPanel>
      </Menu>
    </div>
  );
};

export const ContextMenuPopup = () => {
  const [open, setOpen] = useState(false);
  const onClickMenuItem = useCallback((id: string) => {
    console.log(`menuItem clicked ${id}`);
    setOpen(false);
  }, []);
  const [virtualElement, setVirtualElement] = useState<VirtualElement | null>(
    null,
  );

  const handleClick = (evt: MouseEvent<HTMLElement>) => {
    setVirtualElement({
      getBoundingClientRect: () => ({
        width: 0,
        height: 0,
        x: evt.clientX,
        y: evt.clientY,
        top: evt.clientY,
        right: evt.clientX,
        bottom: evt.clientY,
        left: evt.clientX,
      }),
    });
    setOpen(true);
  };

  return (
    <>
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
        <Button onClick={handleClick} style={{ justifySelf: "flex-end" }}>
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
          <Button onClick={handleClick} style={{ justifySelf: "flex-end" }}>
            Show Context Menu
          </Button>
          <Button onClick={handleClick} style={{ justifySelf: "flex-end" }}>
            Show Context Menu
          </Button>
          <Button onClick={handleClick} style={{ justifySelf: "flex-end" }}>
            Show Context Menu
          </Button>
        </div>
        <Button onClick={handleClick} style={{ justifySelf: "flex-end" }}>
          Show Context Menu
        </Button>
      </div>
      <Menu
        getVirtualElement={() => virtualElement}
        open={open}
        onOpenChange={setOpen}
      >
        <MenuPanel>
          <Menu>
            <MenuTrigger>
              <MenuItem onClick={() => onClickMenuItem("item-1")}>
                Item 1
              </MenuItem>
            </MenuTrigger>
            <MenuPanel>
              <MenuGroup>
                <MenuItem>Item 1.1 </MenuItem>
                <MenuItem>Item 1.2</MenuItem>
                <MenuItem>Item 1.3</MenuItem>
              </MenuGroup>
              <MenuGroup>
                <MenuItem>Item 2.1.4</MenuItem>
                <MenuItem>Item 2.1.5</MenuItem>
              </MenuGroup>
            </MenuPanel>
          </Menu>
          <MenuItem>Item 2</MenuItem>
          <Menu>
            <MenuTrigger>
              <MenuItem>Item 3</MenuItem>
            </MenuTrigger>
            <MenuPanel>
              <MenuGroup>
                <MenuItem>Item 3.1 </MenuItem>
                <MenuItem>Item 3.2</MenuItem>
                <MenuItem>Item 3.3</MenuItem>
              </MenuGroup>
              <MenuGroup>
                <MenuItem>Item 3.4</MenuItem>
                <MenuItem>Item 3.5</MenuItem>
              </MenuGroup>
            </MenuPanel>
          </Menu>
        </MenuPanel>
      </Menu>
    </>
  );
};

const ComponentWithMenu = ({
  location,
  ...props
}: HTMLAttributes<HTMLDivElement> & { location: "left" | "right" }) => {
  const showContextMenu = useContextMenu();
  const handleContextMenu: MouseEventHandler<HTMLDivElement> = (e) => {
    showContextMenu(e, location, { type: "outer" });
  };
  return <div {...props} onContextMenu={handleContextMenu} />;
};

export const SimpleContextMenuProvider = () => {
  const menuDescriptors: ContextMenuItemDescriptor[] = [
    { label: "Sort", id: "sort" },
    { label: "Filter", id: "filter" },
    { label: "Group", id: "group" },
  ];

  const handleMenuAction: MenuActionHandler = (id: string) => {
    console.log(`handleContextMenu ${id}`);
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

export const ContextMenuProviderWithLocationAwareMenuBuilder = () => {
  const menuDescriptors: ContextMenuItemDescriptor[] = [
    { label: "Sort", id: "sort", icon: "sort-up" },
    { label: "Filter", id: "filter", icon: "filter" },
    { label: "Group", id: "group" },
    { label: "Left 1", id: "left1", location: "left" },
    { label: "Left 2", id: "left2", location: "left" },
    {
      label: "Right1",
      id: "right1",
      location: "right",
      children: [
        { label: "Right 1.1", id: "right1.1", location: "right" },
        { label: "Right 1.2", id: "right1.2", location: "right" },
      ],
    },
  ];

  const handleMenuAction: MenuActionHandler = (menuItemId) => {
    console.log(`handleContextMenu ${menuItemId}`);
    return true;
  };

  const menuBuilder: MenuBuilder = (location: string) =>
    menuDescriptors.filter(
      (descriptor) =>
        descriptor.location === undefined || descriptor.location === location,
    );

  const localMenuBuilder: MenuBuilder = (/* location: string */) => {
    // localMenuBuilder isn't using location, as we just return hardcoded options
    return [
      {
        label: "Local 1",
        id: "local1",
        options: { LookAtMeMa: "no-hands" },
      },
      { label: "Local 2", id: "local2" },
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
