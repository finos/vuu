import { useCallback } from "react";
import { usePersistentState } from "../persistence/PersistenceContext";

/** Portal saved state key (in `vuu.portal`) for expanded navigation groups. */
export const NAV_EXPANDED_KEY = "nav/expanded";

const NONE: string[] = [];
const metadata = {
  label: "Expanded navigation groups",
  group: "Navigation",
};

/** Whether a navigation group is expanded, kept in the portal's saved state. */
export const useNavGroupExpansion = (groupId: string) => {
  const [expanded, setExpanded] = usePersistentState<string[]>(
    NAV_EXPANDED_KEY,
    NONE,
    metadata,
  );
  const open = Array.isArray(expanded) && expanded.includes(groupId);
  const setOpen = useCallback(
    (nextOpen: boolean) =>
      setExpanded((previous) => {
        const groups = Array.isArray(previous) ? previous : NONE;
        if (nextOpen) {
          return groups.includes(groupId) ? groups : [...groups, groupId];
        }
        return groups.filter((group) => group !== groupId);
      }),
    [groupId, setExpanded],
  );
  return [open, setOpen] as const;
};
