interface VuuBroadcastChannelEventMap<T> {
  message: MessageEvent<T>;
  messageerror: MessageEvent<T>;
}

export interface VuuBroadcastChannel<T> extends EventTarget {
  readonly name: string;
  onmessage: ((this: BroadcastChannel, evt: MessageEvent<T>) => void) | null;
  onmessageerror:
    | ((this: BroadcastChannel, evt: MessageEvent<T>) => void)
    | null;
  close(): void;
  postMessage<M extends T = T>(message: M): void;
  addEventListener<K extends keyof VuuBroadcastChannelEventMap<T>>(
    type: K,
    listener: (
      this: BroadcastChannel,
      evt: VuuBroadcastChannelEventMap<T>[K]
    ) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof VuuBroadcastChannelEventMap<T>>(
    type: K,
    listener: (
      this: BroadcastChannel,
      evt: VuuBroadcastChannelEventMap<T>[K]
    ) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}
