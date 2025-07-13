import {
  ClientMessageBody,
  VuuServerMessage,
  VuuViewportRangeRequest,
} from "@vuu-ui/vuu-protocol-types";

export type MessageHandler<TMessage> = (message: TMessage) => void;

export type WebSocketConstructorProps = {
  WebSocketClass: new (
    props: Omit<WebSocketConstructorProps, "WebSocketClass">,
    onReady?: () => void,
  ) => IWebSocket;
  latency?: number;
  url?: string;
};

export interface IWebSocket {
  on: (messageHandler: MessageHandler<VuuServerMessage>) => void;
  send: (vuuClientMessage: ClientMessageBody) => void;
  sendRangeRequest: (serverRequest: VuuViewportRangeRequest) => void;
}
