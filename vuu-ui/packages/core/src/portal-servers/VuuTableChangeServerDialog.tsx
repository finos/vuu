import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogHeader,
  Text,
} from "@salt-ds/core";
import { useEffect, useState } from "react";
import {
  VUU_TABLE_CHANGE_SERVER_EVENT,
  type VuuTableChangeServerRequest,
} from "../portal-components/vuu-table-component";
import { usePortalVuuServers } from "./ManualVuuServers";

const classBase = "vuuTableChangeServerDialog";

const isChangeServerEvent = (
  event: Event,
): event is CustomEvent<VuuTableChangeServerRequest> =>
  event instanceof CustomEvent &&
  typeof event.detail?.setServerId === "function";

export interface VuuTableChangeServerDialogProps {
  /** Where `vuu-table-change-server` events are handled. Default: `document`. */
  target?: EventTarget;
}

/**
 * Handles Change server, from the error state of a `vuu-table` item: lists
 * the portal's Vuu servers and points the item at the one chosen.
 * `PortalShell` renders one.
 */
export const VuuTableChangeServerDialog = ({
  target,
}: VuuTableChangeServerDialogProps) => {
  const servers = usePortalVuuServers();
  const [request, setRequest] = useState<VuuTableChangeServerRequest>();

  useEffect(() => {
    const eventTarget =
      target ?? (typeof document === "undefined" ? undefined : document);
    if (!eventTarget) {
      return;
    }
    const handleEvent = (event: Event) => {
      if (isChangeServerEvent(event)) {
        setRequest(event.detail);
      }
    };
    eventTarget.addEventListener(VUU_TABLE_CHANGE_SERVER_EVENT, handleEvent);
    return () =>
      eventTarget.removeEventListener(
        VUU_TABLE_CHANGE_SERVER_EVENT,
        handleEvent,
      );
  }, [target]);

  const close = () => setRequest(undefined);
  const settings = request?.settings;

  return (
    <Dialog
      className={classBase}
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
      open={request !== undefined}
      size="small"
    >
      <DialogHeader header="Change server" />
      <DialogContent>
        <Text>
          Show {settings?.module}:{settings?.table} from another Vuu server.
        </Text>
        <ul aria-label="Vuu servers" className={`${classBase}-servers`}>
          {servers.map(({ connectionId }) => (
            <li key={connectionId}>
              <Button
                appearance="transparent"
                aria-current={
                  connectionId === settings?.serverId ? "true" : undefined
                }
                disabled={connectionId === settings?.serverId}
                onClick={() => {
                  request?.setServerId(connectionId);
                  close();
                }}
              >
                {connectionId}
              </Button>
            </li>
          ))}
        </ul>
      </DialogContent>
      <DialogActions>
        <Button appearance="transparent" onClick={close}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
