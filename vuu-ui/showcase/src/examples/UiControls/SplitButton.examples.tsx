import {
  SplitButton,
  SplitButtonProps,
  SplitStateButton,
} from "@vuu-ui/vuu-ui-controls";
import { useCallback, useMemo, useState } from "react";
import { PopupMenuProps } from "@vuu-ui/vuu-popups";
import { MenuActionHandler, MenuBuilder } from "@vuu-ui/vuu-context-menu";

const menuBuilder: MenuBuilder = (_, options) => [
  { id: "and-clause", label: "AND", options },
  { id: "or-clause", label: "OR", options },
];

const defaultMenuHandler: MenuActionHandler = (menuItemId) => {
  console.log(`Menu Action ${menuItemId} invoked`);
  if (menuItemId === "action-1" || menuItemId === "action-1") {
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
    [PopupMenuProps?.menuActionHandler],
  );

  const menuProps: PopupMenuProps = {
    icon: "more-vert",
    menuBuilder,
    menuActionHandler,
  };

  const handleClick = useMemo(
    () => onClick ?? (() => console.log("main button click")),
    [onClick],
  );

  return (
    <div
      data-showcase-center
      style={{ gap: 24, display: "flex", alignItems: "center" }}
    >
      <input data-testid="input" defaultValue="test" />
      <SplitButton {...props} onClick={handleClick} PopupMenuProps={menuProps}>
        Save
      </SplitButton>
    </div>
  );
};

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

      <SplitButton PopupMenuProps={menuProps} onClick={handleClick} segmented>
        Save
      </SplitButton>
    </div>
  );
};

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
      <SplitButton PopupMenuProps={menuProps} variant="primary">
        Save
      </SplitButton>
      <SplitButton PopupMenuProps={menuProps} variant="secondary">
        Save
      </SplitButton>
      <SplitButton PopupMenuProps={menuProps} variant="cta">
        Save
      </SplitButton>

      <span>disabled</span>
      <SplitButton PopupMenuProps={menuProps} disabled variant="primary">
        Save
      </SplitButton>
      <SplitButton PopupMenuProps={menuProps} disabled variant="secondary">
        Save
      </SplitButton>
      <SplitButton PopupMenuProps={menuProps} disabled variant="cta">
        Save
      </SplitButton>
    </div>
  );
};

export const DefaultSplitStateButton = ({
  PopupMenuProps,
  onClick,
  ...props
}: Partial<SplitButtonProps>) => {
  const menuActionHandler = useMemo<MenuActionHandler>(
    () => PopupMenuProps?.menuActionHandler ?? defaultMenuHandler,
    [PopupMenuProps?.menuActionHandler],
  );

  const [selected, setSelected] = useState(false);

  const menuProps: PopupMenuProps = {
    icon: "more-vert",
    menuBuilder,
    menuActionHandler,
  };

  const handleClick = useMemo(
    () => onClick ?? (() => setSelected((value) => !value)),
    [onClick],
  );

  return (
    <div
      data-showcase-center
      style={{ gap: 24, display: "flex", alignItems: "center" }}
    >
      <input data-testid="input" defaultValue="test" />
      <SplitStateButton
        {...props}
        onClick={handleClick}
        PopupMenuProps={menuProps}
        selected={selected}
      >
        Save
      </SplitStateButton>
    </div>
  );
};
