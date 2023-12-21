export interface Connection<T = unknown> {
  requiresLogin?: boolean;
  send: (message: T) => void;
  status:
    | "closed"
    | "ready"
    | "connection-open-awaiting-session"
    | "connected"
    | "reconnected";
}
