import {
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ContextPanel } from "./ContextPanel";
import {
  ContextPanelProvider,
  type ShowContextPanel,
} from "./ContextPanelProvider";

/**
 * Where a remote module's context panel content is displayed: in the panel
 * hosted by the shell, or in a panel within the module's own frame.
 */
export type ContextPanelPlacement = "shell" | "module";

type ContextPanelOwner = object;

/**
 * A context panel that displays content owned by others. Owners keep their
 * content in their own React tree and portal it into `target`, so it sees
 * their context rather than that of the panel's host.
 */
export interface ContextPanelSlot {
  /** Opens the panel for `owner`. A different current owner is released. */
  readonly claim: (
    owner: ContextPanelOwner,
    title: string,
    onRelease: () => void,
  ) => void;
  /** Closes the panel, whoever owns it. */
  readonly close: () => void;
  readonly owner?: ContextPanelOwner;
  /** Closes the panel, if `owner` owns it. */
  readonly release: (owner: ContextPanelOwner) => void;
  readonly setTarget: (target: HTMLElement | null) => void;
  readonly target: HTMLElement | null;
  readonly title?: string;
}

export const ContextPanelSlotContext = createContext<
  ContextPanelSlot | undefined
>(undefined);

export const useContextPanelSlot = () => useContext(ContextPanelSlotContext);

type SlotState = {
  readonly owner: ContextPanelOwner;
  readonly title: string;
};

/** Creates a slot. Provide it, and render a `ContextPanelSlotHost` for it. */
export const useCreateContextPanelSlot = (): ContextPanelSlot => {
  const [state, setState] = useState<SlotState>();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const currentOwner = useRef<{
    owner: ContextPanelOwner;
    onRelease: () => void;
  }>(undefined);
  const trigger = useRef<HTMLElement | null>(null);
  const targetRef = useRef(target);
  targetRef.current = target;

  const claim = useCallback<ContextPanelSlot["claim"]>(
    (owner, title, onRelease) => {
      const current = currentOwner.current;
      if (current === undefined) {
        const { activeElement } = targetRef.current?.ownerDocument ?? document;
        trigger.current =
          activeElement instanceof HTMLElement ? activeElement : null;
      } else if (current.owner !== owner) {
        current.onRelease();
      }
      currentOwner.current = { owner, onRelease };
      setState({ owner, title });
    },
    [],
  );

  const release = useCallback<ContextPanelSlot["release"]>((owner) => {
    if (currentOwner.current?.owner !== owner) {
      return;
    }
    currentOwner.current = undefined;
    setState(undefined);
    const element = trigger.current;
    trigger.current = null;
    if (element) {
      requestAnimationFrame(() => {
        if (element.isConnected) {
          element.focus();
        }
      });
    }
  }, []);

  const close = useCallback(() => {
    const current = currentOwner.current;
    if (current) {
      current.onRelease();
      release(current.owner);
    }
  }, [release]);

  return useMemo(
    () => ({
      claim,
      close,
      owner: state?.owner,
      release,
      setTarget,
      target,
      title: state?.title,
    }),
    [claim, close, release, state, target],
  );
};

export interface ContextPanelSlotHostProps {
  readonly className?: string;
  readonly id?: string;
  readonly panelId?: string;
  readonly slot: ContextPanelSlot;
}

/** Displays the slot's panel. Owners portal their content into it. */
export const ContextPanelSlotHost = ({
  className,
  id,
  panelId,
  slot,
}: ContextPanelSlotHostProps) => (
  <div className={className} id={id}>
    <ContextPanel
      contentRef={slot.setTarget}
      expanded={slot.owner !== undefined}
      id={panelId}
      onClose={slot.close}
      overlay
      title={slot.title}
    />
  </div>
);

/**
 * Provides the context panel API for its subtree, displaying content in the
 * nearest slot. Content stays in this subtree's React tree, rendered with a
 * React portal. Without a slot, the inherited implementation is used.
 */
export const SlotContextPanelProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const slot = useContextPanelSlot();
  const [owner] = useState<ContextPanelOwner>(() => ({}));
  const [content, setContent] = useState<ReactElement>();
  const claim = slot?.claim;
  const release = slot?.release;

  const handleRelease = useCallback(() => setContent(undefined), []);

  const showContextPanel = useCallback<ShowContextPanel>(
    (component, title) => {
      if (!isValidElement(component)) {
        throw new Error(
          `Context panel component "${component}" must be provided as a React element`,
        );
      }
      setContent(component);
      claim?.(owner, title, handleRelease);
    },
    [claim, handleRelease, owner],
  );

  const hideContextPanel = useCallback(() => {
    setContent(undefined);
    release?.(owner);
  }, [owner, release]);

  useEffect(() => () => release?.(owner), [owner, release]);

  if (slot === undefined) {
    return children;
  }

  return (
    <ContextPanelProvider
      hideContextPanel={hideContextPanel}
      showContextPanel={showContextPanel}
    >
      {children}
      {content && slot.owner === owner && slot.target
        ? createPortal(content, slot.target)
        : null}
    </ContextPanelProvider>
  );
};
