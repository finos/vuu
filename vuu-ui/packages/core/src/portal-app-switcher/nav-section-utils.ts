import type { RemoteModuleDescriptor } from "../RemoteModuleDescriptor";
import { isNavigableModule, toNavigationPath } from "./nav-item-utils";

export interface PortalNavItem {
  href: string;
  /**
   * The module's Module Federation scope (`mfScope`), e.g.
   * `"vuuTableBrowser"`. Use it to recognise a particular module, e.g. in
   * `renderItemChildren`: it is set by the module's own build and must
   * match for the module to load, so it is the same whichever registry
   * supplies the module. The `moduleId` is not: a server-supplied registry
   * assigns its own, often numeric, ids.
   */
  mfScope: string;
  /**
   * The module's id in the registry that supplied it. It may be an opaque,
   * e.g. numeric, id; prefer `mfScope` to recognise a module.
   */
  moduleId: RemoteModuleDescriptor["id"];
  /** The module's unique name in its registry. */
  moduleName: string;
  navBadge?: string;
  navIconName?: string;
  navIconUrl?: string;
  navOrder?: number;
  notificationTopics?: string[];
  title: string;
}

export interface PortalNavSection {
  /** The first `navLocation` segment as a path, e.g. `/Trading`. */
  id: string;
  items: PortalNavItem[];
  title: string;
}

const compareNavOrder = (a?: number, b?: number) => {
  if (a === b) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return a - b;
};

const lowestNavOrder = ({ items }: PortalNavSection) =>
  items.reduce<number | undefined>(
    (lowest, { navOrder }) =>
      navOrder !== undefined && (lowest === undefined || navOrder < lowest)
        ? navOrder
        : lowest,
    undefined,
  );

/**
 * Groups modules into navigation sections by the first `navLocation` segment.
 *
 * - Nested modules (empty or `/` `navLocation`) and palette-only modules
 *   (no `path`) are excluded.
 * - An item's title is the remaining segments joined with `": "`. A
 *   single-segment location (`/Reports`) gives an item titled with that
 *   segment, in the section of the same name.
 * - Items are ordered by `navOrder`, then registration order.
 * - Sections are ordered by the lowest `navOrder` of their items; sections
 *   with no `navOrder` follow, in order of first appearance.
 */
export const buildNavSections = (
  registeredModules: RemoteModuleDescriptor[],
): PortalNavSection[] => {
  const sections = new Map<string, PortalNavSection>();

  for (const module of registeredModules) {
    if (!isNavigableModule(module)) {
      continue;
    }
    const {
      id,
      mfScope,
      name,
      navBadge,
      navIconName,
      navIconUrl,
      navLocation,
      navOrder,
      notificationTopics,
      path,
    } = module;
    const [sectionTitle, ...itemSegments] = navLocation
      .split("/")
      .filter(Boolean);
    const sectionId = `/${sectionTitle}`;
    let section = sections.get(sectionId);
    if (section === undefined) {
      section = { id: sectionId, items: [], title: sectionTitle };
      sections.set(sectionId, section);
    }
    const href = toNavigationPath(path);
    if (section.items.some((item) => item.href === href)) {
      continue;
    }
    section.items.push({
      href,
      mfScope,
      moduleId: id,
      moduleName: name,
      navBadge,
      navIconName,
      navIconUrl,
      navOrder,
      notificationTopics,
      title: itemSegments.length > 0 ? itemSegments.join(": ") : sectionTitle,
    });
  }

  // Array.prototype.sort is stable, so equal keys keep registration order.
  const result = [...sections.values()];
  for (const section of result) {
    section.items.sort((a, b) => compareNavOrder(a.navOrder, b.navOrder));
  }
  return result
    .map((section) => ({ section, order: lowestNavOrder(section) }))
    .sort((a, b) => compareNavOrder(a.order, b.order))
    .map(({ section }) => section);
};
