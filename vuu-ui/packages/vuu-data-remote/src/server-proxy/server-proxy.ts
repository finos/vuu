import type {
  DataSourceCallbackMessage,
  DataSourceVisualLinkCreatedMessage,
  DataSourceVisualLinkRemovedMessage,
  ServerProxySubscribeMessage,
  TableSchema,
  VuuUIMessageIn,
  VuuUIMessageOut,
  VuuUIMessageOutCloseTreeNode,
  VuuUIMessageOutConfig,
  VuuUIMessageOutConnect,
  VuuUIMessageOutOpenTreeNode,
  VuuUIMessageOutSetTitle,
  VuuUIMessageOutSubscribe,
  VuuUIMessageOutUnsubscribe,
  VuuUIMessageOutViewRange,
  WithRequestId,
} from "@vuu-ui/vuu-data-types";
import type {
  ClientMessageBody,
  VuuRpcMenuRequest,
  VuuClientMessage,
  LinkDescriptorWithLabel,
  VuuServerMessage,
  VuuTableListResponse,
  VuuTableMetaResponse,
  VuuLinkDescriptor,
  VuuTable,
  VuuRpcRequest,
  VuuCreateVisualLink,
  VuuRemoveVisualLink,
  VuuViewportRangeRequest,
  VuuRpcServiceRequest,
  VuuViewportCreateResponse,
  SelectRequest,
} from "@vuu-ui/vuu-protocol-types";
import {
  isVuuMenuRpcRequest,
  isViewportMessage,
  logger,
  partition,
  isOpenDialogAction,
  isSessionTable,
  isSessionTableActionMessage,
  isVisualLinkMessage,
  isRpcServiceRequest,
  hasViewPortContext,
  isSelectRequest,
  isCreateVpSuccess,
} from "@vuu-ui/vuu-utils";
import {
  createSchemaFromTableMetadata,
  groupRowsByViewport,
  hasRequestId,
  stripRequestId,
} from "../message-utils";
import * as Message from "./messages";
import { NO_DATA_UPDATE, Viewport } from "./viewport";
import {
  WebSocketConnection,
  WebSocketConnectionState,
} from "../WebSocketConnection";

export type PostMessageToClientCallback = (
  message: VuuUIMessageIn | DataSourceCallbackMessage,
) => void;

export type MessageOptions = {
  module?: string;
};

let _requestId = 1;
export const TEST_setRequestId = (id: number) => (_requestId = id);

const { debug, debugEnabled, error, info, infoEnabled, warn } =
  logger("ServerProxy");

const nextRequestId = () => `${_requestId++}`;
const DEFAULT_OPTIONS: MessageOptions = {};

const isActiveViewport = (viewPort: Viewport) =>
  viewPort.disabled !== true && viewPort.suspended !== true;

const addTitleToLinks = (
  links: LinkDescriptorWithLabel[],
  serverViewportId: string,
  label: string,
) =>
  links.map((link) =>
    link.parentVpId === serverViewportId ? { ...link, label } : link,
  );

function addLabelsToLinks(
  links: VuuLinkDescriptor[],
  viewports: Map<string, Viewport>,
): LinkDescriptorWithLabel[] {
  return links.map<LinkDescriptorWithLabel>((linkDescriptor) => {
    const { parentVpId } = linkDescriptor;
    const viewport = viewports.get(parentVpId);
    if (viewport) {
      return {
        ...linkDescriptor,
        parentClientVpId: viewport.clientViewportId,
        label: viewport.title,
      };
    } else {
      throw Error("addLabelsToLinks viewport not found");
    }
  });
}

type PendingRequest<T = unknown> = {
  reject: (err: unknown) => void;
  resolve: (value: T | PromiseLike<T>) => void;
};

interface PendingLogin {
  resolve: (sessionId: string) => void;
  reject: () => void;
}

type QueuedRequest = {
  clientViewportId: string;
  message: VuuViewportRangeRequest;
  requestId: string;
};

export class ServerProxy {
  private connection: WebSocketConnection;
  private postMessageToClient: PostMessageToClientCallback;
  private viewports: Map<string, Viewport>;
  private mapClientToServerViewport: Map<string, string>;
  private authToken = "";
  private pendingLogin?: PendingLogin;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private sessionId?: string;
  private queuedRequests: Array<QueuedRequest> = [];
  private cachedTableMetaRequests: Map<string, Promise<VuuTableMetaResponse>> =
    new Map();
  private cachedTableSchemas: Map<string, TableSchema> = new Map();
  private tableList: Promise<VuuTableListResponse> | undefined;

  constructor(
    connection: WebSocketConnection,
    callback: PostMessageToClientCallback,
  ) {
    this.connection = connection;
    this.postMessageToClient = callback;
    this.viewports = new Map<string, Viewport>();
    this.mapClientToServerViewport = new Map();

    connection.on("reconnected", this.reconnect);
    connection.on("connection-status", this.connectionStatusChanged);
  }

