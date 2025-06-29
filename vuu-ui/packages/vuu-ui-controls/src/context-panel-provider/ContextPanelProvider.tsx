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
import { Dialog, DialogContent } from "@salt-ds/core";

export type ShowContextPanel = (
  componentType: string,
  title: string,
  componentProps: unknown,
) => void;

export interface ContextPanelProps {
  showContextPanel: ShowContextPanel;
}

export const ContextPanelContext = createContext<ContextPanelProps>({
  showContextPanel: () => {
    console.warn(
      "[ContextPanelContext] no implementation for showContextPanel, you need to add a ContextPanelProvider",
    );
  },
});

export const ContextPanelProvider = ({
  children,
  showContextPanel: showContextPanelProp,
}: Partial<ContextPanelProps> & {
  children: ReactNode;
}) => {
  const { showComponentInContextPanel } = useLayoutOperation();
  const [dialog, setDialog] = useState<ReactElement | null>(null);

  const showContextPanel = useCallback<ShowContextPanel>(
    (componentType, title, props) => {
      if (showContextPanelProp) {
        console.log(`show context panel will use method from prop`);
      } else if (!isUnconfiguredProperty(showComponentInContextPanel)) {
        showComponentInContextPanel(
          { type: componentType, props } as LayoutJSON,
          title,
        );
      } else {
        const component = layoutFromJson(
          { type: componentType, props } as LayoutJSON,
          "",
        );
        setDialog(
          <Dialog open={true}>
            <DialogContent>{component}</DialogContent>
          </Dialog>,
        );
      }
    },
    [showComponentInContextPanel, showContextPanelProp],
  );

  return (
    <ContextPanelContext.Provider value={{ showContextPanel }}>
      {children}
      {dialog}
    </ContextPanelContext.Provider>
  );
};

export function useContextPanel() {
  const { showContextPanel } = useContext(ContextPanelContext);
  return showContextPanel;
}
