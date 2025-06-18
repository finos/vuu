import { VuuBroadcastChannel } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useRef } from "react";

export interface ViewBroadcastMessage {
  path?: string;
  targetId?: string;
  type: "highlight-on" | "highlight-off" | "layout-closed";
}

export type BroadcastMessageHandler = (message: ViewBroadcastMessage) => void;

const isMessageForSelf = (
  message: ViewBroadcastMessage,
  id?: string,
  path?: string,
) => {
  if (id && message.targetId === id) {
    return true;
  } else if (message.path && path?.startsWith(message.path)) {
    return true;
  }
  return false;
};

export const useViewBroadcastChannel = (
  id?: string,
  path?: string,
  onMessageReceived?: BroadcastMessageHandler,
) => {
  const broadcastChannelRef =
    useRef<VuuBroadcastChannel<ViewBroadcastMessage>>(undefined);

  useEffect(() => {
    const broadcastChannel: VuuBroadcastChannel<ViewBroadcastMessage> =
      new BroadcastChannel("vuu");
    broadcastChannel.onmessage = (evt) => {
      if (isMessageForSelf(evt.data, id, path)) {
        onMessageReceived?.(evt.data);
      }
    };
    broadcastChannelRef.current = broadcastChannel;
    return () => {
      broadcastChannel.close();
      broadcastChannelRef.current = undefined;
    };
  }, [id, onMessageReceived, path]);

  const sendMessage = useCallback((message: ViewBroadcastMessage) => {
    broadcastChannelRef.current?.postMessage(message);
  }, []);

  return sendMessage;
};
