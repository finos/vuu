export interface Connection<T = unknown> {
  requiresLogin?: boolean;
  send: (message: T) => void;
  status: 'closed' | 'ready' | 'connected' | 'reconnected';
}
