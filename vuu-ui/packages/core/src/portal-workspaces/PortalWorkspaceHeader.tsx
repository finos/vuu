import {
  Button,
  Overlay,
  OverlayPanel,
  OverlayPanelContent,
  OverlayTrigger,
} from "@salt-ds/core";
import { UndoIcon } from "@salt-ds/icons";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  useWorkspace,
  type WorkspaceSummary,
} from "../workspace/WorkspaceProvider";
import { WorkspaceNameInput } from "./WorkspaceNameInput";
import { getWorkspacePath } from "./workspace-routing";

const classBase = "vuuPortalWorkspaceHeader";

const MINUTE = 60_000;

/** e.g. "edited just now", "edited 2 min ago", "edited 3 h ago". */
export const formatEdited = (updatedAt?: string, now = Date.now()) => {
  const time = updatedAt ? Date.parse(updatedAt) : Number.NaN;
  if (Number.isNaN(time)) {
    return "edited";
  }
  const minutes = Math.floor(Math.max(0, now - time) / MINUTE);
  if (minutes < 1) {
    return "edited just now";
  }
  if (minutes < 60) {
    return `edited ${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `edited ${hours} h ago`;
  }
  return `edited ${new Date(time).toLocaleDateString()}`;
};

const WorkspaceStatus = ({ workspace }: { workspace: WorkspaceSummary }) => {
  if (workspace.kind === "named") {
    return <span className={`${classBase}-status`}>Saved</span>;
  }
  return workspace.isPersonalCopy ? (
    <span className={`${classBase}-status`} data-workspace-tag="personal-copy">
      <span className="vuuPortalNav-tag">Your copy</span>
      {formatEdited(workspace.updatedAt)}
    </span>
  ) : (
    <span className={`${classBase}-status`} data-workspace-tag="default">
      Default
    </span>
  );
};

interface ResetToDefaultProps {
  workspace: WorkspaceSummary;
}

/**
 * "Reset to default" for a system workspace with a personal copy: discards
 * the copy after confirmation, optionally saving it as a new workspace first.
 */
export const ResetToDefault = ({ workspace }: ResetToDefaultProps) => {
  const { resetToDefault, saveActiveWorkspaceAs, setActiveWorkspace } =
    useWorkspace();
  const { showNotification } = useNotifications();
  const navigate = useNavigate();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState<string>();
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const naming = saveAsName !== undefined;
  useLayoutEffect(() => {
    if (open) {
      (naming ? nameRef : cancelRef).current?.focus();
    }
  }, [naming, open]);

  const onOpenChange = (nextOpen: boolean) => {
    if (busy) return;
    setOpen(nextOpen);
    setSaveAsName(undefined);
  };

  const run = async (saveAs?: string) => {
    setBusy(true);
    try {
      let savedId: string | undefined;
      if (saveAs !== undefined) {
        // Save the copy shown here, whichever workspace was active.
        await setActiveWorkspace(workspace.id);
        savedId = await saveActiveWorkspaceAs(saveAs);
      }
      await resetToDefault(workspace.id);
      setOpen(false);
      setSaveAsName(undefined);
      if (savedId !== undefined) {
        navigate(getWorkspacePath(savedId));
      }
    } catch (cause) {
      showNotification({
        content: cause instanceof Error ? cause.message : String(cause),
        header: "Failed to Reset Workspace",
        status: "error",
        type: "toast",
      });
    } finally {
      setBusy(false);
    }
  };

  const onNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && saveAsName?.trim()) {
      event.preventDefault();
      void run(saveAsName.trim());
    }
  };

  return (
    <Overlay onOpenChange={onOpenChange} open={open} placement="bottom-end">
      <OverlayTrigger>
        <Button appearance="bordered" sentiment="neutral">
          <UndoIcon aria-hidden />
          Reset to default
        </Button>
      </OverlayTrigger>
      <OverlayPanel aria-labelledby={titleId}>
        <OverlayPanelContent>
          <div className="vuuPortalWorkspaceReset">
            <h3 id={titleId}>Reset {workspace.name} to default?</h3>
            <p>
              Your changes to the {workspace.name} layout are discarded. Save
              them as a new workspace first if you want to keep them.
            </p>
            {saveAsName === undefined ? (
              <div className="vuuPortalWorkspaceReset-actions">
                <Button
                  appearance="transparent"
                  disabled={busy}
                  onClick={() => setSaveAsName(`${workspace.name} copy`)}
                >
                  Save as new…
                </Button>
                <Button
                  appearance="transparent"
                  disabled={busy}
                  onClick={() => onOpenChange(false)}
                  ref={cancelRef}
                >
                  Cancel
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => void run()}
                  sentiment="negative"
                >
                  Reset
                </Button>
              </div>
            ) : (
              <>
                <label>
                  New workspace name
                  <input
                    className="vuuPortalWorkspaceHeader-nameInput"
                    onChange={(event) => setSaveAsName(event.target.value)}
                    onKeyDown={onNameKeyDown}
                    ref={nameRef}
                    type="text"
                    value={saveAsName}
                  />
                </label>
                <div className="vuuPortalWorkspaceReset-actions">
                  <Button
                    appearance="transparent"
                    disabled={busy}
                    onClick={() => setSaveAsName(undefined)}
                  >
                    Back
                  </Button>
                  <Button
                    disabled={busy || saveAsName.trim() === ""}
                    onClick={() => void run(saveAsName.trim())}
                    sentiment="negative"
                  >
                    Save and reset
                  </Button>
                </div>
              </>
            )}
          </div>
        </OverlayPanelContent>
      </OverlayPanel>
    </Overlay>
  );
};

export interface PortalWorkspaceHeaderProps {
  /** Actions before "Reset to default", e.g. "Add panel". */
  actions?: ReactNode;
  /** Put the name in edit mode, e.g. for a new workspace. */
  editName?: boolean;
  /** The name edit started by `editName` has ended. */
  onEditNameEnd?: () => void;
  workspace: WorkspaceSummary;
}

/**
 * Header of the workspace route: name (editable for named workspaces),
 * status, an actions slot and, for an edited system workspace, Reset to
 * default.
 */
export const PortalWorkspaceHeader = ({
  actions,
  editName = false,
  onEditNameEnd,
  workspace,
}: PortalWorkspaceHeaderProps) => {
  const { renameNamedWorkspace } = useWorkspace();
  const { showNotification } = useNotifications();
  const named = workspace.kind === "named";
  const [editing, setEditingState] = useState(false);
  const setEditing = (nextEditing: boolean) => {
    setEditingState(nextEditing);
    if (!nextEditing) {
      onEditNameEnd?.();
    }
  };

  useEffect(() => {
    if (editName && named) {
      setEditingState(true);
    }
  }, [editName, named]);

  const onRename = (name: string) => {
    setEditing(false);
    renameNamedWorkspace(workspace.id, name).catch((cause: unknown) =>
      showNotification({
        content: cause instanceof Error ? cause.message : String(cause),
        header: "Failed to Rename Workspace",
        status: "error",
        type: "toast",
      }),
    );
  };

  return (
    <header className={classBase} data-workspace-id={workspace.id}>
      <span className={`${classBase}-crumb`}>Workspaces /</span>
      {editing ? (
        <WorkspaceNameInput
          aria-label="Workspace name"
          className={`${classBase}-nameInput`}
          name={workspace.name}
          onCancel={() => setEditing(false)}
          onCommit={onRename}
        />
      ) : named ? (
        <h1 className={`${classBase}-heading`}>
          <button
            className={`${classBase}-title`}
            onClick={() => setEditing(true)}
            title="Rename workspace"
            type="button"
          >
            {workspace.name}
          </button>
        </h1>
      ) : (
        <h1 className={`${classBase}-title`}>{workspace.name}</h1>
      )}
      <WorkspaceStatus workspace={workspace} />
      <span className={`${classBase}-spacer`} />
      <div className={`${classBase}-actions`}>
        {actions}
        {workspace.kind === "system" && workspace.isPersonalCopy ? (
          <ResetToDefault workspace={workspace} />
        ) : null}
      </div>
    </header>
  );
};
