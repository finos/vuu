import { Button, Toolbar, ToolbarContent, Tooltray } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useLogout } from "@vuu-ui/core";
import cx from "clsx";
import type { HTMLAttributes } from "react";

import portalHeaderCss from "./PortalHeader.css";

const classBase = "vuuPortalHeader";

export interface PortalHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const PortalHeader = ({
  className: classNameProp,
  ...htmlAttributes
}: PortalHeaderProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-portal-header",
    css: portalHeaderCss,
    window: targetWindow,
  });

  const className = cx(classBase, classNameProp);
  const logout = useLogout();

  return (
    <Toolbar className={className} role="banner" {...htmlAttributes}>
      <ToolbarContent position="end">
        <Tooltray align="end">
          <Button
            appearance="transparent"
            className={`${classBase}-menuItem`}
            onClick={logout}
            sentiment="neutral"
          >
            Log out
          </Button>
        </Tooltray>
      </ToolbarContent>
    </Toolbar>
  );
};
