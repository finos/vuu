import { Checkbox, Input, ListBoxProps } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, RefCallback, forwardRef, useCallback } from "react";
import { ListBox, Option } from "@salt-ds/core";

import searchableListCss from "./ColumnSearch.css";

const classBase = "vuuColumnSearch";

export interface ColumnSearchProps
  extends HTMLAttributes<HTMLDivElement>,
    Pick<ListBoxProps, "onSelectionChange" | "selected"> {
  columns: string[];
  onReorderColumns: (columns: string[]) => void;
}

const searchIcon = <span data-icon="search" />;

export const ColumnSearch = forwardRef<HTMLDivElement, ColumnSearchProps>(
  function ColumnSearch(
    {
      autoFocus = false,
      className,
      columns,
      onChange,
      onSelectionChange,
      selected,
      ...htmlAttributes
    },
    forwardedRef,
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
        <ListBox>
          {columns.map((column) => (
            <Option key={column} value={column}>
              <Checkbox onChange={handleChange} />
              <span>{column}</span>
            </Option>
          ))}
        </ListBox>
      </div>
    );
  },
);
