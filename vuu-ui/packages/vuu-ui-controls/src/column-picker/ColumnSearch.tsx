import { Input } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, RefCallback, forwardRef, useCallback } from "react";
import { List, ListProps } from "../list";

import searchableListCss from "./ColumnSearch.css";

const classBase = "vuuColumnSearch";

export interface ColumnSearchProps
  extends HTMLAttributes<HTMLDivElement>,
    Pick<
      ListProps<string, "multiple">,
      "onMoveListItem" | "onSelectionChange" | "selected"
    > {
  columns: string[];
}

const searchIcon = <span data-icon="search" />;

export const ColumnSearch = forwardRef<HTMLDivElement, ColumnSearchProps>(
  function ColumnSearch(
    {
      autoFocus = false,
      className,
      columns,
      onChange,
      onMoveListItem,
      onSelectionChange,
      selected,
      ...htmlAttributes
    },
    forwardedRef
  ) {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-column-picker",
      css: searchableListCss,
      window: targetWindow,
    });

    const searchCallbackRef = useCallback<RefCallback<HTMLElement>>((el) => {
      setTimeout(() => {
        el?.querySelector("input")?.focus();
      }, 100);
    }, []);

    const handleChange = () => {
      console.log(`handle change`);
    };

    return (
      <div
        {...htmlAttributes}
        className={cx(classBase, className)}
        ref={forwardedRef}
      >
        <div className={`${classBase}-inputField`}>
          <Input
            // inputProps={{ onKeyDown }}
            startAdornment={searchIcon}
            ref={autoFocus ? searchCallbackRef : null}
            // value={searchState.searchText}
            // onChange={onChange}
          />
        </div>

        <List<string, "multiple">
          allowDragDrop
          height="auto"
          onChange={handleChange}
          onMoveListItem={onMoveListItem}
          onSelectionChange={onSelectionChange}
          selected={selected}
          selectionStrategy="multiple"
          source={columns}
          itemHeight={33}
        />
      </div>
    );
  }
);
