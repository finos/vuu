import { VuuShellLocation } from "@vuu-ui/vuu-utils";
import type { ReactNode } from "react";
import {
  ContextPanelSlotContext,
  ContextPanelSlotHost,
  SlotContextPanelProvider,
  useContextPanelSlot,
  useCreateContextPanelSlot,
} from "./ContextPanelSlot";

/** Landmark id of the element that hosts the shell's context panel. */
export const SHELL_CONTEXT_PANEL_HOST_ID = "vuu-shell-context";

/**
 * Creates the shell's context panel and provides the context panel API to
 * everything below it, including remote modules. Render a
 * `ShellContextPanel` within it to display the panel.
 */
export const ShellContextPanelProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const slot = useCreateContextPanelSlot();
  return (
    <ContextPanelSlotContext.Provider value={slot}>
      <SlotContextPanelProvider>{children}</SlotContextPanelProvider>
    </ContextPanelSlotContext.Provider>
  );
};

/**
 * The shell's context panel, a slide-out drawer overlaying the right edge of
 * the shell. Must be rendered within a `ShellContextPanelProvider`.
 */
export const ShellContextPanel = ({ className }: { className?: string }) => {
  const slot = useContextPanelSlot();
  if (slot === undefined) {
    throw new Error(
      "ShellContextPanel must be rendered within a ShellContextPanelProvider",
    );
  }
  return (
    <ContextPanelSlotHost
      className={className}
      id={SHELL_CONTEXT_PANEL_HOST_ID}
      panelId={VuuShellLocation.ContextPanel}
      slot={slot}
    />
  );
};
