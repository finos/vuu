import React, {
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

/**
 * If component is a string, the component will be read from the
 * comoponent registry. In that case, componentProps can be used
 * to pass props to the component.
 */
export type ShowContextPanel = (
  component: string | ReactElement,
  title: string,
  componentProps?: unknown,
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
    (elementOrComponentType, title, props) => {
      if (showContextPanelProp) {
        showContextPanelProp(elementOrComponentType, title, props);
      } else if (inheritedShowContextPanel !== UndefinedShowContextPanel) {
        inheritedShowContextPanel(elementOrComponentType, title, props);
      } else if (!isUnconfiguredProperty(showComponentInContextPanel)) {
        const component =
          typeof elementOrComponentType === "string"
            ? ({ type: elementOrComponentType, props } as LayoutJSON)
            : elementOrComponentType;
        showComponentInContextPanel(component, title);
      } else if (typeof elementOrComponentType === "string") {
        const component =
          typeof elementOrComponentType === "string"
            ? layoutFromJson(
                {
                  type: elementOrComponentType,
                  props,
                } as LayoutJSON,
                "",
              )
            : elementOrComponentType;

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
