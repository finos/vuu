import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  Input,
} from "@salt-ds/core";
import {
  AddIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
} from "@salt-ds/icons";
import cx from "clsx";
import { type FormEvent, useState } from "react";
import type { VuuServerPresence } from "../connection-management/server-status";
import { AddServerForm } from "../portal-servers/AddServerForm";
import type { ManualVuuServer } from "../portal-servers/ManualVuuServers";
import { useVuuServerPresence } from "../portal-servers/vuu-server-presence";
import type { VuuServerCredentials } from "../auth/VuuServerLogin";

const classBase = "vuuPanelsPalette";

export interface PaletteServer {
  readonly connectionId: string;
  /** True for a server the user added, which they can remove. */
  readonly manual: boolean;
  readonly websocketUrl?: string;
}

const PRESENCE_LABELS: Record<VuuServerPresence, string> = {
  connecting: "Connecting",
  degraded: "Reconnecting",
  offline: "Offline",
  online: "Online",
  unauthorized: "Not authorized",
  unavailable: "Unavailable",
  unknown: "Status unknown",
};

const PresenceDot = ({ serverId }: { serverId: string }) => {
  const presence = useVuuServerPresence(serverId);
  return (
    <span
      aria-label={PRESENCE_LABELS[presence]}
      className={`${classBase}-serverDot`}
      data-presence={presence}
      role="img"
    />
  );
};

interface ServerRowProps {
  onRemove: (connectionId: string) => void;
  onSelect: (connectionId: string) => void;
  selected: boolean;
  server: PaletteServer;
}

const ServerRow = ({
  onRemove,
  onSelect,
  selected,
  server,
}: ServerRowProps) => (
  <li className={`${classBase}-serverItem`}>
    <button
      aria-pressed={selected}
      className={cx(`${classBase}-serverRow`, {
        [`${classBase}-serverRow-selected`]: selected,
      })}
      onClick={() => onSelect(server.connectionId)}
      title={server.websocketUrl}
      type="button"
    >
      <span className={`${classBase}-serverName`}>{server.connectionId}</span>
      <PresenceDot serverId={server.connectionId} />
    </button>
    {server.manual ? (
      <button
        aria-label={`Remove ${server.connectionId}`}
        className={`${classBase}-serverRemove`}
        onClick={() => onRemove(server.connectionId)}
        title="Remove server"
        type="button"
      >
        <CloseIcon aria-hidden />
      </button>
    ) : null}
  </li>
);

export interface PaletteServersProps {
  collapsed: boolean;
  onAdd: () => void;
  onRemove: (connectionId: string) => void;
  onSelect: (connectionId: string) => void;
  onToggle: () => void;
  selectedId?: string;
  servers: readonly PaletteServer[];
}

/**
 * The Vuu servers whose tables the palette can list, in a compact list
 * above the tables. Collapsed, the header shows the selected server.
 */
export const PaletteServers = ({
  collapsed,
  onAdd,
  onRemove,
  onSelect,
  onToggle,
  selectedId,
  servers,
}: PaletteServersProps) => (
  <section aria-label="Vuu servers" className={`${classBase}-servers`}>
    <div className={`${classBase}-serversHeader`}>
      <button
        aria-expanded={!collapsed}
        className={`${classBase}-serversToggle`}
        onClick={onToggle}
        type="button"
      >
        {collapsed ? (
          <ChevronRightIcon aria-hidden />
        ) : (
          <ChevronDownIcon aria-hidden />
        )}
        <span className={`${classBase}-serversLabel`}>Servers</span>
        {collapsed && selectedId ? (
          <span className={`${classBase}-serversSelected`}>
            <span aria-hidden>·</span>
            <span className={`${classBase}-serverName`}>{selectedId}</span>
            <PresenceDot serverId={selectedId} />
          </span>
        ) : (
          <span className={`${classBase}-groupCount`}>{servers.length}</span>
        )}
      </button>
      <button
        aria-label="Add server"
        className={`${classBase}-iconButton`}
        onClick={onAdd}
        title="Add server"
        type="button"
      >
        <AddIcon aria-hidden />
      </button>
    </div>
    {collapsed ? null : (
      <ul aria-label="Servers" className={`${classBase}-serverList`}>
        {servers.map((server) => (
          <ServerRow
            key={server.connectionId}
            onRemove={onRemove}
            onSelect={onSelect}
            selected={server.connectionId === selectedId}
            server={server}
          />
        ))}
      </ul>
    )}
  </section>
);

