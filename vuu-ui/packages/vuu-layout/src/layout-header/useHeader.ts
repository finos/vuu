import {
  KeyboardEvent,
  MouseEventHandler,
  useCallback,
  useRef,
  useState,
} from "react";
import type { HeaderProps } from "./Header";
import { useViewDispatch } from "../layout-view-actions/ViewContext";
import { queryClosest } from "@vuu-ui/vuu-utils";

export interface HeaderHookProps
  extends Pick<HeaderProps, "onCollapse" | "onEditTitle" | "onExpand"> {
  debugString?: string;
  title: string;
}

export const useHeader = ({
  onCollapse,
  onEditTitle,
  onExpand,
  title,
}: HeaderHookProps) => {
  const [editing, setEditing] = useState<boolean>(false);
  const [value, setValue] = useState<string>(title);
  const labelFieldRef = useRef<HTMLDivElement>(null);

  const viewDispatch = useViewDispatch();
  const handleClose = useCallback<MouseEventHandler>(
    (evt) => viewDispatch?.({ type: "remove" }, evt),
    [viewDispatch],
  );

  const focusTitle = useCallback(() => {
    labelFieldRef.current?.focus();
  }, []);

  const handleClickEdit = useCallback(() => {
    focusTitle();
    setEditing((isEditing) => !isEditing);
  }, [focusTitle]);

  const handleTitleKeyDown = (evt: KeyboardEvent<HTMLDivElement>) => {
    if (evt.key === "Enter") {
      setEditing(true);
    }
  };

  const handleMouseDown = useCallback<MouseEventHandler>(
    (e) => {
      const button = queryClosest(e.target, ".saltButton");
      if (button === null) {
        // This is for drag start detection.
        viewDispatch?.({ type: "mousedown" }, e);
      }
    },
    [viewDispatch],
  );

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

  const handleToggleCollapse = useCallback<MouseEventHandler>(
    (e) => {
      viewDispatch?.({ type: "collapse" }, e);
      onCollapse?.();
    },
    [onCollapse, viewDispatch],
  );

  const handleToggleExpand = useCallback<MouseEventHandler>(
    (e) => {
      viewDispatch?.({ type: "expand" }, e);
      onExpand?.();
    },
    [onExpand, viewDispatch],
  );

  return {
    editing,
    focusTitle,
    labelFieldRef,
    onClickEdit: handleClickEdit,
    onClose: handleClose,
    onExitEditMode: handleExitEditMode,
    onMouseDown: handleMouseDown,
    onToggleCollapse: handleToggleCollapse,
    onToggleExpand: handleToggleExpand,
    onTitleKeyDown: handleTitleKeyDown,
    setValue,
    value,
  };
};
