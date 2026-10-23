import { Button, Menu, MenuItem, MenuTrigger } from "@salt-ds/core";
import { useGridLayoutDispatch } from "@heswell/grid-layout";
import { registerComponent } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import { useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { ChromeMenuPanel } from "../chrome/ChromeMenu";
import { standaloneUrl } from "../example/preview-state";
import { useExampleDrag } from "./workspace-drag";
import type { WorkspacePanelProps } from "./workspace-grid";
import { WORKSPACE_PANEL_TYPE } from "./workspace-model";
import { useWorkspacePageContext } from "./WorkspacePageContext";

const classBase = "ShowcaseWorkspacePanel";

/** e.g /Filters/FilterBar/DefaultFilterBar => Filters › Filter bar */
const folderLabel = (path: string) =>
  path.slice(1).split("/").slice(0, -1).join(" › ");

/**
 * An example within a workspace. Rendered by GridLayout, its header is the
 * drag handle used to rearrange, split or stack panels.
 */
export const WorkspacePanel = ({ examplePath, title }: WorkspacePanelProps) => {
  const {
    maximisedItemId,
    preview,
    reloadCount,
    setMaximisedItemId,
    showSource,
  } = useWorkspacePageContext();
  const dispatch = useGridLayoutDispatch();
  const navigate = useNavigate();
  const exampleDrag = useExampleDrag();
  const rootRef = useRef<HTMLDivElement>(null);
  const [itemId, setItemId] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);

  useLayoutEffect(() => {
    setItemId(rootRef.current?.closest(".vuuGridLayoutItem")?.id);
  }, []);

  const maximised = itemId !== undefined && itemId === maximisedItemId;
  const toggleMaximised = () =>
    setMaximisedItemId(maximised ? undefined : itemId);
  const close = () => {
    if (itemId) {
      if (maximised) {
        setMaximisedItemId(undefined);
      }
      dispatch({ type: "close", id: itemId });
    }
  };

  const src = standaloneUrl(examplePath, {
    ...preview,
    ds: "local",
    vp: "fill",
  });

  return (
    <div
      className={cx(classBase, { [`${classBase}-maximised`]: maximised })}
      data-maximised={maximised || undefined}
      ref={rootRef}
    >
      <div className={`${classBase}-header`}>
        <span
          className={`${classBase}-handle vuuDraggableLabel`}
          draggable
          title="Drag to rearrange, split or stack"
        >
          <ChromeIcon name="grip" size={14} />
          <span className={`${classBase}-title`}>{title}</span>
        </span>
        <span className={`${classBase}-path`}>{folderLabel(examplePath)}</span>
        <div className={`${classBase}-actions`}>
          <Button
            appearance="transparent"
            aria-label={maximised ? "Restore" : "Maximise"}
            className={`${classBase}-action`}
            onClick={toggleMaximised}
            title={maximised ? "Restore" : "Maximise"}
          >
            <ChromeIcon name={maximised ? "minimise" : "maximise"} size={14} />
          </Button>
          <Menu placement="bottom-end">
            <MenuTrigger>
              <Button
                appearance="transparent"
                aria-label={`${title} actions`}
                className={`${classBase}-action`}
              >
                <ChromeIcon name="more" size={14} />
              </Button>
            </MenuTrigger>
            <ChromeMenuPanel heading={title}>
              <MenuItem onClick={() => navigate(examplePath)}>
                <ChromeIcon name="external" size={14} />
                Open as example
              </MenuItem>
              <MenuItem onClick={() => showSource(examplePath)}>
                <ChromeIcon name="code" size={14} />
                View source
              </MenuItem>
              <MenuItem onClick={toggleMaximised}>
                <ChromeIcon
                  name={maximised ? "minimise" : "maximise"}
                  size={14}
                />
                {maximised ? "Restore" : "Maximise"}
              </MenuItem>
              <MenuItem onClick={() => setReloadKey((key) => key + 1)}>
                <ChromeIcon name="refresh" size={14} />
                Reload panel
              </MenuItem>
              <MenuItem className="ShowcaseMenu-danger" onClick={close}>
                <ChromeIcon name="close" size={14} />
                Remove from workspace
              </MenuItem>
            </ChromeMenuPanel>
          </Menu>
          <Button
            appearance="transparent"
            aria-label={`Remove ${title}`}
            className={`${classBase}-action`}
            onClick={close}
            title="Remove from workspace"
          >
            <ChromeIcon name="close" size={14} />
          </Button>
        </div>
      </div>
      <div className={`${classBase}-content`}>
        <iframe
          className={cx("ShowCaseIFrame", {
            // iframes swallow drag events, a drop can't be detected over one
            [`${classBase}-inert`]: exampleDrag !== undefined,
          })}
          key={`${reloadCount}:${reloadKey}`}
          src={src}
          title={title}
        />
      </div>
    </div>
  );
};

WorkspacePanel.displayName = WORKSPACE_PANEL_TYPE;

/** GridLayout re-creates panels from json, using the component registry */
registerComponent(WORKSPACE_PANEL_TYPE, WorkspacePanel, "view");
