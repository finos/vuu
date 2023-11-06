import { ContextMenuProps } from "@finos/vuu-popups";
import { MenuActionHandler } from "@finos/vuu-data-types";
import { ReactElement, useCallback, useRef } from "react";
import { PopupComponent as Popup, Portal } from "@finos/vuu-popups";
import { List, ListItem } from "@finos/vuu-ui-controls";

import "./FilterBuilderMenu.css";

const classBase = "vuuFilterBuilderMenu";

export interface FilterBuilderMenuProps
  extends Omit<ContextMenuProps, "children"> {
  onMenuAction: MenuActionHandler;
}

export const FilterBuilderMenu = ({ onMenuAction }: FilterBuilderMenuProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const listRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      requestAnimationFrame(() => {
        el.focus();
      });
    }
  }, []);

  const handleSelect = useCallback(
    (evt, selected: ReactElement) => {
      const {
        props: { "data-action": action },
      } = selected;
      onMenuAction({ type: "menu-action", menuId: action, options: {} });
    },
    [onMenuAction]
  );

  return (
    <>
      <span className={`${classBase}-trigger`} ref={ref} />
      <Portal>
        <Popup anchorElement={ref} placement="right">
          <List
            className={`${classBase}List`}
            defaultHighlightedIndex={1}
            itemHeight={22}
            ref={listRef}
            onSelect={handleSelect}
            style={{ position: "relative" }}
            width={100}
          >
            <ListItem data-action="apply-save" className="vuuMenuButton">
              APPLY AND SAVE
            </ListItem>
            <ListItem data-action="and-clause">AND</ListItem>
            <ListItem data-action="or-clause">OR</ListItem>
          </List>
        </Popup>
      </Portal>
    </>
  );
};
