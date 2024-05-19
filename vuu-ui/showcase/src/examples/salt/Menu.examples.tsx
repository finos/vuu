import {
  Button,
  Card,
  Menu,
  MenuGroup,
  MenuItem,
  MenuPanel,
  MenuProps,
  MenuTrigger,
} from "@salt-ds/core";
import {
  CopyIcon,
  ExportIcon,
  MicroMenuIcon,
  PasteIcon,
  SettingsIcon,
} from "@salt-ds/icons";
import { useState } from "react";
import { VirtualElement } from "@floating-ui/react";

let displaySequence = 1;

export const SingleLevel = (args: MenuProps) => {
  return (
    <Menu {...args}>
      <MenuTrigger>
        <Button variant="secondary" aria-label="Open Menu">
          <MicroMenuIcon aria-hidden />
        </Button>
      </MenuTrigger>
      <MenuPanel>
        <MenuItem
          onClick={() => {
            alert("Copy");
          }}
        >
          Copy
        </MenuItem>
        <MenuItem
          onClick={() => {
            alert("Paste");
          }}
        >
          Paste
        </MenuItem>
        <MenuItem
          onClick={() => {
            alert("Export");
          }}
        >
          Export
        </MenuItem>
        <MenuItem
          onClick={() => {
            alert("Settings");
          }}
        >
          Settings
        </MenuItem>
      </MenuPanel>
    </Menu>
  );
};
SingleLevel.displaySequence = displaySequence++;

function EditStylingMenu() {
  return (
    <Menu>
      <MenuTrigger>
        <MenuItem>Edit styling</MenuItem>
      </MenuTrigger>
      <MenuPanel>
        <MenuItem
          onClick={() => {
            alert("Column");
          }}
        >
          Column
        </MenuItem>
        <MenuItem
          onClick={() => {
            alert("Cell");
          }}
        >
          Cell
        </MenuItem>
        <MenuItem
          onClick={() => {
            alert("Row");
          }}
        >
          Row
        </MenuItem>
      </MenuPanel>
    </Menu>
  );
}
EditStylingMenu.displaySequence = displaySequence++;

function ClearStylingMenu() {
  return (
    <Menu>
      <MenuTrigger>
        <MenuItem>Clear styling</MenuItem>
      </MenuTrigger>
      <MenuPanel>
        <MenuItem
          onClick={() => {
            alert("Column");
          }}
        >
          Column
        </MenuItem>
        <MenuItem
          onClick={() => {
            alert("Cell");
          }}
        >
          Cell
        </MenuItem>
        <MenuItem
          onClick={() => {
            alert("Row");
          }}
        >
          Row
        </MenuItem>
      </MenuPanel>
    </Menu>
  );
}
ClearStylingMenu.displaySequence = displaySequence++;

export const MultiLevel = (args: MenuProps) => {
  return (
    <Menu {...args}>
      <MenuTrigger>
        <Button variant="secondary" aria-label="Open Menu">
          <MicroMenuIcon aria-hidden />
        </Button>
      </MenuTrigger>
      <MenuPanel>
        <MenuItem
          onClick={() => {
            alert("Copy");
          }}
        >
          Copy
        </MenuItem>
        <EditStylingMenu />
        <ClearStylingMenu />
        <MenuItem
          onClick={() => {
            alert("Export");
          }}
        >
          Export
        </MenuItem>
        <MenuItem
          onClick={() => {
            alert("Settings");
          }}
        >
          Settings
        </MenuItem>
      </MenuPanel>
    </Menu>
  );
};
MultiLevel.displaySequence = displaySequence++;

export const GroupedItems = (args: MenuProps) => {
  return (
    <Menu {...args}>
      <MenuTrigger>
        <Button variant="secondary" aria-label="Open Menu">
          <MicroMenuIcon aria-hidden />
        </Button>
      </MenuTrigger>
      <MenuPanel>
        <MenuGroup label="Actions">
          <MenuItem>Copy</MenuItem>
          <MenuItem>Paste</MenuItem>
        </MenuGroup>
        <MenuGroup label="Styling">
          <EditStylingMenu />
          <ClearStylingMenu />
        </MenuGroup>
        <MenuGroup label="Configurations">
          <MenuItem>Export</MenuItem>
          <MenuItem>Settings</MenuItem>
        </MenuGroup>
      </MenuPanel>
    </Menu>
  );
};
GroupedItems.displaySequence = displaySequence++;

