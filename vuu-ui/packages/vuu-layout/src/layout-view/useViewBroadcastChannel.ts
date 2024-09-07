import { VuuBroadcastChannel } from "@finos/vuu-utils";
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
    useRef<VuuBroadcastChannel<ViewBroadcastMessage>>();

  useEffect(() => {
    const broadcastChannel: VuuBroadcastChannel<ViewBroadcastMessage> =
      new BroadcastChannel("vuu");
    broadcastChannel.onmessage = (evt) => {
      console.log(`message received by ${id}`);
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
    console.log(`send message from ${id} to ${message.targetId}`, {
      message,
    });
    broadcastChannelRef.current?.postMessage(message);
  }, []);

  return sendMessage;
};
