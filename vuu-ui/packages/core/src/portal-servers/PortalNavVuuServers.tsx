import { AddIcon, CloseIcon, DatabaseIcon } from "@salt-ds/icons";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AddServerForm } from "./AddServerForm";
import type { VuuServerPresence } from "../connection-management/server-status";
import { useVuuServerPresence } from "./vuu-server-presence";
import {
  type PortalVuuServer,
  useManualVuuServers,
  usePortalVuuServers,
} from "./ManualVuuServers";

import portalNavVuuServersCss from "./PortalNavVuuServers.css";

const classBase = "vuuPortalNavServers";

/** The path of the Browse page of a server, below `basePath`. */
export const getVuuServerBrowsePath = (basePath: string, serverId: string) =>
  `${basePath.replace(/\/$/, "")}/${encodeURIComponent(serverId)}`;

/** The server of a Browse page path, if `pathname` is one. */
export const getVuuServerIdFromPath = (
  basePath: string,
  pathname: string,
): string | undefined => {
  const prefix = `${basePath.replace(/\/$/, "")}/`;
  if (!pathname.startsWith(prefix)) {
    return undefined;
  }
  const [segment] = pathname.slice(prefix.length).split("/");
  if (!segment) {
    return undefined;
  }
  try {
    return decodeURIComponent(segment);
  } catch {
    return undefined;
  }
};

const PRESENCE_LABELS: Record<VuuServerPresence, string> = {
  connecting: "Connecting",
  degraded: "Reconnecting",
  offline: "Offline",
  online: "Online",
  unauthorized: "Not authorized",
  unavailable: "Unavailable",
  unknown: "Status unknown",
};

const ServerRow = ({
  active,
  basePath,
  onRemove,
  server,
}: {
  active: boolean;
  basePath: string;
  onRemove: (connectionId: string) => void;
  server: PortalVuuServer;
}) => {
  const presence = useVuuServerPresence(server.connectionId);
  return (
    <li
      className={cx(`${classBase}-server`, {
        [`${classBase}-server-manual`]: server.manual,
      })}
      data-server-id={server.connectionId}
    >
      <Link
        aria-current={active ? "page" : undefined}
        className={cx(`${classBase}-link`, {
          [`${classBase}-link-active`]: active,
        })}
        data-portal-nav-focusable=""
        title={server.websocketUrl}
        to={getVuuServerBrowsePath(basePath, server.connectionId)}
      >
        <DatabaseIcon aria-hidden className={`${classBase}-icon`} />
        <span className={`${classBase}-label`}>{server.connectionId}</span>
        <span
          aria-label={PRESENCE_LABELS[presence]}
          className={`${classBase}-status`}
          data-presence={presence}
          role="img"
        />
      </Link>
      {server.manual ? (
        <button
          aria-label={`Remove ${server.connectionId}`}
          className={`${classBase}-remove`}
          onClick={() => onRemove(server.connectionId)}
          type="button"
        >
          <CloseIcon aria-hidden />
        </button>
      ) : null}
    </li>
  );
};

export interface PortalNavVuuServersProps {
  /** Path of the table browser. Each server links to `basePath/<server>`. */
  basePath: string;
  className?: string;
}

/**
 * The Vuu servers to browse, nested under the table browser's nav item
 * (see `PortalNav renderItemChildren`): each links to the server's Browse
 * page and shows its status. "Add server" adds a server, kept in the user's
 * saved state; added servers can be removed.
 */
export const PortalNavVuuServers = ({
  basePath,
  className,
}: PortalNavVuuServersProps) => {
  useComponentCssInjection({
    testId: "vuu-portal-nav-servers",
    css: portalNavVuuServersCss,
    window: useWindow(),
  });
  const servers = usePortalVuuServers();
  const { addServer, removeServer } = useManualVuuServers();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const activeServerId = getVuuServerIdFromPath(basePath, pathname);
  const existingIds = useMemo(
    () => new Set(servers.map(({ connectionId }) => connectionId)),
    [servers],
  );

  const handleRemove = (connectionId: string) => {
    removeServer(connectionId);
    if (connectionId === activeServerId) {
      navigate(basePath);
    }
  };

  return (
    <div className={cx(classBase, className)}>
      <ul aria-label="Vuu servers" className={`${classBase}-list`}>
        {servers.map((server) => (
          <ServerRow
            active={server.connectionId === activeServerId}
            basePath={basePath}
            key={server.connectionId}
            onRemove={handleRemove}
            server={server}
          />
        ))}
      </ul>
      {adding ? (
        <AddServerForm
          existingIds={existingIds}
          onAdd={(server) => {
            addServer(server);
            setAdding(false);
            navigate(getVuuServerBrowsePath(basePath, server.connectionId));
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          className={`${classBase}-add`}
          data-portal-nav-focusable=""
          onClick={() => setAdding(true)}
          type="button"
        >
          <AddIcon aria-hidden />
          <span>Add server</span>
        </button>
      )}
    </div>
  );
};
