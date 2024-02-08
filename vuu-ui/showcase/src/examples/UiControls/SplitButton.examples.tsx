import { SplitButton } from "@finos/vuu-ui-controls";
import { MenuActionHandler, MenuBuilder } from "@finos/vuu-data-types";
import { useMemo } from "react";
import { PopupMenuProps } from "packages/vuu-popups/src";

let displaySequence = 1;

export const DefaultSplitButton = () => {
  const menuBuilder = useMemo<MenuBuilder>(
    () => (_locaction, options) =>
      [
        {
          action: "and-clause",
          label: "AND",
          options,
        },
        {
          action: "or-clause",
          label: "OR",
          options,
        },
      ],
    []
  );

  const menuActionHandler = useMemo<MenuActionHandler>(
    () =>
      ({ menuId }) => {
        console.log(`Menu Action ${menuId} invoked`);
        if (menuId === "action-1" || menuId === "action-1") {
          // invoke our action here
          return true;
        }
      },
    []
  );

  const PopupMenuProps: PopupMenuProps = {
    menuBuilder,
    menuActionHandler,
  };

  return (
    <div
      style={{
        border: "solid 1px #ccc",
        gap: 24,
        height: 300,
        padding: 12,
        width: 600,
        display: "flex",
        alignItems: "center",
      }}
    >
      <input data-testid="input" defaultValue="test" />

      <SplitButton
        buttonText="Apply and Save"
        PopupMenuProps={PopupMenuProps}
      />
    </div>
  );
};
DefaultSplitButton.displaySequence = displaySequence++;
