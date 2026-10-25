import { buildNavSections, PortalNavVuuServers } from "@vuu-ui/core/portal";
import { isValidElement } from "react";
import { describe, expect, it } from "vitest";
import { localPortalModuleRegistry } from "../src/local-module-registry";
import {
  isTableBrowserNavItem,
  renderItemChildren,
} from "../src/table-browser-nav";

/**
 * The local registry as a server would supply it: numeric ids, and names
 * and client identifiers of the server's choosing.
 */
const serverSuppliedModules = localPortalModuleRegistry.modules.map(
  (module, index) => ({
    ...module,
    clientIdentifier: `client-${index}`,
    id: 1000 + index,
    name: `module-${index}`,
  }),
);

const navItems = (modules = serverSuppliedModules) =>
  buildNavSections(modules).flatMap(({ items }) => items);

describe("Tables › Browse nav item", () => {
  it("lists the servers under the table browser with a server-supplied registry", () => {
    const items = navItems();
    const browse = items.filter(isTableBrowserNavItem);
    expect(browse).toHaveLength(1);
    expect(browse[0]).toMatchObject({
      href: "/tables/browse",
      moduleId: expect.any(Number),
    });

    const children = renderItemChildren(browse[0]);
    expect(isValidElement(children)).toBe(true);
    expect(isValidElement(children) && children.type).toBe(PortalNavVuuServers);
    expect(
      isValidElement<{ basePath: string }>(children) && children.props.basePath,
    ).toBe("/tables/browse");
  });

  it("lists the servers with the local registry too", () => {
    const browse = navItems(localPortalModuleRegistry.modules).filter(
      isTableBrowserNavItem,
    );
    expect(browse.map(({ moduleId }) => moduleId)).toEqual([
      "vuu-table-browser",
    ]);
  });

  it("gives no other item children", () => {
    for (const item of navItems().filter(
      (item) => !isTableBrowserNavItem(item),
    )) {
      expect(renderItemChildren(item)).toBeNull();
    }
  });
});