export const SeparatorOnly = (args: MenuProps) => {
  return (
    <Menu {...args}>
      <MenuTrigger>
        <Button variant="secondary" aria-label="Open Menu">
          <MicroMenuIcon aria-hidden />
        </Button>
      </MenuTrigger>
      <MenuPanel>
        <MenuGroup>
          <MenuItem>Copy</MenuItem>
          <MenuItem>Paste</MenuItem>
        </MenuGroup>
        <MenuGroup>
          <EditStylingMenu />
          <ClearStylingMenu />
        </MenuGroup>
        <MenuGroup>
          <MenuItem>Export</MenuItem>
          <MenuItem>Settings</MenuItem>
        </MenuGroup>
      </MenuPanel>
    </Menu>
  );
};
SeparatorOnly.displaySequence = displaySequence++;

export const Icons = (args: MenuProps) => {
  return (
    <Menu {...args}>
      <MenuTrigger>
        <Button variant="secondary" aria-label="Open Menu">
          <MicroMenuIcon aria-hidden />
        </Button>
      </MenuTrigger>
      <MenuPanel>
        <MenuItem>
          <CopyIcon aria-hidden />
          Copy
        </MenuItem>
        <MenuItem>
          <ExportIcon aria-hidden />
          Export
        </MenuItem>
        <MenuItem>
          <SettingsIcon aria-hidden />
          Settings
        </MenuItem>
      </MenuPanel>
    </Menu>
  );
};
Icons.displaySequence = displaySequence++;

export const IconWithGroups = (args: MenuProps) => {
  return (
    <Menu {...args}>
      <MenuTrigger>
        <Button variant="secondary" aria-label="Open Menu">
          <MicroMenuIcon aria-hidden />
        </Button>
      </MenuTrigger>
      <MenuPanel>
        <MenuGroup>
          <MenuItem>
            <CopyIcon aria-hidden />
            Copy
          </MenuItem>
          <MenuItem disabled>
            <PasteIcon aria-hidden />
            Paste
          </MenuItem>
        </MenuGroup>
        <MenuGroup label="Styling">
          <EditStylingMenu />
          <ClearStylingMenu />
        </MenuGroup>
        <MenuGroup label="Configurations">
          <MenuItem>
            <ExportIcon aria-hidden />
            Export
          </MenuItem>
          <MenuItem>
            <SettingsIcon aria-hidden />
            Settings
          </MenuItem>
        </MenuGroup>
      </MenuPanel>
    </Menu>
  );
};
IconWithGroups.displaySequence = displaySequence++;

export const ContextMenu = () => {
  const [virtualElement, setVirtualElement] = useState<VirtualElement | null>(
    null
  );
  const [open, setOpen] = useState(false);
  return (
    <>
      <Card
        style={{
          width: 300,
          aspectRatio: 2 / 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          //React 16 support
          event.persist();
          setVirtualElement({
            getBoundingClientRect: () => ({
              width: 0,
              height: 0,
              x: event.clientX,
              y: event.clientY,
              top: event.clientY,
              right: event.clientX,
              bottom: event.clientY,
              left: event.clientX,
            }),
          });
          setOpen(true);
        }}
      >
        Right click here
      </Card>
      <Menu
        getVirtualElement={() => virtualElement}
        open={open}
        onOpenChange={setOpen}
      >
        <MenuPanel>
          <MenuItem>Copy</MenuItem>
          <MenuItem>Move</MenuItem>
          <MenuItem>Delete</MenuItem>
        </MenuPanel>
      </Menu>
    </>
  );
};
ContextMenu.displaySequence = displaySequence++;
