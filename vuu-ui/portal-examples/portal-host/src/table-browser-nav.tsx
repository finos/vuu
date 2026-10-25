import { type PortalNavItem, PortalNavVuuServers } from "@vuu-ui/core/portal";

/**
 * The Table Browser's Module Federation scope. Its nav item lists the Vuu
 * servers to browse. Module ids are assigned by the registry, and a
 * server-supplied registry uses its own (e.g. numeric) ids, so the module is
 * recognised by its scope, which the module's build fixes.
 */
export const TABLE_BROWSER_MF_SCOPE = "vuuTableBrowser";

export const isTableBrowserNavItem = ({ mfScope }: PortalNavItem) =>
  mfScope === TABLE_BROWSER_MF_SCOPE;

/** `PortalNav` `renderItemChildren`: the servers under Tables › Browse. */
export const renderItemChildren = (item: PortalNavItem) =>
  isTableBrowserNavItem(item) ? (
    <PortalNavVuuServers basePath={item.href} />
  ) : null;
