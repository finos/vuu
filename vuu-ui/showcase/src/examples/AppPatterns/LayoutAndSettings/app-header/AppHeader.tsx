import { TableSchema } from "@finos/vuu-data-types";
import { useLayoutProviderDispatch } from "@finos/vuu-layout";
import { UserSettingsPanel } from "@finos/vuu-shell";
import { IconButton } from "@finos/vuu-ui-controls";
import { VuuShellLocation, registerComponent } from "@finos/vuu-utils";
import cx from "clsx";
import { HTMLAttributes, useCallback, useRef } from "react";

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
  const layoutButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

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
        onClose: () => layoutButtonRef.current?.focus(),
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
        onClose: () => settingsButtonRef.current?.focus(),
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
        ref={layoutButtonRef}
        size={24}
        variant="secondary"
      />
      <IconButton
        className={`${classBase}-menuItem`}
        data-embedded
        icon="settings"
        onClick={handleShowSettings}
        ref={settingsButtonRef}
        size={20}
        variant="secondary"
      />
    </div>
  );
};
