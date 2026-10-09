import { VuuShellLocation } from "@vuu-ui/vuu-utils";
import {
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { ContextPanel } from "./ContextPanel";
import {
  ContextPanelProvider,
  type ShowContextPanel,
} from "./ContextPanelProvider";

/** Landmark id of the element that hosts the shell's context panel. */
export const SHELL_CONTEXT_PANEL_HOST_ID = "vuu-shell-context";

type ShellContextPanelState = {
  readonly content: ReactElement;
  readonly title: string;
};

const ShellContextPanelStateContext = createContext<
  ShellContextPanelState | undefined
>(undefined);

/**
 * Owns the state of a shell's context panel and provides the context panel
 * API to everything below it, including remote modules. Render a
 * `ShellContextPanel` within it to display the panel.
 */
export const ShellContextPanelProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [contextPanel, setContextPanel] = useState<ShellContextPanelState>();
  const contextPanelTrigger = useRef<HTMLElement | null>(null);
  const isOpen = useRef(false);

  const showContextPanel = useCallback<ShowContextPanel>((content, title) => {
    if (!isValidElement(content)) {
      throw new Error(
        `Context panel component "${content}" must be provided as a React element`,
      );
    }
    if (!isOpen.current) {
      const { activeElement } = document;
      contextPanelTrigger.current =
        activeElement instanceof HTMLElement ? activeElement : null;
    }
    isOpen.current = true;
    setContextPanel({ content, title });
  }, []);

  const hideContextPanel = useCallback(() => {
    if (!isOpen.current) {
      return;
    }
    isOpen.current = false;
    setContextPanel(undefined);
    const trigger = contextPanelTrigger.current;
    contextPanelTrigger.current = null;
    if (trigger) {
      requestAnimationFrame(() => {
        if (trigger.isConnected) {
          trigger.focus();
        }
      });
    }
  }, []);

  return (
    <ContextPanelProvider
      hideContextPanel={hideContextPanel}
      showContextPanel={showContextPanel}
    >
      <ShellContextPanelStateContext.Provider value={contextPanel}>
        {children}
      </ShellContextPanelStateContext.Provider>
    </ContextPanelProvider>
  );
};

/**
 * The shell's context panel, a slide-out drawer overlaying the right edge of
 * the shell. Must be rendered within a `ShellContextPanelProvider`.
 */
export const ShellContextPanel = ({ className }: { className?: string }) => {
  const contextPanel = useContext(ShellContextPanelStateContext);
  return (
    <div className={className} id={SHELL_CONTEXT_PANEL_HOST_ID}>
      <ContextPanel
        content={contextPanel?.content}
        expanded={contextPanel !== undefined}
        id={VuuShellLocation.ContextPanel}
        overlay
        title={contextPanel?.title}
      />
    </div>
  );
};
