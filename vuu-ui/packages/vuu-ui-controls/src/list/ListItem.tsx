import { ForwardedRef, forwardRef, HTMLAttributes } from "react";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ListItemProps, ListItemType } from "./listTypes";
import { Highlighter } from "./Highlighter";
import { CheckboxIcon } from "./CheckboxIcon";

import listItemCss from "./ListItem.css";

const classBase = "vuuListItem";

// A dummy ListItem rendered once and not visible. We measure this to
// determine height of ListItem and monitor it for size changes (in
// case of runtime density switch). This allows ListItem height to
// be controlled purely through CSS.
export const ListItemProxy = forwardRef(function ListItemProxy(
  {
    height,
    ...htmlAttributes
  }: HTMLAttributes<HTMLDivElement> & {
    height?: number;
  },
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-list-item",
    css: listItemCss,
    window: targetWindow,
  });

  return (
    <div
      {...htmlAttributes}
      aria-hidden
      className={cx(classBase, `${classBase}-proxy`)}
      ref={forwardedRef}
      style={{ height }}
    />
  );
});

// Note: the memo is effective if List label is passed as simple string
// If children are used, it is the responsibility of caller to memoise
// these if performance on highlight is perceived to be an issue.
export const ListItem = forwardRef<HTMLDivElement, ListItemProps>(
  function ListItem(
    {
      children,
      className: classNameProp,
      disabled,
      tabIndex,
      item,
      itemHeight,
      itemTextHighlightPattern,
      label,
      selectable: _notUsed,
      selected,
      showCheckbox,
      style: styleProp,
      ...props
    },
    forwardedRef
  ) {
    const className = cx(classBase, classNameProp, {
      vuuDisabled: disabled,
      [`${classBase}-checkbox`]: showCheckbox,
    });
    const style =
      itemHeight !== undefined
        ? {
            ...styleProp,
            height: itemHeight,
          }
        : styleProp;

    return (
      <div
        className={className}
        {...props}
        aria-disabled={disabled || undefined}
        aria-selected={selected || undefined}
        ref={forwardedRef}
        style={style}
      >
        {showCheckbox && <CheckboxIcon aria-hidden checked={selected} />}
        {children && typeof children !== "string" ? (
          children
        ) : itemTextHighlightPattern == null ? (
          <span className={`${classBase}-textWrapper`}>
            {label || children}
          </span>
        ) : (
          <Highlighter
            matchPattern={itemTextHighlightPattern}
            text={label || (children as string)}
          />
        )}
      </div>
    );
  }
) as ListItemType;
