// TODO close button needs to be a button. Hence tab needs to include 2 buttons
import { MenuActionHandler } from "@finos/vuu-data-types";
import { useForkRef } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  FocusEvent,
  ForwardedRef,
  forwardRef,
  KeyboardEvent,
  MouseEvent,
  ReactElement,
  useCallback,
  useRef,
} from "react";
import { EditableLabel, EditableLabelProps } from "../editable-label";
import { TabMenu } from "./TabMenu";
import { TabProps } from "./TabsTypes";

import tabCss from "./Tab.css";

const classBase = "vuuTab";

const noop = () => undefined;

export const Tab = forwardRef(function Tab(
  {
    ariaControls,
    children,
    className,
    closeable = false,
    draggable,
    dragging,
    editable = false,
    editing,
    focusVisible,
    index = -1,
    label,
    location,
    onClick,
    onClose,
    onEnterEditMode = noop,
    onExitEditMode = noop,
    onFocus: onFocusProp,
    onKeyUp,
    onMenuAction,
    onMenuClose,
    orientation,
    selected,
    showMenuButton = closeable || editable || Boolean(location),
    tabIndex,
    ...props
  }: TabProps,
  ref: ForwardedRef<HTMLDivElement>
): ReactElement<TabProps> {
  if (showMenuButton && typeof onMenuAction !== "function") {
    throw Error("Tab onMenuAction must be provided if showMenuButton is set");
  }

  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-tabstrip-tab",
    css: tabCss,
    window: targetWindow,
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const setForkRef = useForkRef(ref, rootRef);
  const handleClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (!editing) {
        e.preventDefault();
        onClick?.(e, index);
      }
    },
    [editing, index, onClick]
  );

  const handleOnExitEditMode: EditableLabelProps["onExitEditMode"] = (
    originalValue = "",
    editedValue = "",
    allowDeactivation = true
  ) => onExitEditMode(originalValue, editedValue, allowDeactivation, index);

  const handleKeyUp = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Backspace":
      case "Delete":
        if (closeable) {
          e.stopPropagation();
          onClose && onClose(index);
        }
        break;
      default:
        onKeyUp && onKeyUp(e, index);
    }
  };

  const getLabel = () => {
    if (editable) {
      return (
        <EditableLabel
          data-embedded
          editing={editing}
          defaultValue={label}
          // Create a fresh instance after each edit, so it can be uncontrolled ...
          key={label}
          onEnterEditMode={onEnterEditMode}
          onExitEditMode={handleOnExitEditMode}
          ref={editableRef}
        />
      );
    } else {
      return label;
    }
  };

  const handleFocus = (evt: FocusEvent<HTMLElement>) => {
    if (editableRef.current) {
      const editable = editableRef.current as HTMLElement;
      const input = editable.querySelector(
        ".vuuEditableLabel-input"
      ) as HTMLInputElement;
      input?.focus();
    }
    onFocusProp?.(evt);
  };

  return (
    <div
      {...props}
      aria-controls={ariaControls}
      aria-label={label}
      aria-selected={selected}
      className={cx(classBase, className, {
        [`${classBase}-closeable`]: closeable,
        "vuuDraggable-dragAway": dragging,
        [`${classBase}-editing`]: editing,
        [`${classBase}-selected`]: selected || undefined,
        [`${classBase}-vertical`]: orientation === "vertical",
        [`vuuFocusVisible`]: focusVisible,
      })}
      draggable={draggable}
      onClick={handleClick}
      onFocus={handleFocus}
      onKeyUp={handleKeyUp}
      ref={setForkRef}
      role="tab"
      tabIndex={tabIndex}
    >
      <div className={`${classBase}-main`}>
        <span
          className={`${classBase}-text`}
          // data-text is important, it determines the width of the tab. A pseudo
          // element assigns data-text as content. This is styled as selected tab
          // text. That means width of tab always corresponds to its selected state,
          // so tabs do not change size when selected (ie when the text is bolded).
          // Do not include if we have editable content, EditableLabel will determine
          // the width
          data-text={editable ? undefined : label}
        >
          {children ?? getLabel()}
        </span>
      </div>
      {showMenuButton ? (
        <TabMenu
          allowClose={closeable}
          allowRename={editable}
          controlledComponentId={ariaControls}
          controlledComponentTitle={label}
          location={location}
          onMenuAction={onMenuAction as MenuActionHandler}
          onMenuClose={onMenuClose}
          index={index}
        />
      ) : null}
    </div>
  );
});
