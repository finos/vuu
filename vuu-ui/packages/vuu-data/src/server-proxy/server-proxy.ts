import {
  ClientToServerBody,
  ClientToServerMenuRPC,
  ClientToServerMessage,
  LinkDescriptorWithLabel,
  ServerToClientCreateViewPortSuccess,
  ServerToClientMessage,
  ServerToClientTableList,
  ServerToClientTableMeta,
  VuuLinkDescriptor,
  VuuRpcRequest,
  VuuTable,
} from "@finos/vuu-protocol-types";
import { logger, partition } from "@finos/vuu-utils";
import { Connection } from "../connectionTypes";
import {
  DataSourceCallbackMessage,
  DataSourceEnabledMessage,
  DataSourceVisualLinkCreatedMessage,
  DataSourceVisualLinkRemovedMessage,
} from "../data-source";
import {
  createSchemaFromTableMetadata,
  groupRowsByViewport,
  isVuuMenuRpcRequest,
  stripRequestId,
  TableSchema,
  WithRequestId,
} from "../message-utils";
import {
  isSessionTable,
  isSessionTableActionMessage,
  isViewporttMessage as isViewportMessage,
  NoAction,
  OpenDialogAction,
  ServerProxySubscribeMessage,
  VuuUIMessageIn,
  VuuUIMessageOut,
  VuuUIMessageOutAggregate,
  VuuUIMessageOutCloseTreeNode,
  VuuUIMessageOutColumns,
  VuuUIMessageOutConfig,
  VuuUIMessageOutConnect,
  VuuUIMessageOutCreateLink,
  VuuUIMessageOutFilter,
  VuuUIMessageOutGroupby,
  VuuUIMessageOutOpenTreeNode,
  VuuUIMessageOutSelect,
  VuuUIMessageOutSetTitle,
  VuuUIMessageOutSort,
  VuuUIMessageOutSubscribe,
  VuuUIMessageOutUnsubscribe,
  VuuUIMessageOutViewRange,
} from "../vuuUIMessageTypes";
import * as Message from "./messages";
import { getRpcServiceModule } from "./rpc-services";
import { NO_DATA_UPDATE, Viewport } from "./viewport";

export type PostMessageToClientCallback = (
  message: VuuUIMessageIn | DataSourceCallbackMessage
) => void;

export type MessageOptions = {
  module?: string;
};

let _requestId = 1;
export const TEST_setRequestId = (id: number) => (_requestId = id);

const { debug, debugEnabled, error, info, infoEnabled, warn } =
  logger("server-proxy");

const nextRequestId = () => `${_requestId++}`;
const DEFAULT_OPTIONS: MessageOptions = {};

const isActiveViewport = (viewPort: Viewport) =>
  viewPort.disabled !== true && viewPort.suspended !== true;

const NO_ACTION: NoAction = {
  type: "NO_ACTION",
};

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

