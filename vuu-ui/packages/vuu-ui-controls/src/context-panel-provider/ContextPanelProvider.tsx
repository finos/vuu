import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import {
  isUnconfiguredProperty,
  layoutFromJson,
  useLayoutOperation,
} from "@vuu-ui/vuu-layout";
import { LayoutJSON } from "@vuu-ui/vuu-utils";
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
} from "@salt-ds/core";

export type ShowContextPanel = (
  componentType: string,
  title: string,
  componentProps: unknown,
) => void;

export interface ContextPanelProps {
  hideContextPanel?: () => void;
  showContextPanel: ShowContextPanel;
}

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
  showContextPanel: showContextPanelProp,
}: Partial<ContextPanelProps> & {
  children: ReactNode;
}) => {
  const {
    hideContextPanel: inheritedHideContextPanel,
    showContextPanel: inheritedShowContextPanel,
  } = useContext(ContextPanelContext);
  const { showComponentInContextPanel } = useLayoutOperation();
  const [dialog, setDialog] = useState<ReactElement | null>(null);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setDialog(null);
    }
  }, []);

  const hideContextPanel = hideContextPanelProp ?? inheritedHideContextPanel;

  const showContextPanel = useCallback<ShowContextPanel>(
    (componentType, title, props) => {
      if (showContextPanelProp) {
        showContextPanelProp(componentType, title, props);
      } else if (inheritedShowContextPanel !== UndefinedShowContextPanel) {
        inheritedShowContextPanel(componentType, title, props);
      } else if (!isUnconfiguredProperty(showComponentInContextPanel)) {
        showComponentInContextPanel(
          { type: componentType, props } as LayoutJSON,
          title,
        );
      } else {
        const component = layoutFromJson(
          {
            type: componentType,
            props,
          } as LayoutJSON,
          "",
        );

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
            <DialogContent>{component}</DialogContent>
          </Dialog>,
        );
      }
    },
    [
      handleOpenChange,
      inheritedShowContextPanel,
      showComponentInContextPanel,
      showContextPanelProp,
    ],
  );

  return (
    <ContextPanelContext.Provider
      value={{ hideContextPanel, showContextPanel }}
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
