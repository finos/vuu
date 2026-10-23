import { useCallback, useState } from "react";
import { usePersistedState } from "../persistence/PersistenceContext";

/**
 * Portal saved state key (in `vuu.portal`) for the sections a user has
 * collapsed in `PortalNav`. Sections are open unless listed. Separate from
 * `nav/expanded` (PortalAppSwitcher groups), whose groups are closed unless
 * listed.
 */
export const NAV_COLLAPSED_SECTIONS_KEY = "nav/collapsedSections";

const NONE: string[] = [];
const metadata = {
  label: "Collapsed navigation sections",
  group: "Navigation",
};

/** Collapsed `PortalNav` sections, kept in the portal's saved state. */
export const usePortalNavSectionCollapse = () => {
  const { load, save } = usePersistedState();
  const [collapsed, setCollapsed] = useState<readonly string[]>(() => {
    const saved = load<string[]>(NAV_COLLAPSED_SECTIONS_KEY);
    return Array.isArray(saved) ? saved : NONE;
  });
  const setSectionCollapsed = useCallback(
    (sectionId: string, nextCollapsed: boolean) => {
      setCollapsed((current) => {
        const next = nextCollapsed
          ? current.includes(sectionId)
            ? current
            : [...current, sectionId]
          : current.filter((id) => id !== sectionId);
        if (next !== current) {
          save([...next], NAV_COLLAPSED_SECTIONS_KEY, metadata);
        }
        return next;
      });
    },
    [save],
  );
  return [collapsed, setSectionCollapsed] as const;
};