type PendingRequest<T = unknown> = {
  reject: (err: unknown) => void;
  resolve: (value: T | PromiseLike<T>) => void;
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
  private user = "user";
  private pendingLogin?: PendingLogin;
  private pendingRequests = new Map<string, PendingRequest>();
  private sessionId?: string;
  private queuedRequests: Array<ClientToServerMessage["body"]> = [];
  private cachedTableMetaRequests: Map<
    string,
    Promise<ServerToClientTableMeta>
  > = new Map();
  private cachedTableSchemas: Map<string, TableSchema> = new Map();
  private tableList: Promise<ServerToClientTableList> | undefined;

  constructor(connection: Connection, callback: PostMessageToClientCallback) {
    this.connection = connection;
    this.postMessageToClient = callback;
    this.viewports = new Map<string, Viewport>();
    this.mapClientToServerViewport = new Map();
  }

  public async reconnect() {
    await this.login(this.authToken);

    // The "active" viewports are those the user has on their open layout
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

  public async login(
    authToken?: string,
    user = "user"
  ): Promise<string | void> {
    if (authToken) {
      this.authToken = authToken;
      this.user = user;
      return new Promise((resolve, reject) => {
        this.sendMessageToServer(
          { type: Message.LOGIN, token: this.authToken, user },
          ""
        );
        this.pendingLogin = { resolve, reject };
      });
    } else if (this.authToken === "") {
      error("login, cannot login until auth token has been obtained");
    }
  }

  public subscribe(message: ServerProxySubscribeMessage) {
    // guard against subscribe message when a viewport is already subscribed
    if (!this.mapClientToServerViewport.has(message.viewport)) {
      const pendingTableSchema = this.getTableMeta(message.table);
      // if (
      const viewport = new Viewport(message, this.postMessageToClient);
      this.viewports.set(message.viewport, viewport);
      // Use client side viewport id as request id, so that when we process the response,
      // which will provide the serverside viewport id, we can establish a mapping between
      // the two
      //TODO handle CREATE_VP error, but server does not send it at the moment
      const pendingSubscription = this.awaitResponseToMessage(
        viewport.subscribe(),
        message.viewport
      );
      const awaitPendingReponses = Promise.all([
        pendingSubscription,
        pendingTableSchema,
      ]) as Promise<
        [ServerToClientCreateViewPortSuccess, TableSchema | undefined]
      >;
      awaitPendingReponses.then(([subscribeResponse, tableSchema]) => {
        const { viewPortId: serverViewportId } = subscribeResponse;
        const { status: viewportStatus } = viewport;

        // switch storage key from client viewportId to server viewportId
        if (message.viewport !== serverViewportId) {
          this.viewports.delete(message.viewport);
          this.viewports.set(serverViewportId, viewport);
        }
        this.mapClientToServerViewport.set(message.viewport, serverViewportId);

        const clientResponse = viewport.handleSubscribed(
          subscribeResponse,
          tableSchema
        );
        if (clientResponse) {
          this.postMessageToClient(clientResponse);
          if (debugEnabled) {
            debug(
              `post DataSourceSubscribedMessage to client: ${JSON.stringify(
                clientResponse
              )}`
            );
          }
        }

        // In the case of a reconnect, we may have resubscribed a disabled viewport,
        // reset the disabled state on server
        if (viewport.disabled) {
          this.disableViewport(viewport);
        }

        if (
          viewportStatus === "subscribing" &&
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
              ([id, { disabled }]) => id !== serverViewportId && !disabled
            )
            .forEach(([vpId]) => {
              this.sendMessageToServer({
                type: Message.GET_VP_VISUAL_LINKS,
                vpId,
              });
            });
        }
      });
    } else {
      error(`spurious subscribe call ${message.viewport}`);
    }
  }

  public unsubscribe(clientViewportId: string) {
    const serverViewportId =
      this.mapClientToServerViewport.get(clientViewportId);
    if (serverViewportId) {
      info?.(
        `Unsubscribe Message (Client to Server):
        ${serverViewportId}`
      );
      this.sendMessageToServer({
        type: Message.REMOVE_VP,
        viewPortId: serverViewportId,
      });
    } else {
      error(
        `failed to unsubscribe client viewport ${clientViewportId}, viewport not found`
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

    info?.(`setViewRange ${message.range.from} - ${message.range.to}`);

    if (serverRequest) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (process.env.NODE_ENV === "development") {
        info?.(
          `CHANGE_VP_RANGE [${message.range.from}-${message.range.to}] => [${serverRequest.from}-${serverRequest.to}]`
        );
      }
      this.sendIfReady(
        serverRequest,
        requestId,
        viewport.status === "subscribed"
      );
    }
    if (rows) {
      info?.(`setViewRange ${rows.length} rows returned from cache`);
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

  private setConfig(viewport: Viewport, message: VuuUIMessageOutConfig) {
    const requestId = nextRequestId();
    const request = viewport.setConfig(requestId, message.config);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
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

  private suspendViewport(viewport: Viewport) {
    viewport.suspend();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore its a number, this isn't node.js
    viewport.suspendTimer = setTimeout(() => {
      info?.("suspendTimer expired, escalate suspend to disable");
      this.disableViewport(viewport);
    }, 3000);
  }
  private resumeViewport(viewport: Viewport) {
    if (viewport.suspendTimer) {
      debug?.("clear suspend timer");
      clearTimeout(viewport.suspendTimer);
      viewport.suspendTimer = null;
    }
    const rows = viewport.resume();
    this.postMessageToClient({
      clientViewportId: viewport.clientViewportId,
      mode: "batch",
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
      error("ServerProxy unable to create link, viewport not found");
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
          return this.disableViewport(viewport);
        } else {
          return;
        }
      } else {
        const viewport = this.getViewportForClient(message.viewport);
        switch (message.type) {
          case "setViewRange":
            return this.setViewRange(viewport, message);
          case "config":
            return this.setConfig(viewport, message);
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
            return this.suspendViewport(viewport);
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
        case "GET_TABLE_LIST": {
          this.tableList ??= this.awaitResponseToMessage(
            { type },
            requestId
          ) as Promise<ServerToClientTableList>;
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
        case "RPC_CALL":
          return this.rpcCall(message);
        default:
      }
    }
    error(
      `Vuu ServerProxy Unexpected message from client ${JSON.stringify(
        message
      )}`
    );
  }

  private getTableMeta(table: VuuTable, requestId = nextRequestId()) {
    if (isSessionTable(table)) {
      return Promise.resolve(undefined);
    }
    const key = `${table.module}:${table.table}`;
    let tableMetaRequest = this.cachedTableMetaRequests.get(key);
    if (!tableMetaRequest) {
      tableMetaRequest = this.awaitResponseToMessage(
        { type: "GET_TABLE_META", table },
        requestId
      ) as Promise<ServerToClientTableMeta>;
      this.cachedTableMetaRequests.set(key, tableMetaRequest);
    }
    return tableMetaRequest?.then((response) => this.cacheTableMeta(response));
  }

  private awaitResponseToMessage(
    message: ClientToServerBody,
    requestId = nextRequestId()
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.sendMessageToServer(message, requestId);
      this.pendingRequests.set(requestId, { reject, resolve });
    });
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
        user: this.user,
        module,
        body,
      } as ClientToServerMessage);
    }
  }

  public handleMessageFromServer(message: ServerToClientMessage) {
    const { body, requestId, sessionId } = message;

    // onsole.log(`%c<<< [${new Date().toISOString().slice(11,23)}]  (ServerProxy) ${message.type || JSON.stringify(message)}`,"color:white;background-color:blue;font-weight:bold;");

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
          "NA"
        );
        break;

      case "LOGIN_SUCCESS":
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

      case "REMOVE_VP_SUCCESS":
        {
          const viewport = viewports.get(body.viewPortId);
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
              this.postMessageToClient(response as DataSourceEnabledMessage);
              const rows = viewport.currentData();
              debugEnabled &&
                debug(
                  `Enable Response (ServerProxy to Client):  ${JSON.stringify(
                    response
                  )}`
                );

              if (viewport.size === 0) {
                debugEnabled &&
                  debug(`Viewport Enabled but size 0, resend  to server`);
              } else {
                this.postMessageToClient({
                  clientViewportId: viewport.clientViewportId,
                  mode: "batch",
                  rows,
                  size: viewport.size,
                  type: "viewport-update",
                });
                debugEnabled &&
                  debug(
                    `Enable Response (ServerProxy to Client): send size ${viewport.size} ${rows.length} rows from cache`
                  );
              }
            }
          }
        }
        break;
      case Message.TABLE_ROW:
        {
          const viewportRowMap = groupRowsByViewport(body.rows);

          if (process.env.NODE_ENV === "development" && debugEnabled) {
            const [firstRow, secondRow] = body.rows;
            if (body.rows.length === 0) {
              debug("handleMessageFromServer TABLE_ROW 0 rows");
            } else if (firstRow?.rowIndex === -1) {
              if (body.rows.length === 1) {
                if (firstRow.updateType === "SIZE") {
                  debug(
                    `handleMessageFromServer [${firstRow.viewPortId}] TABLE_ROW SIZE ONLY ${firstRow.vpSize}`
                  );
                } else {
                  debug(
                    `handleMessageFromServer [${firstRow.viewPortId}] TABLE_ROW SIZE ${firstRow.vpSize} rowIdx ${firstRow.rowIndex}`
                  );
                }
              } else {
                debug(
                  `handleMessageFromServer TABLE_ROW ${
                    body.rows.length
                  } rows, SIZE ${firstRow.vpSize}, [${
                    secondRow?.rowIndex
                  }] - [${body.rows[body.rows.length - 1]?.rowIndex}]`
                );
              }
            } else {
              debug(
                `handleMessageFromServer TABLE_ROW ${body.rows.length} rows [${
                  firstRow?.rowIndex
                }] - [${body.rows[body.rows.length - 1]?.rowIndex}]`
              );
            }
          }

          for (const [viewportId, rows] of Object.entries(viewportRowMap)) {
            const viewport = viewports.get(viewportId);
            if (viewport) {
              viewport.updateRows(rows);
            } else {
              warn?.(
                `TABLE_ROW message received for non registered viewport ${viewportId}`
              );
            }
          }

          this.processUpdates();
        }
        break;

      case Message.CHANGE_VP_RANGE_SUCCESS:
        {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const { from, to } = body;
            if (process.env.NODE_ENV === "development") {
              info?.(`CHANGE_VP_RANGE_SUCCESS ${from} - ${to}`);
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

      case "VP_EDIT_RPC_RESPONSE":
        {
          this.postMessageToClient({
            action: body.action,
            requestId,
            rpcName: body.rpcName,
            type: "VP_EDIT_RPC_RESPONSE",
          });
        }
        break;
      case "VP_EDIT_RPC_REJECT":
        {
          const viewport = this.viewports.get(body.vpId);
          if (viewport) {
            this.postMessageToClient({
              requestId,
              type: "VP_EDIT_RPC_REJECT",
              error: body.error,
            });
          }
        }
        break;

      case "VIEW_PORT_MENU_REJ": {
        console.log(`send menu error back to client`);
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
                response as ServerToClientTableMeta
              );
              // Client is going to edit a session table. Ideally, the action
              // would contain all metadata to allow an appropriate form to
              // be presented. That is currently not the case, so client may
              // augment metaData with static data. To do that, client needs
              // to receive the  rpcName with the response.
              this.postMessageToClient({
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
            const { action } = body;
            this.postMessageToClient({
              type: "VIEW_PORT_MENU_RESP",
              action: (action as OpenDialogAction) || NO_ACTION,
              tableAlreadyOpen:
                action !== null && this.isTableOpen(action.table),
              requestId,
            });
          }
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
        error(body.msg);
        break;

      default:
        infoEnabled && info(`handleMessageFromServer ${body["type"]}.`);
    }
  }

  private cacheTableMeta(messageBody: ServerToClientTableMeta): TableSchema {
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
          const size = viewport.getNewRowCount();
          if (size !== undefined || (rows && rows.length > 0)) {
            debugEnabled &&
              debug(
                `postMessageToClient #${
                  viewport.clientViewportId
                } viewport-update ${mode}, ${
                  rows?.length ?? "no"
                } rows, size ${size}`
              );

            if (mode) {
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
