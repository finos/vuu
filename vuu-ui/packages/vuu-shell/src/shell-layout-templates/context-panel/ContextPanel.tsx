import {
  View,
  layoutFromJson,
  useLayoutProviderDispatch,
} from "@vuu-ui/vuu-layout";
import { IconButton, useHideContextPanel } from "@vuu-ui/vuu-ui-controls";
import { LayoutJSON, VuuShellLocation } from "@vuu-ui/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import React, {
  KeyboardEventHandler,
  ReactElement,
  ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

import contextPanelCss from "./ContextPanel.css";

const classBase = "vuuContextPanel";

export interface ContextPanelProps {
  [key: string]: unknown;
  className?: string;
  content?: ReactElement | LayoutJSON;
  expanded?: boolean;
  id?: string;
  onClose?: () => void;
  overlay?: boolean;
  title?: ReactNode;
}

export const ContextPanel = ({
  className: classNameProp,
  expanded = false,
  content: contentProp,
  id,
  onClose,
  overlay = false,
  title,
}: ContextPanelProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-context-panel",
    css: contextPanelCss,
    window: targetWindow,
  });

  const hideContextPanel = useHideContextPanel();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dispatchLayoutAction = useLayoutProviderDispatch();
  const handleClose = useCallback(() => {
    if (hideContextPanel) {
      hideContextPanel();
    } else {
      dispatchLayoutAction({
        path: `#${VuuShellLocation.ContextPanel}`,
        propName: "expanded",
        propValue: false,
        type: "set-prop",
      });
    }
  }, [dispatchLayoutAction, hideContextPanel]);

  const handleKeyDown = useCallback<KeyboardEventHandler>(
    (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    },
    [handleClose],
  );

  const className = cx(classBase, classNameProp, {
    [`${classBase}-expanded`]: expanded,
    [`${classBase}-inline`]: overlay !== true,
    [`${classBase}-overlay`]: overlay,
  });

  const content = useMemo(
    () =>
      contentProp && expanded
        ? React.isValidElement(contentProp)
          ? contentProp
          : layoutFromJson(contentProp, "context-0")
        : null,
    [contentProp, expanded],
  );

  useLayoutEffect(() => {
    if (expanded) {
      // Components loaded into the ContextPanel will often assume focus themselves,
      //but if not, default to close button
      closeButtonRef.current?.focus();
    } else {
      onClose?.();
    }
  }, [expanded, onClose]);

  return (
    <div
      className={cx(classBase, className, "vuuScrollable", {
        [`${classBase}-expanded`]: expanded,
      })}
      id={id}
    >
      <View className={`${classBase}-inner`} header={false} id={id}>
        <div className={`${classBase}-header`}>
          <h2 className={`${classBase}-title`}>{title}</h2>
          <IconButton
            appearance="transparent"
            className={`${classBase}-close`}
            data-embedded
            icon="close"
            onClick={handleClose}
            onKeyDown={handleKeyDown}
            ref={closeButtonRef}
            sentiment="neutral"
            size={16}
          />
        </div>
        <div className={`${classBase}-content`}>{content}</div>
      </View>
    </div>
  );
};
