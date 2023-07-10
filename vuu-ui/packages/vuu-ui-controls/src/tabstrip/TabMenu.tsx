import { PopupMenu } from "@finos/vuu-popups";
import { MenuActionHandler, MenuBuilder } from "packages/vuu-data-types";
import { useMemo } from "react";

import "./TabMenu.css";

const classBase = "vuuTabMenu";

export const TabMenu = () => {
  const [menuBuilder, menuActionHandler] = useMemo((): [
    MenuBuilder,
    MenuActionHandler
  ] => {
    return [
      () => [
        {
          label: `Rename`,
          location: "tab",
          action: `rename tab`,
        },
        {
          label: `Close`,
          location: "tab",
          action: `close tab`,
        },
      ],
      (type, options) => {
        console.log(`menu clicked ${type}`, {
          options,
        });
        return true;
      },
    ];
  }, []);

  return (
    <PopupMenu
      className={classBase}
      menuBuilder={menuBuilder}
      menuActionHandler={menuActionHandler}
    />
  );
};
