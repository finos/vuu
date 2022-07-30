export interface Connection<T = unknown> {
  send: (message: T) => void;
  status: 'closed' | 'ready' | 'connected' | 'reconnected';
}
