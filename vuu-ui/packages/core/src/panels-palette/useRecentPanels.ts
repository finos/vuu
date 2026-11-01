import type { TypedComponentTemplate } from "@vuu-ui/grid-layout";
import { useCallback, useState } from "react";
import { usePersistedState } from "../persistence/PersistenceContext";
import type { JsonValue } from "../persistence/StateDocument";
import type { PanelItem } from "./panel-items";

/** Portal saved state key (in `vuu.portal`) for recently added panels. */
export const RECENT_PANELS_KEY = "workspace/recentPanels";

/** The most recent panels kept. */
export const MAX_RECENT_PANELS = 10;

const metadata = { group: "Workspaces", label: "Recently added panels" };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isTemplate = (value: unknown): value is TypedComponentTemplate =>
  isRecord(value) &&
  isRecord(value.component) &&
  typeof value.component.type === "string" &&
  typeof value.component.version === "number";

const isPanelItem = (value: unknown): value is PanelItem =>
  isRecord(value) &&
  typeof value.key === "string" &&
  (value.kind === "module" || value.kind === "table") &&
  typeof value.label === "string" &&
  isTemplate(value.template);

const NONE: readonly PanelItem[] = [];

/**
 * Panels recently added to a workspace from the palette, most recent first,
 * kept in the portal's saved state (so per user). `addRecentPanel` moves an
 * item to the front.
 */
export const useRecentPanels = () => {
  const { load, save } = usePersistedState();
  const [recent, setRecent] = useState<readonly PanelItem[]>(() => {
    const saved = load(RECENT_PANELS_KEY);
    return Array.isArray(saved)
      ? (saved as unknown[]).filter(isPanelItem)
      : NONE;
  });
  const addRecentPanel = useCallback(
    (item: PanelItem) => {
      setRecent((current) => {
        const next = [
          item,
          ...current.filter(({ key }) => key !== item.key),
        ].slice(0, MAX_RECENT_PANELS);
        save(next as unknown as JsonValue, RECENT_PANELS_KEY, metadata);
        return next;
      });
    },
    [save],
  );
  return [recent, addRecentPanel] as const;
};
