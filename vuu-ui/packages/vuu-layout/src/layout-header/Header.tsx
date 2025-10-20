import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { EditableLabel, IconButton } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import { HTMLAttributes, MouseEvent, ReactElement, cloneElement } from "react";
import { Contribution } from "../layout-view/viewTypes";
import { useHeader } from "./useHeader";

import headerCss from "./Header.css";

export interface HeaderProps extends HTMLAttributes<HTMLDivElement> {
  allowRename?: boolean;
  collapsed?: boolean;
  contributions?: Contribution[];
  expanded?: boolean;
  closeable?: boolean;
  onCollapse?: () => void;
  onEditTitle?: (value: string) => void;
  onExpand?: () => void;
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
  onCollapse,
  onEditTitle,
  onExpand,
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

  const {
    editing,
    focusTitle,
    labelFieldRef,
    onClickEdit,
    onClose,
    onExitEditMode,
    onMouseDown,
    onTitleKeyDown,
    onToggleCollapse,
    onToggleExpand,
    setValue,
    value,
  } = useHeader({
    onCollapse,
    onEditTitle,
    onExpand,
    title,
  });

  const handleButtonMouseDown = (evt: MouseEvent) => {
    // do not allow drag to be initiated
    evt.stopPropagation();
  };

  const orientation = collapsed || orientationProp;

  const className = cx(classBase, classNameProp, `${classBase}-${orientation}`);

  const toolbarItems: ReactElement[] = [];
  const postTitleContributedItems: ReactElement[] = [];
  const actionButtons: ReactElement[] = [];
  const allowCollapse =
    typeof collapsed === "boolean" || typeof collapsed === "string";

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

  allowCollapse &&
    toolbarItems.push(
      <IconButton
        className={cx(`${classBase}-toggle`, {
          [`${classBase}-collapsed`]: collapsed,
        })}
        data-embedded
        icon={collapsed ? "chevron-open" : "chevron-down"}
        key="collapse-button"
        onClick={collapsed ? onToggleExpand : onToggleCollapse}
        size={20}
        tabIndex={0}
        appearance="transparent"
        sentiment="neutral"
      />,
    );

  title &&
    toolbarItems.push(
      <EditableLabel
        className={`${classBase}-title`}
        editing={editing}
        key="title"
        value={value}
        onChange={setValue}
        onMouseDownCapture={focusTitle}
        onExitEditMode={onExitEditMode}
        onKeyDown={onTitleKeyDown}
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
        onClick={onClickEdit}
        onMouseDown={handleButtonMouseDown}
        tabIndex={0}
        variant="secondary"
      />,
    );

  closeable &&
    actionButtons.push(
      <IconButton
        appearance="transparent"
        data-embedded
        icon="close"
        key="close"
        onClick={onClose}
        onMouseDown={handleButtonMouseDown}
        sentiment="neutral"
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
      onMouseDown={onMouseDown}
    >
      {toolbarItems}
    </div>
  );
};
