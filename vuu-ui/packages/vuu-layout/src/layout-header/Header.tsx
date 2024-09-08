import { EditableLabel, IconButton } from "@finos/vuu-ui-controls";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactElement,
  cloneElement,
  useCallback,
  useRef,
  useState,
} from "react";
import { Contribution } from "../layout-view";
import { useViewDispatch } from "../layout-view-actions/ViewContext";

import headerCss from "./Header.css";

export interface HeaderProps extends HTMLAttributes<HTMLDivElement> {
  allowRename?: boolean;
  collapsed?: boolean;
  contributions?: Contribution[];
  expanded?: boolean;
  closeable?: boolean;
  onEditTitle: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  tearOut?: boolean;
}

const classBase = "vuuHeader";

export const Header = ({
  allowRename = false,
  className: classNameProp,
  contributions,
  collapsed,
  closeable,
  onEditTitle,
  orientation: orientationProp = "horizontal",
  style,
  title = "Untitled",
}: HeaderProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-header",
    css: headerCss,
    window: targetWindow,
  });

  const labelFieldRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<string>(title);
  const [editing, setEditing] = useState<boolean>(false);

  const viewDispatch = useViewDispatch();
  const handleClose = (evt: MouseEvent) =>
    viewDispatch?.({ type: "remove" }, evt);

  const focusTitle = useCallback(() => {
    labelFieldRef.current?.focus();
  }, []);

  const handleClickEdit = useCallback(() => {
    focusTitle();
    setEditing((isEditing) => !isEditing);
  }, [focusTitle]);

  const handleButtonMouseDown = (evt: MouseEvent) => {
    // do not allow drag to be initiated
    evt.stopPropagation();
  };

  const orientation = collapsed || orientationProp;

  const className = cx(classBase, classNameProp, `${classBase}-${orientation}`);

  const handleTitleKeyDown = (evt: KeyboardEvent<HTMLDivElement>) => {
    if (evt.key === "Enter") {
      setEditing(true);
    }
  };

  const handleExitEditMode = (
    originalValue = "",
    finalValue = "",
    allowDeactivation = true,
    editCancelled = false,
  ) => {
    setEditing(false);
    if (editCancelled) {
      setValue(originalValue);
    } else if (finalValue !== originalValue) {
      setValue(finalValue);
      onEditTitle?.(finalValue);
    }
    if (allowDeactivation === false) {
      labelFieldRef.current?.focus();
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    viewDispatch?.({ type: "mousedown" }, e);
  };

  const toolbarItems: ReactElement[] = [];
  const postTitleContributedItems: ReactElement[] = [];
  const actionButtons: ReactElement[] = [];

  contributions?.forEach((contribution, i) => {
    switch (contribution.location) {
      case "pre-title":
        toolbarItems.push(cloneElement(contribution.content, { key: i }));
        break;
      default:
        postTitleContributedItems.push(
          cloneElement(contribution.content, { key: i }),
        );
    }
  });

  title &&
    toolbarItems.push(
      <EditableLabel
        className={`${classBase}-title`}
        editing={editing}
        key="title"
        value={value}
        onChange={setValue}
        onMouseDownCapture={focusTitle}
        onExitEditMode={handleExitEditMode}
        onKeyDown={handleTitleKeyDown}
        ref={labelFieldRef}
      />,
    );

  allowRename &&
    toolbarItems.push(
      <IconButton
        className={`${classBase}-edit`}
        data-embedded
        icon="edit"
        key="edit-button"
        onClick={handleClickEdit}
        onMouseDown={handleButtonMouseDown}
        tabIndex={0}
        variant="secondary"
      />,
    );

  closeable &&
    actionButtons.push(
      <IconButton
        data-embedded
        icon="close"
        key="close"
        onClick={handleClose}
        onMouseDown={handleButtonMouseDown}
        variant="secondary"
      />,
    );

  postTitleContributedItems.length > 0 &&
    toolbarItems.push(
      <div data-align="end" key="contributions">
        {postTitleContributedItems}
      </div>,
    );

  actionButtons.length > 0 &&
    toolbarItems.push(
      <div data-align="end" key="actions">
        {actionButtons}
      </div>,
    );

  return (
    <div
      className={cx("vuuToolbarProxy", className)}
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
    </div>
  );
};
