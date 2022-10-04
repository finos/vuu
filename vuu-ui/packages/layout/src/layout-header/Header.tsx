import classnames from "classnames";
import React, {
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactElement,
  useRef,
  useState,
} from "react";
import { Contribution, useViewDispatch } from "../layout-view";
import {
  EditableLabel,
  Toolbar,
  ToolbarButton,
  ToolbarField,
  Tooltray,
} from "@heswell/uitk-lab";
import { CloseIcon } from "@heswell/uitk-icons";

import "./Header.css";

export interface HeaderProps extends HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
  contributions?: Contribution[];
  expanded?: boolean;
  closeable?: boolean;
  orientation?: "horizontal" | "vertical";
  tearOut?: boolean;
}

export const Header = ({
  className: classNameProp,
  contributions,
  collapsed,
  expanded,
  closeable,
  orientation: orientationProp = "horizontal",
  style,
  tearOut,
  title = "Untitled",
}: HeaderProps) => {
  const labelFieldRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<string>(title);
  const [editing, setEditing] = useState<boolean>(false);

  const layoutDispatch = useViewDispatch();
  const handleAction = (
    evt: MouseEvent,
    actionId: "maximize" | "restore" | "minimize" | "tearout"
  ) => layoutDispatch?.({ type: actionId }, evt);
  const handleClose = (evt: MouseEvent) =>
    layoutDispatch?.({ type: "remove" }, evt);
  const classBase = "vuuHeader";

  const handleTitleMouseDown = (e: MouseEvent) => {
    labelFieldRef.current?.focus();
  };

  const handleButtonMouseDown = (evt: MouseEvent) => {
    // do not allow drag to be initiated
    evt.stopPropagation();
  };

  const orientation = collapsed || orientationProp;

  const className = classnames(
    classBase,
    classNameProp,
    `${classBase}-${orientation}`
  );

  const handleEnterEditMode = () => {
    setEditing(true);
  };

  const handleTitleKeyDown = (evt: KeyboardEvent<HTMLDivElement>) => {
    if (evt.key === "Enter") {
      setEditing(true);
    }
  };

  const handleExitEditMode = (
    originalValue = "",
    finalValue = "",
    allowDeactivation = true,
    editCancelled = false
  ) => {
    setEditing(false);
    if (editCancelled) {
      setValue(originalValue);
    } else if (finalValue !== originalValue) {
      setValue(finalValue);
    }
    if (allowDeactivation === false) {
      labelFieldRef.current?.focus();
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    layoutDispatch?.({ type: "mousedown" }, e);
  };

  const toolbarItems: ReactElement[] = [];
  const contributedItems: ReactElement[] = [];
  const actionButtons: ReactElement[] = [];

  title &&
    toolbarItems.push(
      <ToolbarField key="title">
        <EditableLabel
          editing={editing}
          key="title"
          value={value}
          onChange={setValue}
          onMouseDownCapture={handleTitleMouseDown}
          onEnterEditMode={handleEnterEditMode}
          onExitEditMode={handleExitEditMode}
          onKeyDown={handleTitleKeyDown}
          ref={labelFieldRef}
          tabIndex={0}
        />
      </ToolbarField>
    );

  contributions?.forEach((contribution, i) => {
    contributedItems.push(React.cloneElement(contribution.content, { key: i }));
  });

  closeable &&
    actionButtons.push(
      <ToolbarButton
        key="close"
        onClick={handleClose}
        onMouseDown={handleButtonMouseDown}
      >
        <CloseIcon /> Close
      </ToolbarButton>
    );

  contributedItems.length > 0 &&
    toolbarItems.push(
      <Tooltray data-align-end key="contributions">
        {contributedItems}
      </Tooltray>
    );

  actionButtons.length > 0 &&
    toolbarItems.push(
      <Tooltray data-align-end key="actions">
        {actionButtons}
      </Tooltray>
    );

  return (
    <Toolbar
      className={className}
      orientation={orientationProp}
      style={style}
      onMouseDown={handleMouseDown}
    >
      {toolbarItems}
      {/* 
      {collapsed === false ? (
        <ActionButton
          aria-label="Minimize View"
          actionId="minimize"
          iconName="minimize"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {collapsed ? (
        <ActionButton
          aria-label="Restore View"
          actionId="restore"
          iconName="double-chevron-right"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {expanded === false ? (
        <ActionButton
          aria-label="Maximize View"
          actionId="maximize"
          iconName="maximize"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {expanded ? (
        <ActionButton
          aria-label="Restore View"
          actionId="restore"
          iconName="restore"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {tearOut ? (
        <ActionButton
          aria-label="Tear out View"
          actionId="tearout"
          iconName="tear-out"
          onClick={handleAction}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null}
      {closeable ? (
        <Button
          aria-label="close"
          data-icon
          onClick={handleClose}
          onMouseDown={handleButtonMouseDown}
        />
      ) : null} */}
    </Toolbar>
  );
};
