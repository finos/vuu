import { useCallback, useState } from "react";
import { usePersistedState } from "../persistence/PersistenceContext";

/** Portal saved state key (in `vuu.portal`) for expanded navigation groups. */
export const NAV_EXPANDED_KEY = "nav/expanded";

const NONE: string[] = [];
const metadata = {
  label: "Expanded navigation groups",
  group: "Navigation",
};

/** Whether a navigation group is expanded, kept in the portal's saved state. */
export const useNavGroupExpansion = (groupId: string) => {
  const { load, save } = usePersistedState();
  const [open, setOpenState] = useState(() => {
    const expanded = load<string[]>(NAV_EXPANDED_KEY);
    return Array.isArray(expanded) && expanded.includes(groupId);
  });
  const setOpen = useCallback(
    (nextOpen: boolean) => {
      setOpenState(nextOpen);
      const saved = load<string[]>(NAV_EXPANDED_KEY);
      const groups = Array.isArray(saved) ? saved : NONE;
      const expanded = nextOpen
        ? groups.includes(groupId)
          ? groups
          : [...groups, groupId]
        : groups.filter((group) => group !== groupId);
      save(expanded, NAV_EXPANDED_KEY, metadata);
    },
    [groupId, load, save],
  );
  return [open, setOpen] as const;
};
