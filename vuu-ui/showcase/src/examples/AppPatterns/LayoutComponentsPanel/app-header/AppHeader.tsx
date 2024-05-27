import { useLayoutProviderDispatch } from "@finos/vuu-layout";
import { Toolbar } from "@finos/vuu-ui-controls";
import { Button } from "@salt-ds/core";
import cx from "clsx";
import { HTMLAttributes, useCallback } from "react";

import "./AppHeader.css";
import { TableSchema } from "packages/vuu-data-types";

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
        title: "Layout",
      },
    });
  }, [dispatchLayoutAction, tableSchemas]);

  return (
    <Toolbar
      alignItems="end"
      className={className}
      showSeparators
      {...htmlAttributes}
    >
      <Button
        className={`${classBase}-menuItem`}
        onClick={handleShowLayout}
        variant="secondary"
      >
        Layout <span data-icon="settings" />
      </Button>
    </Toolbar>
  );
};
