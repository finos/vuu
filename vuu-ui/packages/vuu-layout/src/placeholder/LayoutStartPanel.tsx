import { Button } from "@salt-ds/core";
import { HTMLAttributes, useMemo, useState } from "react";
import { useViewContext, QueryReponse } from "../layout-view-actions";

import "./LayoutStartPanel.css";

const classBase = "vuuLayoutStartPanel";

export interface LayoutStartPanelProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export const LayoutStartPanel = (htmlAttributes: LayoutStartPanelProps) => {
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
      if ((response as QueryReponse)?.parentContainerId === "main-tabs") {
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
          <header className={`${classBase}-title`}>
            Start by adding a table
          </header>
          <div className={`${classBase}-text`}>
            To add a table, drag any of the Vuu Tables to this area or click the
            button below
          </div>
        </>
      ) : null}
      <Button
        className={`${classBase}-addButton`}
        data-icon="add"
        variant="cta"
      />
    </div>
  );
};
