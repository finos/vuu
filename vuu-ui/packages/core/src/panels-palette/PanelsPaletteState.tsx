import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { usePersistedState } from "../persistence/PersistenceContext";

/** Portal saved state key (in `vuu.portal`) for the pinned Panels palette. */
export const PANELS_PALETTE_PINNED_KEY = "workspace/palettePinned";

const pinnedMetadata = {
  group: "Workspaces",
  label: "Panels palette pinned open",
};

export interface PanelsPaletteState {
  readonly open: boolean;
  /** A pinned palette is open in every workspace and stays open after adding. */
  readonly pinned: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly setPinned: (pinned: boolean) => void;
  readonly toggleOpen: () => void;
}

const PanelsPaletteStateContext = createContext<PanelsPaletteState | undefined>(
  undefined,
);

export interface PanelsPaletteStateProviderProps {
  children: ReactNode;
  /** Open the palette initially, even if it isn't pinned. */
  defaultOpen?: boolean;
}

/**
 * Whether the Panels palette is open or pinned. Shared by `AddPanelButton`,
 * in the workspace header, and `PanelsPalette`, beside the workspace.
 * `PortalWorkspace` provides it. Pinning is kept in the portal's saved state.
 */
export const PanelsPaletteStateProvider = ({
  children,
  defaultOpen = false,
}: PanelsPaletteStateProviderProps) => {
  const { load, save } = usePersistedState();
  const [pinned, setPinnedState] = useState(
    () => load<boolean>(PANELS_PALETTE_PINNED_KEY) === true,
  );
  const [open, setOpenState] = useState(() => defaultOpen || pinned);

  const setPinned = useCallback(
    (nextPinned: boolean) => {
      setPinnedState(nextPinned);
      save(nextPinned, PANELS_PALETTE_PINNED_KEY, pinnedMetadata);
      if (nextPinned) {
        setOpenState(true);
      }
    },
    [save],
  );

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      setOpenState(nextOpen);
      if (!nextOpen && pinned) {
        setPinned(false);
      }
    },
    [pinned, setPinned],
  );

  const toggleOpen = useCallback(() => setOpen(!open), [open, setOpen]);

  const value = useMemo<PanelsPaletteState>(
    () => ({ open, pinned, setOpen, setPinned, toggleOpen }),
    [open, pinned, setOpen, setPinned, toggleOpen],
  );

  return (
    <PanelsPaletteStateContext.Provider value={value}>
      {children}
    </PanelsPaletteStateContext.Provider>
  );
};

/** The Panels palette state, undefined outside `PanelsPaletteStateProvider`. */
export const usePanelsPaletteState = () =>
  useContext(PanelsPaletteStateContext);
