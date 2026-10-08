import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import type { ReactNode } from "react";
import {
  ContextPanelSlotContext,
  ContextPanelSlotHost,
  SlotContextPanelProvider,
  useCreateContextPanelSlot,
  type ContextPanelPlacement,
} from "./ContextPanelSlot";

import moduleContextPanelCss from "./ModuleContextPanel.css";

const ModuleHostedContextPanel = ({ children }: { children: ReactNode }) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-module-context-panel",
    css: moduleContextPanelCss,
    window: targetWindow,
  });
  const slot = useCreateContextPanelSlot();
  return (
    <ContextPanelSlotContext.Provider value={slot}>
      <SlotContextPanelProvider>{children}</SlotContextPanelProvider>
      <ContextPanelSlotHost className="vuuModuleContextPanel" slot={slot} />
    </ContextPanelSlotContext.Provider>
  );
};

export interface ModuleContextPanelProps {
  children: ReactNode;
  placement?: ContextPanelPlacement;
}

/**
 * Provides the context panel API to a remote module. Content is portalled
 * into the shell's panel or one within the module's frame, either way
 * remaining in the module's React tree, so it sees the module's context.
 */
export const ModuleContextPanel = ({
  children,
  placement = "shell",
}: ModuleContextPanelProps) =>
  placement === "module" ? (
    <ModuleHostedContextPanel>{children}</ModuleHostedContextPanel>
  ) : (
    <SlotContextPanelProvider>{children}</SlotContextPanelProvider>
  );
