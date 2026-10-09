import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
} from "@salt-ds/core";
import {
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type ShowContextPanel = (
  component: string | ReactElement,
  title: string,
  componentProps?: unknown,
) => void;

export type HideContextPanel = () => void;

export interface ContextPanelContextProps {
  hideContextPanel?: HideContextPanel;
  showContextPanel: ShowContextPanel;
}

export type ResolveContextPanelComponent = (
  component: string,
  componentProps?: unknown,
) => ReactElement;

const UndefinedShowContextPanel: ShowContextPanel = () => {
  console.warn(
    "[ContextPanelContext] no implementation for showContextPanel, you need to add a ContextPanelProvider",
  );
};

/**
 * The portal's context panel API. Part of @vuu-ui/core, a shared Module
 * Federation singleton, so remote modules reach the portal's panel through it.
 */
export const ContextPanelContext = createContext<ContextPanelContextProps>({
  showContextPanel: UndefinedShowContextPanel,
});

export interface ContextPanelProviderProps extends Partial<ContextPanelContextProps> {
  children: ReactNode;
  resolveComponent?: ResolveContextPanelComponent;
}

/**
 * Provides `showContextPanel`/`hideContextPanel`. Without an implementation,
 * own or inherited, content is shown in a Dialog.
 */
export const ContextPanelProvider = ({
  children,
  hideContextPanel: hideContextPanelProp,
  resolveComponent,
  showContextPanel: showContextPanelProp,
}: ContextPanelProviderProps) => {
  const {
    hideContextPanel: inheritedHideContextPanel,
    showContextPanel: inheritedShowContextPanel,
  } = useContext(ContextPanelContext);
  const [dialog, setDialog] = useState<ReactElement | null>(null);

  const closeDialog = useCallback(() => setDialog(null), []);
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        closeDialog();
      }
    },
    [closeDialog],
  );

  const hasInheritedImplementation =
    inheritedShowContextPanel !== UndefinedShowContextPanel;

  const hideContextPanel =
    hideContextPanelProp ??
    (showContextPanelProp || hasInheritedImplementation
      ? inheritedHideContextPanel
      : closeDialog);

  const showContextPanel = useCallback<ShowContextPanel>(
    (component, title, componentProps) => {
      const resolvedComponent =
        typeof component === "string" && resolveComponent
          ? resolveComponent(component, componentProps)
          : component;
      if (showContextPanelProp) {
        showContextPanelProp(resolvedComponent, title, componentProps);
      } else if (hasInheritedImplementation) {
        inheritedShowContextPanel(resolvedComponent, title, componentProps);
      } else {
        if (!isValidElement(resolvedComponent)) {
          throw new Error(
            `Context panel component "${component}" requires a configured resolver`,
          );
        }
        setDialog(
          <Dialog open={true} onOpenChange={handleOpenChange}>
            <DialogCloseButton
              appearance="transparent"
              data-embedded
              data-icon="close"
              onClick={closeDialog}
              sentiment="neutral"
            />
            <DialogHeader header={title} />
            <DialogContent>{resolvedComponent}</DialogContent>
          </Dialog>,
        );
      }
    },
    [
      closeDialog,
      handleOpenChange,
      hasInheritedImplementation,
      inheritedShowContextPanel,
      resolveComponent,
      showContextPanelProp,
    ],
  );

  const value = useMemo(
    () => ({ hideContextPanel, showContextPanel }),
    [hideContextPanel, showContextPanel],
  );

  return (
    <ContextPanelContext.Provider value={value}>
      {children}
      {dialog}
    </ContextPanelContext.Provider>
  );
};

export function useContextPanel() {
  const { showContextPanel } = useContext(ContextPanelContext);
  return showContextPanel;
}

export function useHideContextPanel() {
  const { hideContextPanel } = useContext(ContextPanelContext);
  return hideContextPanel;
}
