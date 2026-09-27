import type { WindowContextType } from "@salt-ds/window";
import { useContextMenu, type MenuBuilder } from "@vuu-ui/vuu-context-menu";
import { useHref } from "react-router-dom";
import { getWindowHostPath } from "../portal";
import type { NavItem } from "./PortalAppSwitcher";
import { type MouseEventHandler, useCallback } from "react";

const moduleMenuBuilder: MenuBuilder = (location) =>
    location === "portal-module"
        ? [
            { id: "open-module-tab", label: "Open in new Tab" },
            { id: "open-module-window", label: "Open in new Window" },
        ]
        : [];


export interface NavContextMenuHookProps {
    item: NavItem;
    targetWindow: WindowContextType;
}

export const useNavContextMenu = ({ item, targetWindow }: NavContextMenuHookProps) => {

    const windowHref = useHref(
        item.moduleId === undefined ? "/" : getWindowHostPath(item.moduleId),
    );


    const showContextMenu = useContextMenu(moduleMenuBuilder, (action) => {
        if (action !== "open-module-tab" && action !== "open-module-window") {
            return;
        }
        if (!targetWindow) {
            throw Error("Cannot open a module without a host window");
        }
        targetWindow.open(
            windowHref,
            "_blank",
            action === "open-module-window"
                ? "popup,width=1200,height=800,noopener,noreferrer"
                : "noopener,noreferrer",
        );
        return true;
    });


    return useCallback<MouseEventHandler<HTMLElement>>((e) => {
        showContextMenu(e, "portal-module", undefined)
    }, [showContextMenu])
}