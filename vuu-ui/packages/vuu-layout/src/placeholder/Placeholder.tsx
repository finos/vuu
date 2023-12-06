import cx from "classnames";
import { registerComponent } from "../registry/ComponentRegistry";
import { LayoutStartPanel } from "./LayoutStartPanel";
import { View, ViewProps } from "@finos/vuu-layout";

import "./Placeholder.css";

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
  const className = cx(classBase, classNameProp);

  return (
    <View {...viewProps} className={className} data-placeholder resizeable>
      <PlaceholderCore showStartMenu={showStartMenu} />
    </View>
  );
};

Placeholder.displayName = "Placeholder";
registerComponent("Placeholder", Placeholder);
