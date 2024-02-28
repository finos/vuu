import { SplitButton, SplitButtonProps } from "@finos/vuu-ui-controls";
import { MenuActionHandler, MenuBuilder } from "@finos/vuu-data-types";
import { useCallback, useMemo } from "react";
import { PopupMenuProps } from "@finos/vuu-popups";

let displaySequence = 1;

const menuBuilder: MenuBuilder = (_, options) => [
  { action: "and-clause", label: "AND", options },
  { action: "or-clause", label: "OR", options },
];

const defaultMenuHandler: MenuActionHandler = ({ menuId }) => {
  console.log(`Menu Action ${menuId} invoked`);
  if (menuId === "action-1" || menuId === "action-1") {
    // invoke our action here
    return true;
  }
};

export const DefaultSplitButton = ({
  PopupMenuProps,
  onClick,
  ...props
}: Partial<SplitButtonProps>) => {
  const menuActionHandler = useMemo<MenuActionHandler>(
    () => PopupMenuProps?.menuActionHandler ?? defaultMenuHandler,
    [PopupMenuProps?.menuActionHandler]
  );

  const menuProps: PopupMenuProps = {
    icon: "more-vert",
    menuBuilder,
    menuActionHandler,
  };

  const handleClick = useMemo(
    () => onClick ?? (() => console.log("main button click")),
    [onClick]
  );

  return (
    <div
      data-showcase-center
      style={{ gap: 24, display: "flex", alignItems: "center" }}
    >
      <input data-testid="input" defaultValue="test" />
      <SplitButton
        {...props}
        buttonText="Save"
        onClick={handleClick}
        PopupMenuProps={menuProps}
      />
    </div>
  );
};
DefaultSplitButton.displaySequence = displaySequence++;

export const SegmentedSplitButton = ({
  PopupMenuProps,
}: Partial<SplitButtonProps>) => {
  const menuActionHandler = useMemo<MenuActionHandler>(() => {
    if (PopupMenuProps?.menuActionHandler) {
      return PopupMenuProps?.menuActionHandler;
    } else {
      return defaultMenuHandler;
    }
  }, [PopupMenuProps?.menuActionHandler]);

  const menuProps: PopupMenuProps = {
    menuBuilder,
    menuActionHandler,
  };

  const handleClick = useCallback(() => console.log("main button click"), []);

  return (
    <div
      data-showcase-center
      style={{ gap: 24, display: "flex", alignItems: "center" }}
    >
      <input data-testid="input" defaultValue="test" />

      <SplitButton
        buttonText="Save"
        PopupMenuProps={menuProps}
        onClick={handleClick}
        segmented
      />
    </div>
  );
};
SegmentedSplitButton.displaySequence = displaySequence++;

export const SplitButtonVariations = () => {
  const menuProps: PopupMenuProps = {
    menuBuilder,
    menuActionHandler: defaultMenuHandler,
  };

  return (
    <div
      data-showcase-center
      style={{
        alignItems: "center",
        display: "grid",
        gap: 20,
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        justifyItems: "left",
      }}
    >
      <span />
      <span>Primary</span>
      <span>Secondary</span>
      <span>CTA</span>

      <span />
      <SplitButton
        buttonText="Save"
        PopupMenuProps={menuProps}
        variant="primary"
      />
      <SplitButton
        buttonText="Save"
        PopupMenuProps={menuProps}
        variant="secondary"
      />
      <SplitButton buttonText="Save" PopupMenuProps={menuProps} variant="cta" />
    </div>
  );
};
