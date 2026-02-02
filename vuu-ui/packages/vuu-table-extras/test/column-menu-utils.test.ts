import { describe, it, expect, vi } from "vitest";
import { Menu, MenuItem, MenuPanel } from "@salt-ds/core";
import { buildPinMenuItems } from "../src/column-menu/column-menu-utils";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import React from "react";

vi.mock("@salt-ds/core", () => {
  const Menu = (props) => React.createElement("div", props, props.children);
  const MenuItem = (props) => React.createElement("div", props, props.children);
  const MenuPanel = (props) =>
    React.createElement("div", props, props.children);
  const MenuTrigger = (props) =>
    React.createElement("div", props, props.children);
  return { Menu, MenuItem, MenuPanel, MenuTrigger };
});

const clickHandler = vi.fn();

describe("buildPinMenuItems", () => {
  it("builds Unpin + Pin menu when pin = 'left' (shows only pin-right option)", () => {
    const col = {
      name: "c2",
      serverDataType: "string",
      pin: "left",
    } as ColumnDescriptor;
    const items = buildPinMenuItems(col, clickHandler);

    expect(items.length).toBe(2);

    const unpin = items[0];
    expect(unpin.type).toBe(MenuItem);
    expect(unpin.props["data-menu-action-id"]).toBe("unpin-column");

    const menu = items[1];
    const [, panel] = Array.isArray(menu.props.children)
      ? menu.props.children
      : [undefined, menu.props.children];
    const panelChildren = Array.isArray(panel.props.children)
      ? panel.props.children
      : [panel.props.children];

    expect(
      panelChildren.map((child) => child.props["data-menu-action-id"]),
    ).toEqual(["pin-column-right"]);
  });

  it("builds Unpin + Pin menu when pin = 'right' (shows only pin-left option)", () => {
    const col = {
      name: "c2",
      serverDataType: "string",
      pin: "right",
    } as ColumnDescriptor;
    const items = buildPinMenuItems(col, clickHandler);

    expect(items.length).toBe(2);

    const unpin = items[0];
    expect(unpin.type).toBe(MenuItem);
    expect(unpin.props["data-menu-action-id"]).toBe("unpin-column");

    const menu = items[1];
    const [, panel] = Array.isArray(menu.props.children)
      ? menu.props.children
      : [undefined, menu.props.children];
    const panelChildren = Array.isArray(panel.props.children)
      ? panel.props.children
      : [panel.props.children];

    expect(
      panelChildren.map((child) => child.props["data-menu-action-id"]),
    ).toEqual(["pin-column-left"]);
  });

  [undefined, false].forEach((pinValue) => {
    it(`builds a Pin menu when pin is ${pinValue} (shows left & right)`, () => {
      const col = {
        name: "c1",
        serverDataType: "string",
        pin: pinValue,
      } as ColumnDescriptor;
      const items = buildPinMenuItems(col, clickHandler);
      expect(items.length).toBe(1);

      const menu = items[0];
      expect(menu.type).toBe(Menu);

      const [, panel] = Array.isArray(menu.props.children)
        ? menu.props.children
        : [undefined, menu.props.children];
      expect(panel.type).toBe(MenuPanel);

      const panelChildren = Array.isArray(panel.props.children)
        ? panel.props.children
        : [panel.props.children];
      const ids = panelChildren.map(
        (child) => child.props["data-menu-action-id"],
      );
      expect(ids).toEqual(["pin-column-left", "pin-column-right"]);
    });
  });
});
