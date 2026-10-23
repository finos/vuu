import { useWindow } from "@salt-ds/window";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePersistedState } from "../persistence/PersistenceContext";
import {
  ALL_DISPLAY_MODES,
  isExpandedMode,
  type PortalNavCollapsedMode,
  type PortalNavDisplayMode,
} from "./portal-nav-types";

/** Portal saved state key (in `vuu.portal`) for the nav display mode. */
export const NAV_DISPLAY_MODE_KEY = "nav/displayMode";

const metadata = {
  label: "Navigation display mode",
  group: "Navigation",
};

const isDisplayMode = (value: unknown): value is PortalNavDisplayMode =>
  typeof value === "string" &&
  ALL_DISPLAY_MODES.includes(value as PortalNavDisplayMode);

const clampMode = (
  mode: PortalNavDisplayMode,
  allowed: readonly PortalNavDisplayMode[],
): PortalNavDisplayMode =>
  allowed.includes(mode) ? mode : (allowed[0] ?? "icons-and-text");

/** Viewport narrower than `width` px, tracked with matchMedia. */
const useNarrowViewport = (width: number | undefined) => {
  const targetWindow = useWindow() as Window | undefined | null;
  const query = useMemo(
    () =>
      width === undefined || typeof targetWindow?.matchMedia !== "function"
        ? undefined
        : targetWindow.matchMedia(`(max-width: ${width - 0.02}px)`),
    [targetWindow, width],
  );
  const [narrow, setNarrow] = useState(() => query?.matches ?? false);
  useEffect(() => {
    if (!query) {
      setNarrow(false);
      return;
    }
    setNarrow(query.matches);
    const onChange = (event: MediaQueryListEvent) => setNarrow(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [query]);
  return narrow;
};

export interface PortalNavDisplayModeProps {
  allowedDisplayModes?: readonly PortalNavDisplayMode[];
  autoCollapseBelow?: number;
  collapseTo?: PortalNavCollapsedMode;
  defaultDisplayMode?: PortalNavDisplayMode;
  displayMode?: PortalNavDisplayMode;
  onDisplayModeChange?: (displayMode: PortalNavDisplayMode) => void;
}

export interface PortalNavDisplayModeState {
  allowedDisplayModes: readonly PortalNavDisplayMode[];
  /** The mode shown, which is `icons` while auto collapsed. */
  displayMode: PortalNavDisplayMode;
  /** The mode chosen by the user (or the controlling parent). */
  selectedDisplayMode: PortalNavDisplayMode;
  setDisplayMode: (displayMode: PortalNavDisplayMode) => void;
  /** Collapse to `collapseTo`, or expand to the last expanded mode. */
  toggle: () => void;
}

/**
 * The nav's display mode: controlled or uncontrolled, the user's choice
 * kept in the portal's saved state, toggled with ⌘B / Ctrl+B.
 */
export const usePortalNavDisplayMode = ({
  allowedDisplayModes = ALL_DISPLAY_MODES,
  autoCollapseBelow,
  collapseTo = "icons",
  defaultDisplayMode = "icons-and-text",
  displayMode: displayModeProp,
  onDisplayModeChange,
}: PortalNavDisplayModeProps): PortalNavDisplayModeState => {
  const { load, save } = usePersistedState();
  const targetWindow = useWindow() as Window | undefined | null;
  const controlled = displayModeProp !== undefined;

  const [uncontrolledMode, setUncontrolledMode] =
    useState<PortalNavDisplayMode>(() => {
      const saved = load(NAV_DISPLAY_MODE_KEY);
      return isDisplayMode(saved) ? saved : defaultDisplayMode;
    });

  const selectedDisplayMode = clampMode(
    controlled ? displayModeProp : uncontrolledMode,
    allowedDisplayModes,
  );

  const lastExpanded = useRef<PortalNavDisplayMode>(
    isExpandedMode(selectedDisplayMode)
      ? selectedDisplayMode
      : isExpandedMode(defaultDisplayMode)
        ? defaultDisplayMode
        : "icons-and-text",
  );
  if (isExpandedMode(selectedDisplayMode)) {
    lastExpanded.current = selectedDisplayMode;
  }

  const narrow = useNarrowViewport(autoCollapseBelow);
  // The user expanded the nav while it was auto collapsed.
  const [expandedWhileNarrow, setExpandedWhileNarrow] = useState(false);
  useEffect(() => {
    if (!narrow) setExpandedWhileNarrow(false);
  }, [narrow]);
  const autoCollapsed =
    narrow &&
    !expandedWhileNarrow &&
    isExpandedMode(selectedDisplayMode) &&
    allowedDisplayModes.includes("icons");
  const displayMode = autoCollapsed ? "icons" : selectedDisplayMode;

  const setDisplayMode = useCallback(
    (mode: PortalNavDisplayMode) => {
      if (!allowedDisplayModes.includes(mode)) {
        return;
      }
      if (!controlled) {
        setUncontrolledMode(mode);
        save(mode, NAV_DISPLAY_MODE_KEY, metadata);
      }
      onDisplayModeChange?.(mode);
    },
    [allowedDisplayModes, controlled, onDisplayModeChange, save],
  );

  const toggle = useCallback(() => {
    if (autoCollapsed) {
      setExpandedWhileNarrow(true);
      return;
    }
    if (narrow && expandedWhileNarrow) {
      setExpandedWhileNarrow(false);
      return;
    }
    if (isExpandedMode(displayMode)) {
      const target = allowedDisplayModes.includes(collapseTo)
        ? collapseTo
        : (["icons", "minimized"] as const).find((mode) =>
            allowedDisplayModes.includes(mode),
          );
      if (target) setDisplayMode(target);
    } else {
      const target = allowedDisplayModes.includes(lastExpanded.current)
        ? lastExpanded.current
        : allowedDisplayModes.find(isExpandedMode);
      if (target) setDisplayMode(target);
    }
  }, [
    allowedDisplayModes,
    autoCollapsed,
    collapseTo,
    displayMode,
    expandedWhileNarrow,
    narrow,
    setDisplayMode,
  ]);

  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;
  useEffect(() => {
    if (!targetWindow) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === "b" &&
        !event.defaultPrevented
      ) {
        event.preventDefault();
        toggleRef.current();
      }
    };
    targetWindow.addEventListener("keydown", onKeyDown);
    return () => targetWindow.removeEventListener("keydown", onKeyDown);
  }, [targetWindow]);

  return {
    allowedDisplayModes,
    displayMode,
    selectedDisplayMode,
    setDisplayMode,
    toggle,
  };
};
