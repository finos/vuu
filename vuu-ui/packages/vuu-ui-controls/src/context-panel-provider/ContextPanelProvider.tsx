import {
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
} from "@salt-ds/core";

export type ShowContextPanel = (
  component: string | ReactElement,
  title: string,
  componentProps?: unknown,
) => void;

export interface ContextPanelProps {
  hideContextPanel?: () => void;
  /**
   * True when a showContextPanel implementation is provided, here or by an
   * enclosing provider. Without one, content is shown in a Dialog.
   */
  isContextPanelAvailable?: boolean;
  showContextPanel: ShowContextPanel;
}

export type ResolveContextPanelComponent = (
  component: string,
  componentProps?: unknown,
) => ReactElement;

const UndefinedShowContextPanel = () => {
  console.warn(
    "[ContextPanelContext] no implementation for showContextPanel, you need to add a ContextPanelProvider",
  );
};

export const ContextPanelContext = createContext<ContextPanelProps>({
  showContextPanel: UndefinedShowContextPanel,
});

export const ContextPanelProvider = ({
  children,
  hideContextPanel: hideContextPanelProp,
  resolveComponent,
  showContextPanel: showContextPanelProp,
}: Partial<ContextPanelProps> & {
  children: ReactNode;
  resolveComponent?: ResolveContextPanelComponent;
}) => {
  const {
    hideContextPanel: inheritedHideContextPanel,
    isContextPanelAvailable: inheritedIsContextPanelAvailable = false,
    showContextPanel: inheritedShowContextPanel,
  } = useContext(ContextPanelContext);
  const [dialog, setDialog] = useState<ReactElement | null>(null);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setDialog(null);
    }
  }, []);

  const hideContextPanel = hideContextPanelProp ?? inheritedHideContextPanel;
  const isContextPanelAvailable =
    showContextPanelProp !== undefined || inheritedIsContextPanelAvailable;

  const showContextPanel = useCallback<ShowContextPanel>(
    (component, title, componentProps) => {
      const resolvedComponent =
        typeof component === "string" && resolveComponent
          ? resolveComponent(component, componentProps)
          : component;
      if (showContextPanelProp) {
        showContextPanelProp(resolvedComponent, title, componentProps);
      } else if (inheritedShowContextPanel !== UndefinedShowContextPanel) {
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
              onClick={() => setDialog(null)}
              sentiment="neutral"
            />
            <DialogHeader header={title} />
            <DialogContent>{resolvedComponent}</DialogContent>
          </Dialog>,
        );
      }
    },
    [
      handleOpenChange,
      inheritedShowContextPanel,
      resolveComponent,
      showContextPanelProp,
    ],
  );

  return (
    <ContextPanelContext.Provider
      value={{ hideContextPanel, isContextPanelAvailable, showContextPanel }}
    >
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

/**
 * True if showContextPanel can show content in a context panel.
 */
export function useContextPanelAvailable() {
  const { isContextPanelAvailable = false } = useContext(ContextPanelContext);
  return isContextPanelAvailable;
}