  private connectionStatusChanged = (message: WebSocketConnectionState) => {
    if (message.connectionStatus === "disconnected") {
      this.clearAllViewports();
    }
  };

  private reconnect = async () => {
    await this.login(this.authToken);

    // The "active" viewports are those the user has on their open layout
    // Reconnect these first.
    const [activeViewports, inactiveViewports] = partition(
      Array.from(this.viewports.values()),
      isActiveViewport,
    );

    this.viewports.clear();
    this.mapClientToServerViewport.clear();

    const reconnectViewports = (viewports: Viewport[]) => {
      viewports.forEach((viewport) => {
        const { clientViewportId } = viewport;

        this.awaitResponseToMessage<VuuViewportCreateResponse>(
          viewport.subscribe(),
          clientViewportId,
        ).then((msg) => {
          if (msg.type === "CREATE_VP_SUCCESS") {
            this.mapClientToServerViewport.set(
              clientViewportId,
              msg.viewPortId,
            );
            this.viewports.set(msg.viewPortId, viewport);
            // TODO should we just call viewport.reconnected()
            viewport.status = "subscribed";
            viewport.serverViewportId = msg.viewPortId;
          } else {
            // handle reject
          }
        });
      });

      // this.sendMessageToServer(viewport.subscribe(), clientViewportId);
    };

    reconnectViewports(activeViewports);

    setTimeout(() => {
      reconnectViewports(inactiveViewports);
    }, 2000);
  };

  public async login(authToken?: string): Promise<string | void> {
    if (authToken) {
      this.authToken = authToken;
      return new Promise((resolve, reject) => {
        this.sendMessageToServer({ type: "LOGIN", token: this.authToken }, "");
        this.pendingLogin = { resolve, reject };
      });
    } else if (this.authToken === "") {
      error("login, cannot login until auth token has been obtained");
    }
  }

  public clearAllViewports() {
    this.viewports.forEach((viewport) => {
      viewport.clearCache();
    });
  }

  public disconnect() {
    this.viewports.forEach((viewport) => {
      const { clientViewportId } = viewport;
      this.unsubscribe(clientViewportId);
      this.postMessageToClient({
        clientViewportId,
        type: "viewport-clear",
      });
    });
  }

  public async subscribe(message: ServerProxySubscribeMessage) {
    // guard against subscribe message when a viewport is already subscribed
    if (!this.mapClientToServerViewport.has(message.viewport)) {
      const pendingTableSchema = this.getTableMeta(message.table);
      const viewport = new Viewport(message, this.postMessageToClient);
      this.viewports.set(message.viewport, viewport);
      // Use client side viewport id as request id, so that when we process the response, which
      // will provide the serverside viewport id, we can establish a mapping between the two.
      const pendingSubscription =
        this.awaitResponseToMessage<VuuViewportCreateResponse>(
          viewport.subscribe(),
          message.viewport,
        );

      const [subscribeResponse, tableSchema] = await Promise.all([
        pendingSubscription,
        pendingTableSchema,
      ]);

      if (isCreateVpSuccess(subscribeResponse)) {
        const { viewPortId: serverViewportId } = subscribeResponse;
        const { status: previousViewportStatus } = viewport;
        // switch storage key from client viewportId to server viewportId
        if (message.viewport !== serverViewportId) {
          this.viewports.delete(message.viewport);
          this.viewports.set(serverViewportId, viewport);
        }
        this.mapClientToServerViewport.set(message.viewport, serverViewportId);

        const clientResponse = viewport.handleSubscribed(
          subscribeResponse,
          tableSchema,
        );
        if (clientResponse) {
          this.postMessageToClient(clientResponse);
          if (debugEnabled) {
            debug(
              `post DataSourceSubscribedMessage to client: ${JSON.stringify(
                clientResponse,
              )}`,
            );
          }
        }

        // In the case of a reconnect, we may have resubscribed a disabled viewport,
        // reset the disabled state on server
        if (viewport.disabled) {
          this.disableViewport(viewport);
        }

        if (this.queuedRequests.length > 0) {
          this.processQueuedRequests();
        }

        if (
          previousViewportStatus === "subscribing" &&
          // A session table will never have Visual Links, nor Context Menus
          !isSessionTable(viewport.table)
        ) {
          // If status is "resubscribing", the following is unnecessary
          this.sendMessageToServer({
            type: Message.GET_VP_VISUAL_LINKS,
            vpId: serverViewportId,
          });
          this.sendMessageToServer({
            type: Message.GET_VIEW_PORT_MENUS,
            vpId: serverViewportId,
          });

          // Resend requests for links from other viewports already on page, they may be linkable to this viewport
          Array.from(this.viewports.entries())
            .filter(
              ([id, { disabled, status }]) =>
                id !== serverViewportId && !disabled && status === "subscribed",
            )
            .forEach(([vpId]) => {
              this.sendMessageToServer({
                type: Message.GET_VP_VISUAL_LINKS,
                vpId,
              });
            });
        }
      } else {
        //TODO handle CREATE_VP_REJECT
      }
    } else {
      error(`spurious subscribe call ${message.viewport}`);
    }
  }

