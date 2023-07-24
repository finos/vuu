import { Button } from "@salt-ds/core";
import cx from "classnames";
import { useCallback } from "react";
import { useLayoutProviderDispatch } from "@finos/vuu-layout";

import "./ContextPanel.css";

const classBase = "vuuContextPanel";

export interface ContextPanelProps {
  [key: string]: unknown;
  className?: string;
  context?: string;
  expanded?: boolean;
  overlay?: boolean;
}

export const ContextPanel = ({
  className: classNameProp,
  expanded = false,
  overlay = false,
  title,
}: ContextPanelProps) => {
  const dispatchLayoutAction = useLayoutProviderDispatch();
  const handleClose = useCallback(() => {
    dispatchLayoutAction({
      path: "#context-panel",
      propName: "expanded",
      propValue: false,
      type: "set-prop",
    });
  }, [dispatchLayoutAction]);
  // TODO look up content using context

  const className = cx(classBase, classNameProp, {
    [`${classBase}-expanded`]: expanded,
    [`${classBase}-inline`]: overlay !== true,
    [`${classBase}-overlay`]: overlay,
  });

  return (
    <div className={cx(classBase, className)}>
      <div className={`${classBase}-inner`}>
        <div className={`${classBase}-header`}>
          <h2 className={`${classBase}-title`}>{title}</h2>
          <Button
            className={`${classBase}-close`}
            data-icon="close"
            onClick={handleClose}
            variant="secondary"
          />
        </div>
      </div>
    </div>
  );
};
