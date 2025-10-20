import { IconButton } from "@vuu-ui/vuu-ui-controls";
import { VuuShellLocation } from "@vuu-ui/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, useMemo, useState } from "react";
import {
  QueryResponse,
  useViewContext,
} from "../layout-view-actions/ViewContext";

import layoutStartPanelCss from "./LayoutStartPanel.css";

const classBase = "vuuLayoutStartPanel";

export interface LayoutStartPanelProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export const LayoutStartPanel = (htmlAttributes: LayoutStartPanelProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-layout-start-panel",
    css: layoutStartPanelCss,
    window: targetWindow,
  });

  const { dispatch, path } = useViewContext();
  const [displayState, setDisplayState] = useState<
    "initial" | "nested" | undefined
  >();

  useMemo(() => {
    dispatch?.({
      type: "query",
      path,
      query: "PARENT_CONTAINER",
    }).then((response) => {
      if (
        (response as QueryResponse)?.parentContainerId ===
        VuuShellLocation.Workspace
      ) {
        setDisplayState("initial");
      } else {
        setDisplayState("nested");
      }
    });
  }, [dispatch, path]);

  if (displayState === undefined) {
    return null;
  }

  const showInitialState = displayState === "initial";

  return (
    <div {...htmlAttributes} className={classBase}>
      {showInitialState ? (
        <>
          <div className={`${classBase}-title`}>Start by adding a table</div>
          <div className={`${classBase}-text`}>
            To add a table, drag any of the Vuu Tables to this area or click the
            button below
          </div>
        </>
      ) : null}
      <IconButton
        className={`${classBase}-addButton`}
        icon="add"
        variant="cta"
      />
    </div>
  );
};
