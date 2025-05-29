import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { registerComponent } from "@vuu-ui/vuu-utils";
import { LayoutStartPanel } from "./LayoutStartPanel";
import { View } from "../layout-view/View";
import type { ViewProps } from "../layout-view/viewTypes";

import placeholderCss from "./Placeholder.css";

const classBase = "vuuPlaceholder";

export interface PlaceholderProps extends ViewProps {
  closeable?: boolean;
  flexFill?: boolean;
  resizeable?: boolean;
  showStartMenu?: boolean;
  /**
   * shim is only when we're dealing with intrinsically sized children, which is never
   * in an actual application. Intrinsic sizing is still experimental.
   */
  shim?: boolean;
}

const PlaceholderCore = ({ showStartMenu = true }: PlaceholderProps) => {
  return <>{showStartMenu ? <LayoutStartPanel /> : null}</>;
};

export const Placeholder = ({
  className: classNameProp,
  showStartMenu,
  ...viewProps
}: PlaceholderProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-placeholder",
    css: placeholderCss,
    window: targetWindow,
  });

  const className = cx(classBase, classNameProp);

  return (
    <View {...viewProps} className={className} data-placeholder resizeable>
      <PlaceholderCore showStartMenu={showStartMenu} />
    </View>
  );
};

Placeholder.displayName = "Placeholder";
registerComponent("Placeholder", Placeholder, "component");
