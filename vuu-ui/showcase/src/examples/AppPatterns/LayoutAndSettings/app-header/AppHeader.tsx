import { TableSchema } from "@finos/vuu-data-types";
import { useLayoutProviderDispatch } from "@finos/vuu-layout";
import { UserSettingsPanel } from "@finos/vuu-shell";
import { IconButton } from "@finos/vuu-ui-controls";
import { VuuShellLocation, registerComponent } from "@finos/vuu-utils";
import cx from "clsx";
import { HTMLAttributes, useCallback } from "react";

import "./AppHeader.css";

registerComponent("ApplicationSettings", UserSettingsPanel, "view");

const classBase = "vuuAppHeader";
export interface AppHeaderProps extends HTMLAttributes<HTMLDivElement> {
  tableSchemas: TableSchema[];
}

export const AppHeader = ({
  className: classNameProp,
  tableSchemas,
  ...htmlAttributes
}: AppHeaderProps) => {
  const className = cx(classBase, classNameProp);

  const dispatchLayoutAction = useLayoutProviderDispatch();

  const handleShowLayout = useCallback(() => {
    dispatchLayoutAction({
      type: "set-props",
      path: `#${VuuShellLocation.ContextPanel}`,
      props: {
        expanded: true,
        content: {
          type: "LayoutComponentsPanel",
          props: {
            tableSchemas,
          },
        },
        title: "Layout & Components",
      },
    });
  }, [dispatchLayoutAction, tableSchemas]);

  const handleShowSettings = useCallback(() => {
    dispatchLayoutAction({
      type: "set-props",
      path: `#${VuuShellLocation.ContextPanel}`,
      props: {
        expanded: true,
        content: {
          type: "ApplicationSettings",
        },
        title: "Settings",
      },
    });
  }, [dispatchLayoutAction]);

  return (
    <div className={className} {...htmlAttributes}>
      <IconButton
        className={`${classBase}-menuItem`}
        data-embedded
        icon="layout"
        onClick={handleShowLayout}
        size={24}
        variant="secondary"
      />
      <IconButton
        className={`${classBase}-menuItem`}
        data-embedded
        icon="settings"
        onClick={handleShowSettings}
        size={20}
        variant="secondary"
      />
    </div>
  );
};
