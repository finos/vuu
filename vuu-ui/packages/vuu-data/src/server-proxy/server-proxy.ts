import * as Message from "./messages";
import { Viewport } from "./viewport";
import { getRpcServiceModule as getRpcServiceModule } from "./rpc-services";
import { Connection } from "../connectionTypes";
import {
  ServerToClientMessage,
  ClientToServerMessage,
  VuuColumnDataType,
  VuuLinkDescriptor,
  VuuTable,
  VuuRpcRequest,
  LinkDescriptorWithLabel,
  ClientToServerMenuRPC,
  VuuRow,
} from "@finos/vuu-protocol-types";
import {
  isViewporttMessage as isViewportMessage,
  ServerProxySubscribeMessage,
  VuuUIMessageIn,
  VuuUIMessageInTableList,
  VuuUIMessageInTableMeta,
  VuuUIMessageOut,
  VuuUIMessageOutAggregate,
  VuuUIMessageOutConnect,
  VuuUIMessageOutCreateLink,
  VuuUIMessageOutFilter,
  VuuUIMessageOutGroupby,
  VuuUIMessageOutOpenTreeNode,
  VuuUIMessageOutCloseTreeNode,
  VuuUIMessageOutSelect,
  VuuUIMessageOutSort,
  VuuUIMessageOutSubscribe,
  VuuUIMessageOutUnsubscribe,
  VuuUIMessageOutViewRange,
  VuuUIMessageOutColumns,
  VuuUIMessageOutSetTitle,
} from "../vuuUIMessageTypes";
import {
  DataSourceCallbackMessage,
  DataSourceEnabledMessage,
  DataSourceVisualLinkCreatedMessage,
  DataSourceVisualLinkRemovedMessage,
} from "../data-source";
import {
  isVuuMenuRpcRequest,
  stripRequestId,
  WithRequestId,
} from "../message-utils";
import { logger, partition } from "@finos/vuu-utils";

export type PostMessageToClientCallback = (
  message: VuuUIMessageIn | DataSourceCallbackMessage
) => void;

export type MessageOptions = {
  module?: string;
};

let _requestId = 1;
export const TEST_setRequestId = (id: number) => (_requestId = id);

const nextRequestId = () => `${_requestId++}`;
const DEFAULT_OPTIONS: MessageOptions = {};

const isActiveViewport = (viewPort: Viewport) =>
  viewPort.disabled !== true && viewPort.suspended !== true;

const addTitleToLinks = (
  links: LinkDescriptorWithLabel[],
  serverViewportId: string,
  label: string
) =>
  links.map((link) =>
    link.parentVpId === serverViewportId ? { ...link, label } : link
  );

