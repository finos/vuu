import { useOptionalIdentityContext } from "../auth/AuthenticationProvider";
import {
  isUnavailablePresence,
  type VuuServerPresence,
} from "../connection-management/server-status";
import { useVuuServerConnection } from "../portal-components/vuu-table-component";
import { useVuuServerStatus } from "../server-monitor/VuuServerMonitorProvider";

/**
 * The presence of a server for display: offline if the portal cannot
 * connect to it at all, otherwise as monitored. An unmonitored local server
 * is online.
 */
export const useVuuServerPresence = (serverId: string): VuuServerPresence => {
  const identity = useOptionalIdentityContext();
  const resolution = useVuuServerConnection(serverId);
  const { monitored, presence } = useVuuServerStatus(serverId);
  if (resolution.status === "unavailable") {
    return "offline";
  }
  if (identity?.localServers?.has(serverId) && !monitored) {
    return "online";
  }
  return presence;
};

/**
 * True if the portal cannot reach this server: an unknown server, or a known
 * one that is offline or refuses the user. Reconnecting (`degraded`) and
 * unmonitored (`unknown`) servers are not treated as unreachable.
 */
export const useVuuServerUnreachable = (serverId: string) =>
  isUnavailablePresence(useVuuServerPresence(serverId));
