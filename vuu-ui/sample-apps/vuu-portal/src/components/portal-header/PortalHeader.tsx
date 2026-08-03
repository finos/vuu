import { Button, Toolbar, ToolbarContent, Tooltray } from "@salt-ds/core";
import { useLogout } from "@vuu-ui/vuu-shell";
import cx from "clsx";
import type { HTMLAttributes } from "react";

import "./PortalHeader.css";

const classBase = "vuuPortalHeader";

export interface PortalHeaderProps extends HTMLAttributes<HTMLDivElement> {
}

export const PortalHeader = ({
    className: classNameProp,
    ...htmlAttributes
}: PortalHeaderProps) => {

    const className = cx(classBase, classNameProp);
    const logout = useLogout();

    return (
        <Toolbar
            className={className}
            role="banner"
            {...htmlAttributes}
        >
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
