import { MenuActionHandler, MenuBuilder } from "@finos/vuu-data-types";
import { PopupMenuProps } from "@finos/vuu-popups";
import { SplitButton, SplitButtonProps } from "@finos/vuu-ui-controls";
import { ForwardedRef, forwardRef, useMemo } from "react";

const menuBuilder: MenuBuilder = (_, options) => [
  { action: "and-clause", label: "AND", options },
  { action: "or-clause", label: "OR", options },
];

export interface FilterSaveButtonProps extends Partial<SplitButtonProps> {
  disabled?: boolean;
  onFilterAction: MenuActionHandler;
}

export const FilterSaveButton = forwardRef(function FilterSaveButton(
  { onFilterAction, ...props }: FilterSaveButtonProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const menuProps: PopupMenuProps = {
    icon: "more-vert",
    menuBuilder,
    menuActionHandler: onFilterAction,
  };

  const handleClick = useMemo(
    () => () =>
      onFilterAction({
        menuId: "save",
        options: {},
        type: "menu-action",
      }),
    []
  );

  return (
    <SplitButton
      PopupMenuProps={menuProps}
      {...props}
      onClick={handleClick}
      ref={forwardedRef}
    >
      Save
    </SplitButton>
  );
});