export interface AddServerDialogProps {
  existingIds: ReadonlySet<string>;
  onAdd: (server: ManualVuuServer, credentials?: VuuServerCredentials) => void;
  onClose: () => void;
  open: boolean;
}

/** "Add Vuu server" in a modal, with the sign-in for a Vuu login server. */
export const AddServerDialog = ({
  existingIds,
  onAdd,
  onClose,
  open,
}: AddServerDialogProps) => (
  <Dialog
    className={`${classBase}-dialog`}
    onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        onClose();
      }
    }}
    open={open}
    size="small"
  >
    <DialogHeader header="Add Vuu server" />
    <DialogContent>
      {open ? (
        <AddServerForm
          existingIds={existingIds}
          onAdd={onAdd}
          onCancel={onClose}
        />
      ) : null}
    </DialogContent>
  </Dialog>
);

export interface ServerSignInDialogProps {
  /** Why the last sign-in failed, if it did. */
  error?: string;
  onCancel: () => void;
  onSignIn: (credentials: VuuServerCredentials) => void;
  server?: Pick<PaletteServer, "connectionId" | "websocketUrl">;
  username?: string;
}

/** Username and password for a server that uses Vuu login, in a modal. */
export const ServerSignInDialog = ({
  error,
  onCancel,
  onSignIn,
  server,
  username: defaultUsername = "",
}: ServerSignInDialogProps) => {
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState("");
  const [lastServer, setLastServer] = useState(server?.connectionId);
  if (lastServer !== server?.connectionId) {
    setLastServer(server?.connectionId);
    setUsername(defaultUsername);
    setPassword("");
  }
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (username.trim()) {
      onSignIn({ password, username: username.trim() });
      setPassword("");
    }
  };
  return (
    <Dialog
      className={`${classBase}-dialog`}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
        }
      }}
      open={server !== undefined}
      size="small"
    >
      <DialogHeader
        description={server?.websocketUrl}
        header={`Sign in to ${server?.connectionId ?? ""}`}
      />
      <DialogContent>
        <form
          aria-label={`Sign in to ${server?.connectionId ?? ""}`}
          className={`${classBase}-signIn`}
          onSubmit={handleSubmit}
        >
          {error ? (
            <div className={`${classBase}-signInError`} role="alert">
              {error}
            </div>
          ) : null}
          <FormField>
            <FormFieldLabel>Username</FormFieldLabel>
            <Input
              inputProps={{ autoComplete: "username", name: "username" }}
              onChange={(event) =>
                setUsername((event.target as HTMLInputElement).value)
              }
              value={username}
            />
          </FormField>
          <FormField>
            <FormFieldLabel>Password</FormFieldLabel>
            <Input
              inputProps={{
                autoComplete: "current-password",
                autoFocus: true,
                name: "password",
                type: "password",
              }}
              onChange={(event) =>
                setPassword((event.target as HTMLInputElement).value)
              }
              value={password}
            />
            <FormFieldHelperText>
              Kept until you close this tab
            </FormFieldHelperText>
          </FormField>
          <div className={`${classBase}-signInActions`}>
            <Button
              appearance="bordered"
              onClick={onCancel}
              sentiment="neutral"
            >
              Cancel
            </Button>
            <Button
              disabled={!username.trim()}
              sentiment="accented"
              type="submit"
            >
              Sign in
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