  /**
   * Currently we only queue range requests, this may change
   */
  private addRequestToQueue(queuedRequest: QueuedRequest) {
    const isDifferentTypeViewport = (qr: QueuedRequest) =>
      qr.clientViewportId !== queuedRequest.clientViewportId ||
      queuedRequest.message.type !== qr.message.type;

    // Do not queue multiple requests of the same type for the same viewport.
    // Latest takes priority
    if (!this.queuedRequests.every(isDifferentTypeViewport)) {
      this.queuedRequests = this.queuedRequests.filter(isDifferentTypeViewport);
    }

    this.queuedRequests.push(queuedRequest);
  }

  private processQueuedRequests() {
    const newQueue: QueuedRequest[] = [];
    for (const queuedRequest of this.queuedRequests) {
      const { clientViewportId, message, requestId } = queuedRequest;
      const serverViewportId =
        this.mapClientToServerViewport.get(clientViewportId);
      if (serverViewportId) {
        this.sendMessageToServer(
          {
            ...message,
            viewPortId: serverViewportId,
          },
          requestId,
        );
      } else if (this.viewports.has(clientViewportId)) {
        // If the clientViewportId is still used a a key in the viewport map, this
        // viewport has not yet subscribed. Keep in the queue
        newQueue.push(queuedRequest);
      } else {
        console.warn(
          `ServerProxy processQueuedRequests, ${message.type} request not found ${clientViewportId}`,
        );
      }
    }

    this.queuedRequests = newQueue;
  }

  public unsubscribe(clientViewportId: string) {
    const serverViewportId =
      this.mapClientToServerViewport.get(clientViewportId);
    if (serverViewportId) {
      info?.(
        `Unsubscribe Message (Client to Server):
        ${serverViewportId}`,
      );
      this.sendMessageToServer({
        type: Message.REMOVE_VP,
        viewPortId: serverViewportId,
      });
    } else {
      error(
        `failed to unsubscribe client viewport ${clientViewportId}, viewport not found`,
      );
    }
  }

  private getViewportForClient(clientViewportId: string): Viewport;
  private getViewportForClient(
    clientViewportId: string,
    throws: false,
  ): Viewport | null;
  private getViewportForClient(clientViewportId: string, throws = true) {
    const serverViewportId =
      this.mapClientToServerViewport.get(clientViewportId);
    if (serverViewportId) {
      const viewport = this.viewports.get(serverViewportId);
      if (viewport) {
        return viewport;
      } else if (throws) {
        throw Error(
          `Viewport not found for client viewport ${clientViewportId}`,
        );
      } else {
        return null;
      }
    } else if (this.viewports.has(clientViewportId)) {
      // Still stored under client viewportId means it is waiting for CREATE_VP to be acked
      return this.viewports.get(clientViewportId);
    } else if (throws) {
      throw Error(
        `Viewport server id not found for client viewport ${clientViewportId}`,
      );
    } else {
      return null;
    }
  }

  /**********************************************************************/
  /* Handle messages from client                                        */
  /**********************************************************************/
  private setViewRange(viewport: Viewport, message: VuuUIMessageOutViewRange) {
    const requestId = nextRequestId();
    infoEnabled &&
      info(`setViewRange (${message.range.from}:${message.range.to})`);
    const [serverRequest, rows, debounceRequest] = viewport.rangeRequest(
      requestId,
      message.range,
    );

    if (viewport.status === "subscribed") {
      info?.(`setViewRange ${message.range.from} - ${message.range.to}`);

      // if (!serverRequest && !rows) {
      //   console.log(
      //     `%c[ServerProxy] no server request and no rows from cache`,
      //     "color:red;font-weight:bold;",
      //   );
      // }

      if (serverRequest) {
        // console.log(
        //   `[ServerProxy] ==> CHANGE_VP_RANGE (${message.range.from}-${message.range.to}) => (${serverRequest.from}-${serverRequest.to})`,
        // );
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (process.env.NODE_ENV === "development") {
          info?.(
            `CHANGE_VP_RANGE (${message.range.from}-${message.range.to}) => (${serverRequest.from}-${serverRequest.to})`,
          );
        }
        infoEnabled &&
          info(
            `setViewRange send CHANGE_VP_RANGE<#${requestId}> (${serverRequest.from}-${serverRequest.to})`,
          );
        this.sendMessageToServer(serverRequest, requestId);
      }

      if (rows) {
        info?.(`setViewRange ${rows.length} rows returned from cache`);
        // console.log(
        //   `%c[ServerProxy] post rows to client ${rows.map((r) => r[0]).join(",")}`,
        //   "color:brown",
        // );
        this.postMessageToClient({
          mode: "update",
          type: "viewport-update",
          clientViewportId: viewport.clientViewportId,
          range: message.range,
          rows,
        });
      } else if (debounceRequest) {
        this.postMessageToClient(debounceRequest);
      }
    } else if (serverRequest) {
      this.addRequestToQueue({
        clientViewportId: message.viewport,
        message: serverRequest,
        requestId,
      });
    }
  }

