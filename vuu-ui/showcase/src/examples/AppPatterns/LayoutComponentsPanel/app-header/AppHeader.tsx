import { TableSchema } from "@finos/vuu-data-types";
import { useLayoutProviderDispatch } from "@finos/vuu-layout";
import { IconButton } from "@finos/vuu-ui-controls";
import cx from "clsx";
import { HTMLAttributes, useCallback } from "react";

import "./AppHeader.css";

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
      path: "#context-panel",
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
    console.log("show settings");
  }, []);

  return (
    <div className={className} {...htmlAttributes}>
      <IconButton
        className={`${classBase}-menuItem`}
        data-embedded
        icon="layout"
        onClick={handleShowLayout}
        size={20}
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
