import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { Component, type ReactNode, useEffect, useMemo, useRef } from "react";
import {
  AuthenticationProvider,
  useOptionalIdentityContext,
  useOptionalVuuConnectionId,
  useVuuServers,
} from "../auth/AuthenticationProvider";
import { useData } from "../context-definitions/DataProvider";
import { useVuuServerConnection } from "../portal-components/vuu-table-component";

export interface PanelsServerOption {
  readonly connectionId: string;
  readonly websocketUrl?: string;
}

/**
 * The Vuu servers the portal knows about: the current connection, the
 * portal's own server (or local servers), and the servers used by
 * registered modules. In order, without duplicates.
 */
export const usePanelsServerOptions = (): PanelsServerOption[] => {
  const currentConnectionId = useOptionalVuuConnectionId();
  const identity = useOptionalIdentityContext();
  const servers = useVuuServers();
  return useMemo(() => {
    const options = new Map<string, PanelsServerOption>();
    const add = (connectionId: string | undefined, websocketUrl?: string) => {
      if (connectionId && !options.has(connectionId)) {
        options.set(
          connectionId,
          websocketUrl ? { connectionId, websocketUrl } : { connectionId },
        );
      }
    };
    if (identity?.localServers) {
      // In local mode, only local servers have data.
      for (const connectionId of identity.localServers.keys()) {
        add(connectionId);
      }
      return Array.from(options.values());
    }
    if (identity) {
      add(
        identity.portalTarget.connectionId,
        identity.portalTarget.websocketUrl,
      );
    }
    add(currentConnectionId);
    for (const { connectionId, websocketUrl } of servers) {
      add(connectionId, websocketUrl);
    }
    return Array.from(options.values());
  }, [currentConnectionId, identity, servers]);
};

export type ServerTablesState =
  | { readonly status: "loading" }
  | { readonly status: "loaded"; readonly tables: readonly VuuTable[] }
  | { readonly message: string; readonly status: "error" };

interface ReportProps {
  onChange: (state: ServerTablesState) => void;
}

const TableListLoader = ({ onChange }: ReportProps) => {
  const { getServerAPI } = useData();
  // Data providers and callers need not memoise these, so load once per
  // mount (the loader is keyed by server) using the latest callbacks.
  const callbacks = useRef({ getServerAPI, onChange });
  callbacks.current = { getServerAPI, onChange };
  useEffect(() => {
    let current = true;
    const report = (state: ServerTablesState) => {
      if (current) {
        callbacks.current.onChange(state);
      }
    };
    report({ status: "loading" });
    callbacks.current
      .getServerAPI()
      .then((serverAPI) => serverAPI.getTableList())
      .then(({ tables }) => report({ status: "loaded", tables }))
      .catch((error: unknown) =>
        report({
          message: error instanceof Error ? error.message : String(error),
          status: "error",
        }),
      );
    return () => {
      current = false;
    };
  }, []);
  return null;
};

const Report = ({
  onChange,
  state,
}: ReportProps & { state: ServerTablesState }) => {
  useEffect(() => onChange(state), [onChange, state]);
  return null;
};

class LoaderErrorBoundary extends Component<
  ReportProps & { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    this.props.onChange({ message: error.message, status: "error" });
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const LOADING: ServerTablesState = { status: "loading" };

/**
 * Lists the tables of a Vuu server, through the portal's connection
 * management, and reports them with `onChange`. Renders nothing.
 */
export const ServerTablesLoader = ({
  onChange,
  serverId,
}: ReportProps & { serverId: string }) => {
  const resolution = useVuuServerConnection(serverId);
  const unavailable = useMemo<ServerTablesState>(
    () => ({
      message: `Vuu server ${serverId} is not available.`,
      status: "error",
    }),
    [serverId],
  );
  switch (resolution.status) {
    case "pending":
      return <Report onChange={onChange} state={LOADING} />;
    case "unavailable":
      return <Report onChange={onChange} state={unavailable} />;
    case "current":
      return (
        <LoaderErrorBoundary key={serverId} onChange={onChange}>
          <TableListLoader onChange={onChange} />
        </LoaderErrorBoundary>
      );
    default:
      return (
        <LoaderErrorBoundary key={serverId} onChange={onChange}>
          <AuthenticationProvider
            connection={resolution.connection}
            mode="vuu-connection"
          >
            <TableListLoader onChange={onChange} />
          </AuthenticationProvider>
        </LoaderErrorBoundary>
      );
  }
};
