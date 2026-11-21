import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type ContextPanelClaimOptions,
  type ContextPanelReleaseReason,
  useContextPanelSlot,
} from "../context-panel/ContextPanelSlot";
import { usePersistedState } from "../persistence/PersistenceContext";

/** Portal saved state key (in `vuu.portal`) for the pinned Panels palette. */
export const PANELS_PALETTE_PINNED_KEY = "workspace/palettePinned";

const pinnedMetadata = {
  group: "Workspaces",
  label: "Panels palette pinned open",
};

/** The context panel title while it shows the Panels palette. */
export const PANELS_PALETTE_TITLE = "Panels";
/** The title instead while the palette shows its Tables tab. */
export const TABLES_PALETTE_TITLE = "Tables";

// The palette opens beside the user's work, e.g. a new workspace's name in
// edit mode, so it leaves focus there. Inline, so it never covers the
// workspace's drop targets.
const claimOptions: ContextPanelClaimOptions = {
  autoFocus: false,
  keepOnNavigation: true,
  placement: "inline",
};

export interface PanelsPaletteState {
  /** Whether an "Add panel" control (`AddPanelButton`) is mounted. */
  readonly available: boolean;
  /**
   * Owns the shell's context panel while it shows the palette. The palette
   * displays itself there when this owns it.
   */
  readonly contextPanelOwner: object;
  readonly open: boolean;
  /** A pinned palette is open in every workspace and stays open after adding. */
  readonly pinned: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly setPinned: (pinned: boolean) => void;
  /** Sets the context panel title, which follows the palette's tab. */
  readonly setTitle: (title: string) => void;
  readonly toggleOpen: () => void;
  /**
   * Registers an "Add panel" control, making the palette available. Returns
   * a function to unregister it.
   */
  readonly register: () => () => void;
}

const PanelsPaletteStateContext = createContext<PanelsPaletteState | undefined>(
  undefined,
);

export interface PanelsPaletteStateProviderProps {
  children: ReactNode;
  /** Open the palette initially, even if it isn't pinned. */
  defaultOpen?: boolean;
  /**
   * Pin the palette initially (or not), instead of following the user's
   * saved choice. Pinning is then not saved, e.g. for a Browse page whose
   * palette is always pinned when the page opens.
   */
  defaultPinned?: boolean;
}

/**
 * Whether the Panels palette is open or pinned. Shared by `AddPanelButton`,
 * in the workspace header, and `PanelsPalette`. `PortalWorkspace` provides
 * it. Pinning is kept in the portal's saved state.
 *
 * Within the shell's context panel (`ShellContextPanelProvider`), an open
 * palette claims the panel, titled "Panels" ("Tables" while the palette
 * shows its Tables tab), once an `AddPanelButton` is
 * mounted. It keeps the panel when the portal navigates and releases it
 * when closed or unmounted. Closing the panel (close button or Escape)
 * closes and unpins the palette; another owner claiming the panel, e.g. a
 * module showing its context panel, closes it but keeps it pinned.
 */
export const PanelsPaletteStateProvider = ({
  children,
  defaultOpen = false,
  defaultPinned,
}: PanelsPaletteStateProviderProps) => {
  const { load, save } = usePersistedState();
  const savePinned = defaultPinned === undefined;
  const [pinned, setPinnedState] = useState(
    () => defaultPinned ?? load<boolean>(PANELS_PALETTE_PINNED_KEY) === true,
  );
  const [open, setOpenState] = useState(() => defaultOpen || pinned);

  const setPinned = useCallback(
    (nextPinned: boolean) => {
      setPinnedState(nextPinned);
      if (savePinned) {
        save(nextPinned, PANELS_PALETTE_PINNED_KEY, pinnedMetadata);
      }
      if (nextPinned) {
        setOpenState(true);
      }
    },
    [save, savePinned],
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

  const [registrations, setRegistrations] = useState(0);
  const register = useCallback(() => {
    setRegistrations((count) => count + 1);
    return () => setRegistrations((count) => count - 1);
  }, []);
  const available = registrations > 0;

  const [contextPanelOwner] = useState<object>(() => ({}));
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;
  const handleRelease = useCallback((reason: ContextPanelReleaseReason) => {
    if (reason === "close") {
      setOpenRef.current(false);
    } else {
      setOpenState(false);
    }
  }, []);
  const slot = useContextPanelSlot();
  const claim = slot?.claim;
  const release = slot?.release;
  const shown = open && available;
  const [title, setTitle] = useState(PANELS_PALETTE_TITLE);
  const titleRef = useRef(title);
  titleRef.current = title;
  useEffect(() => {
    if (shown && claim && release) {
      claim(contextPanelOwner, titleRef.current, handleRelease, claimOptions);
      return () => release(contextPanelOwner);
    }
  }, [claim, contextPanelOwner, handleRelease, release, shown]);
  // Claiming again while shown only updates the title (the palette leaves
  // focus where it is), so the panel is not released and reopened.
  const shownRef = useRef(shown);
  shownRef.current = shown;
  useEffect(() => {
    if (shownRef.current && claim) {
      claim(contextPanelOwner, title, handleRelease, claimOptions);
    }
  }, [claim, contextPanelOwner, handleRelease, title]);

  const value = useMemo<PanelsPaletteState>(
    () => ({
      available,
      contextPanelOwner,
      open,
      pinned,
      register,
      setOpen,
      setPinned,
      setTitle,
      toggleOpen,
    }),
    [
      available,
      contextPanelOwner,
      open,
      pinned,
      register,
      setOpen,
      setPinned,
      toggleOpen,
    ],
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
