import { VuuBroadcastChannel } from "packages/vuu-utils/src";
import { RefObject, useCallback, useEffect, useRef } from "react";

export interface ViewBroadcastMessage {
  targetId: string;
  type: "highlight-on" | "highlight-off";
}

export const useViewBroadcastChannel = (
  id: string,
  rootRef: RefObject<HTMLDivElement>
) => {
  const broadcastChannelRef =
    useRef<VuuBroadcastChannel<ViewBroadcastMessage>>();

  useEffect(() => {
    console.log(`useViewActionChannnel create Channel ${id}`);
    const broadcastChannel: VuuBroadcastChannel<ViewBroadcastMessage> =
      new BroadcastChannel("vuu");
    broadcastChannel.onmessage = (evt) => {
      if (evt.data.targetId === id) {
        switch (evt.data.type) {
          case "highlight-on":
            rootRef.current?.classList.add("vuuHighlighted");
            break;
          case "highlight-off":
            rootRef.current?.classList.remove("vuuHighlighted");
            break;
        }
      }
    };
    broadcastChannelRef.current = broadcastChannel;
    return () => {
      broadcastChannel.close();
      broadcastChannelRef.current = undefined;
    };
  }, [id]);

  const sendMessage = useCallback((message: ViewBroadcastMessage) => {
    broadcastChannelRef.current?.postMessage(message);
  }, []);

  return sendMessage;
};
