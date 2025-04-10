import {
  View,
  layoutFromJson,
  useLayoutProviderDispatch,
} from "@finos/vuu-layout";
import { IconButton } from "@finos/vuu-ui-controls";
import { LayoutJSON, VuuShellLocation } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  KeyboardEventHandler,
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
  content?: LayoutJSON;
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
  id = VuuShellLocation.ContextPanel,
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

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dispatchLayoutAction = useLayoutProviderDispatch();
  const handleClose = useCallback(() => {
    dispatchLayoutAction({
      path: `#${VuuShellLocation.ContextPanel}`,
      propName: "expanded",
      propValue: false,
      type: "set-prop",
    });
  }, [dispatchLayoutAction]);

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
      contentProp && expanded ? layoutFromJson(contentProp, "context-0") : null,
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
    >
      <View className={`${classBase}-inner`} header={false} id={id}>
        <div className={`${classBase}-header`}>
          <h2 className={`${classBase}-title`}>{title}</h2>
          <IconButton
            className={`${classBase}-close`}
            data-embedded
            icon="close"
            onClick={handleClose}
            onKeyDown={handleKeyDown}
            ref={closeButtonRef}
            size={16}
            variant="secondary"
          />
        </div>
        <div className={`${classBase}-content`}>{content}</div>
      </View>
    </div>
  );
};