function addLabelsToLinks(
  links: VuuLinkDescriptor[],
  viewports: Map<string, Viewport>
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

const byViewportRowIdxTimestamp = (row1: VuuRow, row2: VuuRow) => {
  if (row1.viewPortId === row2.viewPortId) {
    if (row1.rowIndex === row2.rowIndex) {
      return row1.ts > row2.ts ? 1 : -1;
    } else {
      return row1.rowIndex > row2.rowIndex ? 1 : -1;
    }
  } else {
    return row1.viewPortId > row2.viewPortId ? 1 : -1;
  }
};

interface PendingLogin {
  resolve: (value: string) => void; // TODO
  reject: () => void;
}
export class ServerProxy {
  private connection: Connection;
  private postMessageToClient: PostMessageToClientCallback;
  private viewports: Map<string, Viewport>;
  private mapClientToServerViewport: Map<string, string>;
  private authToken = "";
  private pendingLogin?: PendingLogin;
  private pendingTableMetaRequests = new Map<string, string>();
  private sessionId?: string;
  private queuedRequests: Array<ClientToServerMessage["body"]> = [];
  private cachedTableMeta: Map<
    string,
    { columns: string[]; serverDataTypes: VuuColumnDataType[] }
  > = new Map();

  constructor(connection: Connection, callback: PostMessageToClientCallback) {
    this.connection = connection;
    this.postMessageToClient = callback;
    this.viewports = new Map<string, Viewport>();
    this.mapClientToServerViewport = new Map();
  }

  public async reconnect() {
    await this.login(this.authToken);

    // The 'active' viewports are those the user has on their open layout
    // Reconnect these first.
    const [activeViewports, inactiveViewports] = partition(
      Array.from(this.viewports.values()),
      isActiveViewport
    );

    this.viewports.clear();
    this.mapClientToServerViewport.clear();

    const reconnectViewports = (viewports: Viewport[]) => {
      viewports.forEach((viewport) => {
        const { clientViewportId } = viewport;
        this.viewports.set(clientViewportId, viewport);
        this.sendMessageToServer(viewport.subscribe(), clientViewportId);
      });
    };

    reconnectViewports(activeViewports);

    setTimeout(() => {
      reconnectViewports(inactiveViewports);
    }, 2000);
  }

  public async login(authToken?: string): Promise<string | void> {
    if (authToken) {
      this.authToken = authToken;
      return new Promise((resolve, reject) => {
        this.sendMessageToServer(
          { type: Message.LOGIN, token: this.authToken, user: "user" },
          ""
        );
        this.pendingLogin = { resolve, reject };
      });
    } else if (this.authToken === "") {
      console.warn(
        "ServerProxy login, cannot login until auth token has been obtained"
      );
    }
  }

  public subscribe(message: ServerProxySubscribeMessage) {
    // guard against subscribe message when a viewport is already subscribed
    if (!this.mapClientToServerViewport.has(message.viewport)) {
      if (!this.hasMetaDataFor(message.table)) {
        logger.info("Get Meta Data Message (Client to Server): ", message);
        const requestId = nextRequestId();
        this.sendMessageToServer(
          { type: "GET_TABLE_META", table: message.table },
          requestId
        );
        this.pendingTableMetaRequests.set(requestId, message.viewport);
      }
      const viewport = new Viewport(message);
      this.viewports.set(message.viewport, viewport);
      // use client side viewport id as request id, so that when we process the response,
      // which will provide the serverside viewport id, we can establish a mapping between
      // the two
      this.sendIfReady(
        viewport.subscribe(),
        message.viewport,
        this.sessionId !== ""
      );
    } else {
      logger.error(`ServerProxy spurious subscribe call ${message.viewport}`);
    }
  }

  public unsubscribe(clientViewportId: string) {
    const serverViewportId =
      this.mapClientToServerViewport.get(clientViewportId);
    if (serverViewportId) {
      logger.log(
        "Viewport Unsubscribe Message (Client to Server): ",
        serverViewportId
      );
      this.sendMessageToServer({
        type: Message.REMOVE_VP,
        viewPortId: serverViewportId,
      });
    } else {
      console.error(
        `ServerProxy: failed to unsubscribe client viewport ${clientViewportId}, viewport not found`
      );
    }
  }

  private getViewportForClient(clientViewportId: string): Viewport;
  private getViewportForClient(
    clientViewportId: string,
    throws: false
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
          `Viewport not found for client viewport ${clientViewportId}`
        );
      } else {
        return null;
      }
    } else if (this.viewports.has(clientViewportId)) {
      // Still stored under client viewportId means it is waiting for CREATE_VP to be acked
      return this.viewports.get(clientViewportId);
    } else if (throws) {
      throw Error(
        `Viewport server id not found for client viewport ${clientViewportId}`
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
    const [serverRequest, rows, debounceRequest] = viewport.rangeRequest(
      requestId,
      message.range
    );

    if (serverRequest) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `%c[ServerProxy] CHANGE_VP_RANGE [${message.range.from}-${message.range.to}] => [${serverRequest.from}-${serverRequest.to}]`,
          "color: red; font-weight: bold"
        );
      }
      this.sendIfReady(
        serverRequest,
        requestId,
        viewport.status === "subscribed"
      );
    }
    if (rows) {
      this.postMessageToClient({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: viewport.clientViewportId,
        rows,
      });
    } else if (debounceRequest) {
      this.postMessageToClient(debounceRequest);
    }
  }

  private aggregate(viewport: Viewport, message: VuuUIMessageOutAggregate) {
    const requestId = nextRequestId();
    const request = viewport.aggregateRequest(requestId, message.aggregations);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  private sort(viewport: Viewport, message: VuuUIMessageOutSort) {
    const requestId = nextRequestId();
    const request = viewport.sortRequest(requestId, message.sort);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  private groupBy(viewport: Viewport, message: VuuUIMessageOutGroupby) {
    const requestId = nextRequestId();
    const request = viewport.groupByRequest(requestId, message.groupBy);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  private filter(viewport: Viewport, message: VuuUIMessageOutFilter) {
    const requestId = nextRequestId();
    const { filter } = message;
    const request = viewport.filterRequest(requestId, filter);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  private setColumns(viewport: Viewport, message: VuuUIMessageOutColumns) {
    const requestId = nextRequestId();
    const { columns } = message;
    const request = viewport.columnRequest(requestId, columns);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  private setTitle(viewport: Viewport, message: VuuUIMessageOutSetTitle) {
    if (viewport) {
      viewport.title = message.title;
      this.updateTitleOnVisualLinks(viewport);
    }
  }

  private select(viewport: Viewport, message: VuuUIMessageOutSelect) {
    const requestId = nextRequestId();
    const { selected } = message;
    const request = viewport.selectRequest(requestId, selected);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  //TODO when do we ever check the disabled state ?
  private disableViewport(viewport: Viewport) {
    const requestId = nextRequestId();
    const request = viewport.disable(requestId);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  private enableViewport(viewport: Viewport) {
    const requestId = nextRequestId();
    const request = viewport.enable(requestId);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  private resumeViewport(viewport: Viewport) {
    const rows = viewport.resume();
    this.postMessageToClient({
      clientViewportId: viewport.clientViewportId,
      rows,
      type: "viewport-update",
    });
  }

  private openTreeNode(
    viewport: Viewport,
    message: VuuUIMessageOutOpenTreeNode
  ) {
    if (viewport.serverViewportId) {
      const requestId = nextRequestId();
      this.sendIfReady(
        viewport.openTreeNode(requestId, message),
        requestId,
        viewport.status === "subscribed"
      );
    }
  }

  private closeTreeNode(
    viewport: Viewport,
    message: VuuUIMessageOutCloseTreeNode
  ) {
    if (viewport.serverViewportId) {
      const requestId = nextRequestId();
      this.sendIfReady(
        viewport.closeTreeNode(requestId, message),
        requestId,
        viewport.status === "subscribed"
      );
    }
  }

  private createLink(viewport: Viewport, message: VuuUIMessageOutCreateLink) {
    const { parentClientVpId, parentColumnName, childColumnName } = message;
    const requestId = nextRequestId();
    const parentVpId = this.mapClientToServerViewport.get(parentClientVpId);
    if (parentVpId) {
      const request = viewport.createLink(
        requestId,
        childColumnName,
        parentVpId,
        parentColumnName
      );
      this.sendMessageToServer(request, requestId);
    } else {
      console.warn("ServerProxy unable to create link, viewport not found");
    }
  }

  private removeLink(viewport: Viewport) {
    const requestId = nextRequestId();
    const request = viewport.removeLink(requestId);
    this.sendMessageToServer(request, requestId);
  }

  private updateTitleOnVisualLinks(viewport: Viewport) {
    const { serverViewportId, title } = viewport;
    for (const vp of this.viewports.values()) {
      if (vp !== viewport && vp.links && serverViewportId && title) {
        if (vp.links?.some((link) => link.parentVpId === serverViewportId)) {
          const [messageToClient] = vp.setLinks(
            addTitleToLinks(vp.links, serverViewportId, title)
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
          vp.links.filter(({ parentVpId }) => parentVpId !== serverViewportId)
        );
        this.postMessageToClient(messageToClient);
      }
    }
  }

  private menuRpcCall(message: WithRequestId<ClientToServerMenuRPC>) {
    const viewport = this.getViewportForClient(message.vpId, false);
    if (viewport?.serverViewportId) {
      const [requestId, rpcRequest] =
        stripRequestId<ClientToServerMenuRPC>(message);
      this.sendMessageToServer(
        {
          ...rpcRequest,
          vpId: viewport.serverViewportId,
        },
        requestId
      );
    }
  }

  private rpcCall(message: WithRequestId<VuuRpcRequest>) {
    const [requestId, rpcRequest] = stripRequestId<VuuRpcRequest>(message);
    const module = getRpcServiceModule(rpcRequest.service);
    this.sendMessageToServer(rpcRequest, requestId, { module });
  }

  public handleMessageFromClient(
    message:
      | Exclude<
          VuuUIMessageOut,
          | VuuUIMessageOutConnect
          | VuuUIMessageOutSubscribe
          | VuuUIMessageOutUnsubscribe
        >
      | WithRequestId<VuuRpcRequest>
      | WithRequestId<ClientToServerMenuRPC>
  ) {
    if (isViewportMessage(message)) {
      if (message.type === "disable") {
        // Viewport may already have been unsubscribed
        const viewport = this.getViewportForClient(message.viewport, false);
        if (viewport !== null) {
          logger.log("Disable Message From Client: ", message);
          return this.disableViewport(viewport);
        } else {
          return;
        }
      } else {
        const viewport = this.getViewportForClient(message.viewport);
        logger.log(`${message.type} Message From Client: `, message);
        switch (message.type) {
          case "setViewRange":
            return this.setViewRange(viewport, message);
          case "aggregate":
            return this.aggregate(viewport, message);
          case "sort":
            return this.sort(viewport, message);
          case "groupBy":
            return this.groupBy(viewport, message);
          case "filter":
            return this.filter(viewport, message);
          case "select":
            return this.select(viewport, message);
          case "suspend":
            return viewport.suspend();
          case "resume":
            return this.resumeViewport(viewport);
          case "enable":
            return this.enableViewport(viewport);
          case "openTreeNode":
            return this.openTreeNode(viewport, message);
          case "closeTreeNode":
            return this.closeTreeNode(viewport, message);
          case "createLink":
            return this.createLink(viewport, message);
          case "removeLink":
            return this.removeLink(viewport);
          case "setColumns":
            return this.setColumns(viewport, message);
          case "setTitle":
            return this.setTitle(viewport, message);
          default:
        }
      }
    } else if (isVuuMenuRpcRequest(message)) {
      return this.menuRpcCall(message);
    } else {
      const { type, requestId } = message;
      switch (type) {
        case "GET_TABLE_LIST":
          logger.log("Get Table List Message (Client to Server)", message);
          return this.sendMessageToServer({ type }, requestId);
        case "GET_TABLE_META":
          return this.sendMessageToServer(
            { type, table: message.table },
            requestId
          );
        case "RPC_CALL":
          return this.rpcCall(message);
        default:
      }
    }
    logger.error(
      `Vuu ServerProxy Unexpected message from client ${JSON.stringify(
        message
      )}`
    );
  }

  public sendIfReady(
    message: ClientToServerMessage["body"],
    requestId: string,
    isReady = true
  ) {
    // TODO implement the message queuing in remote data view
    if (isReady) {
      this.sendMessageToServer(message, requestId);
    } else {
      // TODO need to make sure we keep the requestId
      this.queuedRequests.push(message);
    }
    return isReady;
  }

  public sendMessageToServer(
    body: ClientToServerMessage["body"],
    requestId = `${_requestId++}`,
    options: MessageOptions = DEFAULT_OPTIONS
  ) {
    const { module = "CORE" } = options;
    if (this.authToken) {
      this.connection.send({
        requestId,
        sessionId: this.sessionId,
        token: this.authToken,
        user: "user",
        module,
        body,
      } as ClientToServerMessage);
    }
  }

  public handleMessageFromServer(message: ServerToClientMessage) {
    const { body, requestId, sessionId } = message;

    // onsole.log(`%c<<< [${new Date().toISOString().slice(11,23)}]  (ServerProxy) ${message.type || JSON.stringify(message)}`,'color:white;background-color:blue;font-weight:bold;');

    const { viewports } = this;
    switch (body.type) {
      case Message.HB:
        this.sendMessageToServer(
          { type: Message.HB_RESP, ts: +new Date() },
          "NA"
        );
        break;

      case Message.LOGIN_SUCCESS:
        if (sessionId) {
          this.sessionId = sessionId;
          // we should tear down the pending Login now
          this.pendingLogin?.resolve(sessionId);
          this.pendingLogin = undefined;
        } else {
          throw Error("LOGIN_SUCCESS did not provide sessionId");
        }
        break;
      // TODO login rejected

      case Message.CREATE_VP_SUCCESS:
        {
          const viewport = viewports.get(requestId);
          // The clientViewportId was used as requestId for CREATE_VP message. From this point,
          // we will key viewports using serverViewPortId and maintain a mapping between client
          // and server viewport ids.
          if (viewport) {
            const { status: viewportStatus } = viewport;
            const { viewPortId: serverViewportId } = body;

            if (requestId !== serverViewportId) {
              viewports.delete(requestId);
              viewports.set(serverViewportId, viewport);
            }
            this.mapClientToServerViewport.set(requestId, serverViewportId);
            const response = viewport.handleSubscribed(body);
            if (response) {
              logger.info(
                "Subscribe Response (ServerProxy to Client): ",
                response
              );
              this.postMessageToClient(response);
            }
            // In the case of a reconnect, we may have resubscribed a disabled viewport,
            // reset the disabled state on server
            if (viewport.disabled) {
              this.disableViewport(viewport);
            }
            if (viewportStatus === "subscribing") {
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
              Array.from(viewports.entries())
                .filter(
                  ([id, { disabled }]) => id !== serverViewportId && !disabled
                )
                .forEach(([vpId]) => {
                  this.sendMessageToServer({
                    type: Message.GET_VP_VISUAL_LINKS,
                    vpId,
                  });
                });
            }
          }
        }
        break;

      case "REMOVE_VP_SUCCESS":
        {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            this.mapClientToServerViewport.delete(viewport.clientViewportId);
            viewports.delete(body.viewPortId);
            this.removeViewportFromVisualLinks(body.viewPortId);
          }
        }
        break;

      case Message.SET_SELECTION_SUCCESS:
        {
          const viewport = this.viewports.get(body.vpId);
          if (viewport) {
            viewport.completeOperation(requestId);
          }
        }
        break;

      case Message.CHANGE_VP_SUCCESS:
      case Message.DISABLE_VP_SUCCESS:
        if (viewports.has(body.viewPortId)) {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const response = viewport.completeOperation(requestId);
            if (response !== undefined) {
              logger.info(
                "Disable Response (ServerProxy to Client): ",
                response
              );
              this.postMessageToClient(response);
            }
          }
        }

        break;

      case Message.ENABLE_VP_SUCCESS:
        {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const response = viewport.completeOperation(requestId);
            if (response) {
              this.postMessageToClient(response as DataSourceEnabledMessage);
              const rows = viewport.currentData();
              logger.info(
                "Enable Response (ServerProxy to Client): ",
                response
              );
              this.postMessageToClient({
                clientViewportId: viewport.clientViewportId,
                mode: "batch",
                rows,
                size: viewport.size,
                type: "viewport-update",
              });
            }
          }
        }
        break;
      case Message.TABLE_ROW:
        {
          console.time("TABLE_ROWS");
          if (process.env.NODE_ENV === "development") {
            console.log(
              `\t${body.rows.length} rows [${body.rows[0]?.rowIndex}] - [${
                body.rows[body.rows.length - 1]?.rowIndex
              }]`
            );
          }

          body.rows.sort(byViewportRowIdxTimestamp);
          let currentViewportId = "";
          let viewport: Viewport | undefined;
          let startIdx = 0;

          for (
            let i = 0, count = body.rows.length, isLast = i === count - 1;
            i < count;
            i++, isLast = i === count - 1
          ) {
            const row = body.rows[i];
            if (row.viewPortId !== currentViewportId || isLast) {
              const viewportId =
                count === 1 ? row.viewPortId : currentViewportId;
              if (viewportId !== "") {
                if (startIdx === 0 && isLast) {
                  viewport = viewports.get(viewportId);
                  if (viewport) {
                    viewport.updateRows(body.rows);
                  } else {
                    console.warn(
                      `TABLE_ROW message received for non registered viewport ${viewportId}`
                    );
                  }
                } else {
                  startIdx = i;
                }
              }
              currentViewportId = row.viewPortId;
            }
          }

          this.processUpdates();
          console.timeEnd("TABLE_ROWS");
        }
        break;

      case Message.CHANGE_VP_RANGE_SUCCESS:
        {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const { from, to } = body;
            if (process.env.NODE_ENV === "development") {
              console.log(
                `[ServerProxy] CHANGE_VP_RANGE_SUCCESS ${from} - ${to}`
              );
            }
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
              parentColumnName
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
              requestId
            ) as DataSourceVisualLinkRemovedMessage;
            if (response) {
              this.postMessageToClient(response);
            }
          }
        }
        break;

      case Message.TABLE_LIST_RESP:
        this.postMessageToClient({
          type: Message.TABLE_LIST_RESP,
          tables: body.tables,
          requestId,
        } as VuuUIMessageInTableList);
        break;

      case Message.TABLE_META_RESP:
        // This request may have originated from client or may have been made by
        // ServerProxy whilst creating a new subscription
        {
          this.cacheTableMeta(body.table, body.columns, body.dataTypes);
          const clientViewportId = this.pendingTableMetaRequests.get(requestId);
          if (clientViewportId) {
            this.pendingTableMetaRequests.delete(requestId);
            // If the viewport is still stored under clientViewportId, the subscription has not
            // yet been acknowledged and client not informed. If the subscription has already
            // been acknowledged, the viewport will be stored under serverViewportId;
            const viewport = this.viewports.get(clientViewportId);
            if (viewport) {
              viewport.setTableMeta(body.columns, body.dataTypes);
            } else {
              logger.warn(
                "Message has come back AFTER CREATE_VP_SUCCESS, what do we do now"
              );
            }
          } else {
            this.postMessageToClient({
              type: Message.TABLE_META_RESP,
              table: body.table,
              columns: body.columns,
              dataTypes: body.dataTypes,
              requestId,
            } as VuuUIMessageInTableMeta);
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
              this.viewports
            );
            const [clientMessage, pendingLink] = viewport.setLinks(
              linkDescriptorsWithLabels
            );
            this.postMessageToClient(clientMessage);
            if (pendingLink) {
              const { link, parentClientVpId } = pendingLink;
              const requestId = nextRequestId();
              const serverViewportId =
                this.mapClientToServerViewport.get(parentClientVpId);

              if (serverViewportId) {
                const message = viewport.createLink(
                  requestId,
                  link.fromColumn,
                  serverViewportId,
                  link.toColumn
                );
                this.sendMessageToServer(message, requestId);
              }
            }
          }
        }
        break;

      case "VIEW_PORT_MENUS_RESP":
        if (body.menu.name) {
          const viewport = this.viewports.get(body.vpId);
          if (viewport) {
            const clientMessage = viewport.setMenu(body.menu);
            this.postMessageToClient(clientMessage);
          }
        }
        break;

      case "VIEW_PORT_MENU_RESP":
        {
          const { action } = body;
          this.postMessageToClient({
            type: "VIEW_PORT_MENU_RESP",
            action,
            tableAlreadyOpen: this.isTableOpen(action.table),
            requestId,
          });
        }
        break;

      case Message.RPC_RESP:
        {
          const { method, result } = body;
          // check to see if the orderEntry is already open on the page
          this.postMessageToClient({
            type: Message.RPC_RESP,
            method,
            result,
            requestId,
          });
        }
        break;

      case "ERROR":
        logger.error(body.msg);
        break;

      default:
        logger.log(`handleMessageFromServer ${body["type"]}.`);
    }
  }

  private hasMetaDataFor(table: VuuTable) {
    return this.cachedTableMeta.has(`${table.module}:${table.table}`);
  }

  private cacheTableMeta(
    table: VuuTable,
    columns: string[],
    serverDataTypes: VuuColumnDataType[]
  ) {
    if (!this.hasMetaDataFor(table)) {
      this.cachedTableMeta.set(`${table.module}:${table.table}`, {
        columns,
        serverDataTypes,
      });
    }
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
        const [rows, mode] = viewport.getClientRows();
        const size = viewport.getNewRowCount();
        if (size !== undefined || (rows && rows.length > 0)) {
          if (process.env.NODE_ENV === "development") {
            console.log(`send message to client ${mode}`);
          }
          this.postMessageToClient({
            clientViewportId: viewport.clientViewportId,
            mode,
            rows,
            size,
            type: "viewport-update",
          });
        }
      }
    });
  }
}
