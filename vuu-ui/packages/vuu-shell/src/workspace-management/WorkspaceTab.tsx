import { TabDialog } from "@heswell/grid-layout";
import { Button, Menu, MenuItem, MenuPanel, MenuTrigger } from "@salt-ds/core";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";
import { useCallback, useState } from "react";
import type { WorkspaceController } from "./WorkspaceController";

export interface WorkspaceTabProps {
  readonly active: boolean;
  readonly controller: WorkspaceController;
  readonly onClose: (instanceId: string) => Promise<void>;
  readonly onRename: (instanceId: string, title: string) => Promise<void>;
  readonly onSelect: (instanceId: string) => Promise<void>;
}

export const WorkspaceTab = ({
  active,
  controller,
  onClose,
  onRename,
  onSelect,
}: WorkspaceTabProps) => {
  const [renameOpen, setRenameOpen] = useState(false);

  const handleRename = useCallback(
    (title: string) => {
      void onRename(controller.instanceId, title)
        .then(() => {
          setRenameOpen(false);
        })
        .catch(() => undefined);
    },
    [controller.instanceId, onRename],
  );

  return (
    <>
      <div
        className={cx("vuuWorkspaceHost-tab", {
          "vuuWorkspaceHost-tab-active": active,
        })}
      >
        <button
          aria-selected={active}
          className="vuuWorkspaceHost-tabLabel"
          onClick={() => void onSelect(controller.instanceId)}
          role="tab"
          type="button"
        >
          {controller.name}
        </button>
        <Menu>
          <MenuTrigger>
            <Button
              aria-label={`${controller.name} actions`}
              className="vuuWorkspaceHost-tabMenuButton"
              data-embedded
            >
              <Icon aria-hidden name="more-vert" />
            </Button>
          </MenuTrigger>
          <MenuPanel>
            <MenuItem onClick={() => setRenameOpen(true)}>Rename</MenuItem>
            <MenuItem onClick={() => void onClose(controller.instanceId)}>
              Close
            </MenuItem>
          </MenuPanel>
        </Menu>
      </div>
      {renameOpen ? (
        <TabDialog
          onCancel={() => setRenameOpen(false)}
          onConfirm={handleRename}
          open
          tabLabel={controller.name}
          title="Rename workspace"
        />
      ) : null}
    </>
  );
};
