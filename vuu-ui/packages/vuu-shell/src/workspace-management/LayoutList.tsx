import { ListBox, Option } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import type { HTMLAttributes } from "react";
import { useWorkspace } from "./WorkspaceProvider";
import layoutListCss from "./LayoutList.css";

const classBase = "vuuLayoutList";
const NO_SELECTION: never[] = [];

export const LayoutList = ({
  className,
  title,
  ...htmlAttributes
}: HTMLAttributes<HTMLDivElement>) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-layout-list",
    css: layoutListCss,
    window: targetWindow,
  });
  const {
    deleteNamedWorkspace,
    namedWorkspaces,
    openNamedWorkspace,
    openSystemWorkspace,
    status,
    systemWorkspaces,
  } = useWorkspace();

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className, "vuuScrollable")}
    >
      <div className={`${classBase}-header`}>{title}</div>
      <div className={`${classBase}-content`}>
        {status === "loading" ? (
          <div role="status">Loading layouts…</div>
        ) : null}
        {systemWorkspaces.length > 0 ? (
          <div className={`${classBase}-group`}>
            <div className={`${classBase}-groupHeader`}>System Layouts</div>
            <ListBox selected={NO_SELECTION}>
              {systemWorkspaces.map((definition) => (
                <Option key={definition.id} value={definition.id}>
                  <button
                    onClick={() => void openSystemWorkspace(definition)}
                    type="button"
                  >
                    {definition.name}
                  </button>
                </Option>
              ))}
            </ListBox>
          </div>
        ) : null}
        <div className={`${classBase}-group`}>
          <div className={`${classBase}-groupHeader`}>My Layouts</div>
          {namedWorkspaces.length === 0 && status !== "loading" ? (
            <div>No saved workspaces</div>
          ) : (
            <ListBox selected={NO_SELECTION}>
              {namedWorkspaces.map((definition) => (
                <Option key={definition.id} value={definition.id}>
                  <button
                    onClick={() => void openNamedWorkspace(definition.id)}
                    type="button"
                  >
                    {definition.name}
                  </button>
                  <IconButton
                    aria-label={`Delete ${definition.name}`}
                    appearance="transparent"
                    icon="delete"
                    onClick={() => void deleteNamedWorkspace(definition.id)}
                    sentiment="neutral"
                  />
                </Option>
              ))}
            </ListBox>
          )}
        </div>
      </div>
    </div>
  );
};