  // TODO check config has actually changed
  private setConfig(viewport: Viewport, message: VuuUIMessageOutConfig) {
    const requestId = nextRequestId();
    const request = viewport.setConfig(requestId, message.config);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  private setTitle(viewport: Viewport, message: VuuUIMessageOutSetTitle) {
    if (viewport) {
      viewport.title = message.title;
      this.updateTitleOnVisualLinks(viewport);
    }
  }

  private select(viewport: Viewport, message: WithRequestId<SelectRequest>) {
    const [requestId, selectRequest] = stripRequestId<SelectRequest>(message);
    const request = viewport.selectRequest(selectRequest);
    this.sendMessageToServer(request, requestId);
  }

  private disableViewport(viewport: Viewport) {
    const requestId = nextRequestId();
    const request = viewport.disable(requestId);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  private enableViewport(viewport: Viewport) {
    if (viewport.disabled) {
      const requestId = nextRequestId();
      const request = viewport.enable(requestId);
      this.sendIfReady(request, requestId, viewport.status === "subscribed");
    }
  }

  private freezeViewport(viewport: Viewport) {
    const requestId = nextRequestId();
    const request = viewport.freeze(requestId);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  private unfreezeViewport(viewport: Viewport) {
    if (viewport.frozen) {
      const requestId = nextRequestId();
      const request = viewport.unfreeze(requestId);
      this.sendIfReady(request, requestId, viewport.status === "subscribed");
    }
  }

  private suspendViewport(
    viewport: Viewport,
    escalateToDisable = true,
    escalateDelay = 3000,
  ) {
    viewport.suspend();
    if (escalateToDisable) {
      viewport.suspendTimer = setTimeout(() => {
        info?.("suspendTimer expired, escalate suspend to disable");
        this.disableViewport(viewport);
      }, escalateDelay);
    }
  }
  private resumeViewport(viewport: Viewport) {
    if (viewport.suspendTimer) {
      debug?.("clear suspend timer");
      clearTimeout(viewport.suspendTimer);
      viewport.suspendTimer = null;
    }
    const [size, rows] = viewport.resume();
    debug?.(`resumeViewport size ${size}, ${rows.length} rows sent to client`);
    this.postMessageToClient({
      clientViewportId: viewport.clientViewportId,
      mode: "update",
      rows,
      size,
      type: "viewport-update",
    });
  }

  private openTreeNode(
    viewport: Viewport,
    message: VuuUIMessageOutOpenTreeNode,
  ) {
    if (viewport.serverViewportId) {
      const requestId = nextRequestId();
      this.sendIfReady(
        viewport.openTreeNode(requestId, message),
        requestId,
        viewport.status === "subscribed",
      );
    }
  }

  private closeTreeNode(
    viewport: Viewport,
    message: VuuUIMessageOutCloseTreeNode,
  ) {
    if (viewport.serverViewportId) {
      const requestId = nextRequestId();
      this.sendIfReady(
        viewport.closeTreeNode(requestId, message),
        requestId,
        viewport.status === "subscribed",
      );
    }
  }

  private createLink(
    viewport: Viewport,
    message: WithRequestId<VuuCreateVisualLink>,
  ) {
    const [requestId, visualLinkRequest] =
      stripRequestId<VuuCreateVisualLink>(message);
    const parentVpId = this.mapClientToServerViewport.get(message.parentVpId);
    if (parentVpId) {
      const request = viewport.createLink(requestId, {
        ...visualLinkRequest,
        parentVpId,
      });
      this.sendMessageToServer(request, requestId);
    } else {
      throw Error(`createLink parent viewport not found ${message.parentVpId}`);
    }
  }

  private removeLink(
    viewport: Viewport,
    message: WithRequestId<VuuRemoveVisualLink>,
  ) {
    const { requestId } = message;
    const request = viewport.removeLink(requestId);
    this.sendMessageToServer(request, requestId);
  }

  private updateTitleOnVisualLinks(viewport: Viewport) {
    const { serverViewportId, title } = viewport;
    for (const vp of this.viewports.values()) {
      if (vp !== viewport && vp.links && serverViewportId && title) {
        if (vp.links?.some((link) => link.parentVpId === serverViewportId)) {
          const [messageToClient] = vp.setLinks(
            addTitleToLinks(vp.links, serverViewportId, title),
          );
          this.postMessageToClient(messageToClient);
        }
      }
    }
  }

  private removeViewportFromVisualLinks(serverViewportId: string) {
    for (const vp of this.viewports.values()) {
      if (vp.links?.some(({ parentVpId }) => parentVpId === serverViewportId)) {
        const [messageToClient] = vp.setLinks(
          vp.links.filter(({ parentVpId }) => parentVpId !== serverViewportId),
        );
        this.postMessageToClient(messageToClient);
      }
    }
  }

  private menuRpcCall(message: WithRequestId<VuuRpcMenuRequest>) {
    const viewport = this.getViewportForClient(message.vpId, false);
    if (viewport?.serverViewportId) {
      const [requestId, rpcRequest] =
        stripRequestId<VuuRpcMenuRequest>(message);
      this.sendMessageToServer(
        {
          ...rpcRequest,
          vpId: viewport.serverViewportId,
        },
        requestId,
      );
    }
  }

  private rpcRequest(message: WithRequestId<VuuRpcServiceRequest>) {
    if (hasViewPortContext(message)) {
      const viewport = this.getViewportForClient(
        message.context.viewPortId,
        false,
      );
      if (viewport?.serverViewportId) {
        const [requestId, rpcRequest] =
          stripRequestId<VuuRpcServiceRequest>(message);
        this.sendMessageToServer(
          {
            ...rpcRequest,
            context: {
              type: "VIEWPORT_CONTEXT",
              viewPortId: viewport.serverViewportId,
            },
          },
          requestId,
        );
      }
    } else {
      throw Error(
        `[ServerProxy] rpcRequest only supports VIEWPORT_CONTEXT at present`,
      );
    }
  }

  public handleMessageFromClient(
    message:
      | Exclude<
          VuuUIMessageOut,
          | VuuUIMessageOutConnect
          | VuuUIMessageOutSubscribe
          | VuuUIMessageOutUnsubscribe
        >
      | WithRequestId<VuuRpcServiceRequest>
      | WithRequestId<VuuRpcMenuRequest>
      | WithRequestId<VuuCreateVisualLink>
      | WithRequestId<VuuRemoveVisualLink>
      | WithRequestId<SelectRequest>,
  ) {
    if (isViewportMessage(message) || isVisualLinkMessage(message)) {
      if (message.type === "disable") {
        // Viewport may already have been unsubscribed
        const viewport = this.getViewportForClient(message.viewport, false);
        if (viewport !== null) {
          return this.disableViewport(viewport);
        } else {
          return;
        }
      } else {
        const viewport = isVisualLinkMessage(message)
          ? this.getViewportForClient(message.childVpId)
          : this.getViewportForClient(message.viewport);
        switch (message.type) {
          case "setViewRange":
            return this.setViewRange(viewport, message);
          case "config":
            return this.setConfig(viewport, message);
          case "suspend": {
            const { escalateToDisable, escalateDelay } = message;
            return this.suspendViewport(
              viewport,
              escalateToDisable,
              escalateDelay,
            );
          }
          case "resume":
            return this.resumeViewport(viewport);
          case "enable":
            return this.enableViewport(viewport);
          case "FREEZE_VP":
            return this.freezeViewport(viewport);
          case "UNFREEZE_VP":
            return this.unfreezeViewport(viewport);
          case "openTreeNode":
            return this.openTreeNode(viewport, message);
          case "closeTreeNode":
            return this.closeTreeNode(viewport, message);
          case "CREATE_VISUAL_LINK":
            return this.createLink(viewport, message);
          case "REMOVE_VISUAL_LINK":
            return this.removeLink(viewport, message);
          case "setTitle":
            return this.setTitle(viewport, message);
          default:
        }
      }
    } else if (isSelectRequest(message)) {
      if (hasRequestId<SelectRequest>(message)) {
        const viewport = this.getViewportForClient(message.vpId);
        return this.select(viewport, message);
      } else {
        console.warn(`selectRequest must have requestId`);
      }
    } else if (isRpcServiceRequest(message)) {
      return this.rpcRequest(message);
    } else if (isVuuMenuRpcRequest(message as VuuRpcRequest)) {
      return this.menuRpcCall(message as WithRequestId<VuuRpcMenuRequest>);
    } else if (message.type === "disconnect") {
      return this.disconnect();
    } else {
      const { type, requestId } = message;
      switch (type) {
        case "GET_TABLE_LIST": {
          this.tableList ??= this.awaitResponseToMessage(
            { type },
            requestId,
          ) as Promise<VuuTableListResponse>;
          this.tableList.then((response) => {
            this.postMessageToClient({
              type: "TABLE_LIST_RESP",
              tables: response.tables,
              requestId,
            });
          });
          return;
        }

        case "GET_TABLE_META": {
          this.getTableMeta(message.table, requestId).then((tableSchema) => {
            if (tableSchema) {
              this.postMessageToClient({
                type: "TABLE_META_RESP",
                tableSchema,
                requestId,
              });
            }
          });
          return;
        }
        default:
      }
    }
    error(
      `Vuu ServerProxy Unexpected message from client ${JSON.stringify(
        message,
      )}`,
    );
  }

  private getTableMeta(table: VuuTable, requestId = nextRequestId()) {
    if (isSessionTable(table)) {
      // Do not cache session table
      return this.awaitResponseToMessage<VuuTableMetaResponse>(
        { type: "GET_TABLE_META", table },
        requestId,
      ).then(createSchemaFromTableMetadata);
    }
    const key = `${table.module}:${table.table}`;
    let tableMetaRequest = this.cachedTableMetaRequests.get(key);
    if (!tableMetaRequest) {
      tableMetaRequest = this.awaitResponseToMessage(
        { type: "GET_TABLE_META", table },
        requestId,
      ) as Promise<VuuTableMetaResponse>;
      this.cachedTableMetaRequests.set(key, tableMetaRequest);
    }
    return tableMetaRequest?.then((response) => this.cacheTableMeta(response));
  }

  private awaitResponseToMessage<T = unknown>(
    message: ClientMessageBody,
    requestId = nextRequestId(),
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.sendMessageToServer(message, requestId);
      this.pendingRequests.set(requestId, { reject, resolve });
    });
  }

  public sendIfReady(
    message: VuuClientMessage["body"],
    requestId: string,
    isReady = true,
  ) {
    // TODO implement the message queuing in remote data view
    if (isReady) {
      this.sendMessageToServer(message, requestId);
    }
    return isReady;
  }

  public sendMessageToServer(
    body: VuuClientMessage["body"],
    requestId = `${_requestId++}`,
    options: MessageOptions = DEFAULT_OPTIONS,
  ) {
    const { module = "CORE" } = options;
    if (this.authToken) {
      this.connection.send({
        requestId,
        sessionId: this.sessionId,
        module,
        body,
      } as VuuClientMessage);
    }
  }

  public handleMessageFromServer(message: VuuServerMessage) {
    const { body, requestId, sessionId } = message;

    const pendingRequest = this.pendingRequests.get(requestId);
    if (pendingRequest) {
      const { resolve } = pendingRequest;
      this.pendingRequests.delete(requestId);
      resolve(body);
      return;
    }

    const { viewports } = this;
    switch (body.type) {
      case Message.HB:
        this.sendMessageToServer(
          { type: Message.HB_RESP, ts: +new Date() },
          "NA",
        );
        break;

      case "LOGIN_SUCCESS":
        if (sessionId) {
          this.sessionId = sessionId;
          this.pendingLogin?.resolve(sessionId);
          this.pendingLogin = undefined;
          this.postMessageToClient(body);
        } else {
          throw Error("LOGIN_SUCCESS did not provide sessionId");
        }
        break;
      case "LOGIN_FAIL":
        this.postMessageToClient(body);
        break;
      case "REMOVE_VP_SUCCESS":
        {
          const viewport = viewports.get(body.viewPortId);
          if (viewport) {
            this.mapClientToServerViewport.delete(viewport.clientViewportId);
            // do we need a destroy method on viewport ?
            viewports.delete(body.viewPortId);
            this.removeViewportFromVisualLinks(body.viewPortId);
          }
        }
        break;

      case "SELECT_ALL_SUCCESS":
      case "SELECT_ROW_SUCCESS":
      case "SELECT_ROW_RANGE_SUCCESS":
      case "DESELECT_ROW_SUCCESS": {
        const { type, selectedRowCount } = body;
        this.postMessageToClient({
          requestId,
          type,
          selectedRowCount,
        });
        break;
      }
      case "DESELECT_ALL_SUCCESS": {
        const { type } = body;
        this.postMessageToClient({
          requestId,
          type,
          selectedRowCount: 0,
        });

        break;
      }

      case "SELECT_ROW_REJECT":
      case "DESELECT_ROW_REJECT":
      case "SELECT_ROW_RANGE_REJECT":
      case "SELECT_ALL_REJECT":
      case "DESELECT_ALL_REJECT":
        console.warn(`select error ${body.type} ${body.errorMsg}`);
        break;

      case Message.CHANGE_VP_SUCCESS:
      case Message.DISABLE_VP_SUCCESS:
        if (viewports.has(body.viewPortId)) {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const response = viewport.completeOperation(requestId);
            if (response !== undefined) {
              this.postMessageToClient(response);
              if (debugEnabled) {
                debug(`postMessageToClient ${JSON.stringify(response)}`);
              }
            }
          }
        }

        break;

      case Message.ENABLE_VP_SUCCESS:
        {
          //TODO resend menus, links etc to client
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const response = viewport.completeOperation(requestId);
            if (response) {
              this.postMessageToClient(response);
              const [size, rows] = viewport.resume();
              this.postMessageToClient({
                clientViewportId: viewport.clientViewportId,
                mode: "update",
                rows,
                size,
                type: "viewport-update",
              });
            }
          }
        }
        break;

      case "FREEZE_VP_SUCCESS":
        {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const response = viewport.completeOperation(requestId);
            if (response) {
              this.postMessageToClient(response);
            }
          }
        }
        break;
      case "UNFREEZE_VP_SUCCESS":
        {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const response = viewport.completeOperation(requestId);
            if (response) {
              this.postMessageToClient(response);
            }
          }
        }
        break;
      case "TABLE_ROW":
        {
          // console.log(
          //   `[ServerProxy] TABLE_ROW ${body.rows.map((r) => r.rowIndex).join(",")}`,
          // );

          const viewportRowMap = groupRowsByViewport(body.rows);
          if (process.env.NODE_ENV === "development" && debugEnabled) {
            const [firstRow] = body.rows;
            if (body.rows.length === 0) {
              infoEnabled && info("handleMessageFromServer TABLE_ROW 0 rows");
            } else if (firstRow?.rowIndex === -1) {
              if (body.rows.length === 1) {
                if (firstRow.updateType === "SIZE") {
                  infoEnabled &&
                    info(
                      `handleMessageFromServer [${firstRow.viewPortId}] TABLE_ROW SIZE ONLY ${firstRow.vpSize}`,
                    );
                } else {
                  infoEnabled &&
                    info(
                      `handleMessageFromServer [${firstRow.viewPortId}] TABLE_ROW SIZE ${firstRow.vpSize} rowIdx ${firstRow.rowIndex}`,
                    );
                }
              } else {
                infoEnabled &&
                  info(
                    `handleMessageFromServer TABLE_ROW ${
                      body.rows.length
                    } rows, SIZE ${firstRow.vpSize}, [${body.rows
                      .map((r) => r.rowIndex)
                      .join(",")}]`,
                  );
              }
            } else {
              infoEnabled &&
                info(
                  `handleMessageFromServer TABLE_ROW ${body.rows.length} rows [${body.rows
                    .map((r) => r.rowIndex)
                    .join(",")}]`,
                );
            }
          }

          for (const [viewportId, rows] of Object.entries(viewportRowMap)) {
            const viewport = viewports.get(viewportId);
            if (viewport) {
              viewport.updateRows(rows);
            } else {
              warn?.(
                `TABLE_ROW message received for non registered viewport ${viewportId}`,
              );
            }
          }

          this.processUpdates();
        }
        break;

      case "CHANGE_VP_RANGE_SUCCESS":
        {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const { from, to } = body;
            infoEnabled &&
              info(`CHANGE_VP_RANGE_SUCCESS<#${requestId}> ${from} - ${to}`);
            viewport.completeOperation(requestId, from, to);
          }
        }
        break;

      case Message.OPEN_TREE_SUCCESS:
      case Message.CLOSE_TREE_SUCCESS:
        break;

      case "CREATE_VISUAL_LINK_SUCCESS":
        {
          const viewport = this.viewports.get(body.childVpId);
          const parentViewport = this.viewports.get(body.parentVpId);
          if (viewport && parentViewport) {
            const { childColumnName, parentColumnName } = body;
            const response = viewport.completeOperation(
              requestId,
              childColumnName,
              parentViewport.clientViewportId,
              parentColumnName,
            ) as DataSourceVisualLinkCreatedMessage;
            if (response) {
              this.postMessageToClient(response);
            }
          }
        }
        break;

      case "REMOVE_VISUAL_LINK_SUCCESS":
        {
          const viewport = this.viewports.get(body.childVpId);
          if (viewport) {
            const response = viewport.completeOperation(
              requestId,
            ) as DataSourceVisualLinkRemovedMessage;
            if (response) {
              this.postMessageToClient(response);
            }
          }
        }
        break;

      case "VP_VISUAL_LINKS_RESP":
        {
          const activeLinkDescriptors = this.getActiveLinks(body.links);
          const viewport = this.viewports.get(body.vpId);
          if (activeLinkDescriptors.length && viewport) {
            const linkDescriptorsWithLabels = addLabelsToLinks(
              activeLinkDescriptors,
              this.viewports,
            );
            const [clientMessage, pendingLink] = viewport.setLinks(
              linkDescriptorsWithLabels,
            );
            this.postMessageToClient(clientMessage);
            if (pendingLink) {
              const { link, parentClientVpId } = pendingLink;
              const requestId = nextRequestId();
              const parentVpId =
                this.mapClientToServerViewport.get(parentClientVpId);

              if (parentVpId) {
                const message = viewport.createLink(requestId, {
                  childVpId: body.vpId,
                  childColumnName: link.fromColumn,
                  parentColumnName: link.toColumn,
                  parentVpId,
                  type: "CREATE_VISUAL_LINK",
                });
                this.sendMessageToServer(message, requestId);
              }
            }
          }
        }
        break;

      case "VIEW_PORT_MENUS_RESP":
        if (body.menu?.name) {
          const viewport = this.viewports.get(body.vpId);
          if (viewport) {
            const clientMessage = viewport.setMenu(body.menu);
            this.postMessageToClient(clientMessage);
          }
        }
        break;

      case "VIEW_PORT_MENU_REJ": {
        const { error, rpcName, vpId } = body;
        const viewport = this.viewports.get(vpId);
        if (viewport) {
          this.postMessageToClient({
            clientViewportId: viewport.clientViewportId,
            error,
            rpcName,
            type: "VIEW_PORT_MENU_REJ",
            requestId,
          });
        }

        break;
      }

      case "VIEW_PORT_MENU_RESP":
        {
          if (isSessionTableActionMessage(body)) {
            const { action, rpcName } = body;
            this.awaitResponseToMessage({
              type: "GET_TABLE_META",
              table: action.table,
            }).then((response) => {
              const tableSchema = createSchemaFromTableMetadata(
                response as VuuTableMetaResponse,
              );

              this.postMessageToClient({
                /* MenuRpcResponse */
                rpcName,
                type: "VIEW_PORT_MENU_RESP",
                action: {
                  ...action,
                  tableSchema,
                },
                tableAlreadyOpen: this.isTableOpen(action.table),
                requestId,
              });
            });
          } else {
            const { action, rpcName } = body;
            this.postMessageToClient({
              /* MenuRpcResponse */
              action,
              rpcName,
              requestId,
              tableAlreadyOpen:
                isOpenDialogAction(action) && this.isTableOpen(action.table),
              type: "VIEW_PORT_MENU_RESP",
            });
          }
        }
        break;

      case "RPC_RESPONSE":
        {
          const { action, error, result } = body;
          // check to see if the orderEntry is already open on the page
          this.postMessageToClient({
            action,
            type: "RPC_RESPONSE",
            error,
            result,
            requestId,
          });
        }
        break;

      case "ERROR":
        error(body.msg);
        break;

      default:
        infoEnabled && info(`handleMessageFromServer ${body["type"]}.`);
    }
  }

  private cacheTableMeta(messageBody: VuuTableMetaResponse): TableSchema {
    const { module, table } = messageBody.table;
    const key = `${module}:${table}`;
    let tableSchema = this.cachedTableSchemas.get(key);
    if (!tableSchema) {
      tableSchema = createSchemaFromTableMetadata(messageBody);
      this.cachedTableSchemas.set(key, tableSchema);
    }
    return tableSchema;
  }

  isTableOpen(table?: VuuTable) {
    if (table) {
      const tableName = table.table;
      for (const viewport of this.viewports.values()) {
        if (!viewport.suspended && viewport.table.table === tableName) {
          return true;
        }
      }
    }
  }

  // Eliminate links to suspended viewports
  getActiveLinks(linkDescriptors: VuuLinkDescriptor[]) {
    return linkDescriptors.filter((linkDescriptor) => {
      const viewport = this.viewports.get(linkDescriptor.parentVpId);
      return viewport && !viewport.suspended;
    });
  }

  processUpdates() {
    this.viewports.forEach((viewport) => {
      if (viewport.hasUpdatesToProcess) {
        const result = viewport.getClientRows();
        if (result !== NO_DATA_UPDATE) {
          const [rows, mode] = result;
          // what if the rows we're about to send do not fill the entire range

          const size = viewport.getNewRowCount();
          if (size !== undefined || (rows && rows.length > 0)) {
            debugEnabled &&
              debug(
                `postMessageToClient #${
                  viewport.clientViewportId
                } viewport-update ${mode}, ${
                  rows?.length ?? "no"
                } rows, size ${size}`,
              );

            if (mode) {
              // console.log(
              //   `%c[ServerProxy] processUpdates  rows to client ${rows?.map((r) => r[0]).join(",")}`,
              //   "color:brown",
              // );

              this.postMessageToClient({
                clientViewportId: viewport.clientViewportId,
                mode,
                rows,
                size,
                type: "viewport-update",
              });
            }
          }
        }
      }
    });
  }
}
