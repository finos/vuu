import * as Message from "./messages";
import { Viewport } from "./viewport";
import { getRpcServiceModule as getRpcServiceModule } from "./rpc-services";
import { Connection } from "../connectionTypes";
import {
  ServerToClientMessage,
  ClientToServerMessage,
  VuuColumnDataType,
  VuuLink,
  VuuTable,
  VuuRpcRequest,
  VuuMenuRpcRequest,
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
} from "../vuuUIMessageTypes";
import { DataSourceCallbackMessage } from "../data-source";
import {
  isVuuMenuRpcRequest,
  stripRequestId,
  WithRequestId,
} from "../message-utils";

export type PostMessageToClientCallback = (
  message: VuuUIMessageIn | DataSourceCallbackMessage
) => void;

export type LinkWithLabel = VuuLink & {
  label?: string;
};

export type MessageOptions = {
  module?: string;
};

// TEST_DATA_COLLECTION
// import { saveTestData } from '../../test-data-collection';

let _requestId = 1;
export const TEST_setRequestId = (id: number) => (_requestId = id);

const nextRequestId = () => `${_requestId++}`;
const EMPTY_ARRAY: unknown[] = [];
const DEFAULT_OPTIONS: MessageOptions = {};

function addLabelsToLinks(
  links: VuuLink[],
  viewports: Map<string, Viewport>
): LinkWithLabel[] {
  return links.map<LinkWithLabel>((link) => {
    const { parentVpId } = link;
    const viewport = viewports.get(parentVpId);
    if (viewport && viewport.title) {
      return {
        ...link,
        label: viewport.title,
      };
    } else {
      return link;
    }
  });
}

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
        `ServerProxy login, cannot login until auth token has been obtained`
      );
    }
  }

  public subscribe(message: ServerProxySubscribeMessage) {
    // guard against subscribe message when a viewport is already subscribed
    if (!this.mapClientToServerViewport.has(message.viewport)) {
      if (!this.hasMetaDataFor(message.table)) {
        const requestId = nextRequestId();
        this.sendMessageToServer(
          { type: "GET_TABLE_META", table: message.table },
          requestId
        );
        this.pendingTableMetaRequests.set(requestId, message.viewport);
      }
      const viewport = new Viewport(message);
      this.viewports.set(message.viewport, viewport);
      // use client side viewport as request id, so that when we process the response,
      // with the serverside viewport we can establish a mapping between the two
      this.sendIfReady(
        viewport.subscribe(),
        message.viewport,
        this.sessionId !== ""
      );
    } else {
      console.log(`ServerProxy spurious subscribe call ${message.viewport}`);
    }
  }

  public unsubscribe(clientViewportId: string) {
    const serverViewportId =
      this.mapClientToServerViewport.get(clientViewportId);
    if (serverViewportId) {
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
    const [serverRequest, rows] = viewport.rangeRequest(
      requestId,
      message.range
    );
    if (serverRequest) {
      this.sendIfReady(
        serverRequest,
        requestId,
        viewport.status === "subscribed"
      );
    }
    if (rows) {
      this.postMessageToClient({
        type: "viewport-update",
        clientViewportId: viewport.clientViewportId,
        rows,
      });
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

  private select(viewport: Viewport, message: VuuUIMessageOutSelect) {
    const requestId = nextRequestId();
    const { selected } = message;
    const request = viewport.selectRequest(requestId, selected);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  //TODO when do we ever checj the disabled state ?
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
      this.sendIfReady(
        {
          type: Message.OPEN_TREE_NODE,
          vpId: viewport.serverViewportId,
          treeKey: message.key,
        },
        nextRequestId(),
        viewport.status === "subscribed"
      );
    }
  }

  private closeTreeNode(
    viewport: Viewport,
    message: VuuUIMessageOutCloseTreeNode
  ) {
    if (viewport.serverViewportId) {
      this.sendIfReady(
        {
          type: Message.CLOSE_TREE_NODE,
          vpId: viewport.serverViewportId,
          treeKey: message.key,
        },
        nextRequestId(),
        viewport.status === "subscribed"
      );
    }
  }

  private createLink(viewport: Viewport, message: VuuUIMessageOutCreateLink) {
    const { parentVpId, parentColumnName, childColumnName } = message;
    const requestId = nextRequestId();
    const request = viewport.createLink(
      requestId,
      childColumnName,
      parentVpId,
      parentColumnName
    );
    this.sendMessageToServer(request, requestId);
  }

  private removeLink(viewport: Viewport) {
    const requestId = nextRequestId();
    const request = viewport.removeLink(requestId);
    this.sendMessageToServer(request, requestId);
  }

  private menuRpcCall(message: WithRequestId<VuuMenuRpcRequest>) {
    const viewport = this.getViewportForClient(message.vpId, false);
    if (viewport?.serverViewportId) {
      const [requestId, rpcRequest] =
        stripRequestId<VuuMenuRpcRequest>(message);
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
      | WithRequestId<VuuMenuRpcRequest>
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
          default:
        }
      }
    } else if (isVuuMenuRpcRequest(message)) {
      return this.menuRpcCall(message);
    } else {
      const { type, requestId } = message;
      switch (type) {
        case "GET_TABLE_LIST":
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
    console.log(
      `Vuu ServerProxy Unexpected message from client ${JSON.stringify(
        message
      )}`
    );
    // TEST DATA COLLECTION
    // saveTestData(message, 'client');
    //---------------------
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
        } else {
          throw Error(`LOGIN_SUCCESS did not provide sessionId `);
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
            const { viewPortId: serverViewportId } = body;

            if (requestId !== serverViewportId) {
              viewports.delete(requestId);
              viewports.set(serverViewportId, viewport);
            }
            this.mapClientToServerViewport.set(requestId, serverViewportId);
            const response = viewport.handleSubscribed(body);
            if (response) {
              this.postMessageToClient(response);
            }
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
        break;

      case Message.REMOVE_VP_SUCCESS:
        {
          console.log(`ACK viewport removed`);
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            // do we need a destroy method on viewport for cleanup ?
            this.mapClientToServerViewport.delete(viewport.clientViewportId);
            viewports.delete(body.viewPortId);
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
            if (response) {
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
              this.postMessageToClient(response);
              const rows = viewport.currentData();
              this.postMessageToClient({
                clientViewportId: viewport.clientViewportId,
                rows,
                type: "viewport-update",
              });
            }
          }
        }
        break;
      case Message.TABLE_ROW:
        {
          const { timeStamp } = body;
          const [{ ts: firstBatchTimestamp } = { ts: timeStamp }] =
            body.rows || EMPTY_ARRAY;
          // onsole.log(`\nbatch timestamp ${time(timeStamp)} first timestamp ${time(firstBatchTimestamp)} ${body.rows.length} rows in batch`)
          for (const row of body.rows) {
            const { viewPortId, rowIndex, rowKey, updateType } = row;
            const viewport = viewports.get(viewPortId);
            if (viewport) {
              // onsole.log(`row timestamp ${time(row.ts)}`)
              // This might miss rows if we receive rows after submitting a groupByRequest but before
              // receiving the ACK
              if (
                viewport.isTree &&
                updateType === "U" &&
                !rowKey.startsWith("$root")
              ) {
                // Ignore blank rows sent after GroupBy;
              } else {
                viewport.handleUpdate(updateType, rowIndex, row);
              }
            } else {
              console.warn(
                `TABLE_ROW message received for non registered viewport ${viewPortId}`
              );
            }
            // onsole.log(`%c[ServerProxy] after updates, movingWindow has ${viewport.dataWindow.internalData.length} records`,'color:brown')
          }

          this.processUpdates(firstBatchTimestamp);
        }
        break;

      case Message.CHANGE_VP_RANGE_SUCCESS:
        {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const { from, to } = body;
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
            );
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
            const response = viewport.completeOperation(requestId);
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
              console.log(
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

      case Message.VP_VISUAL_LINKS_RESP:
        {
          const links = this.getActiveLinks(body.links);
          const viewport = this.viewports.get(body.vpId);
          if (links.length && viewport) {
            const linksWithLabels = addLabelsToLinks(links, this.viewports);
            const [clientMessage, pendingLink] =
              viewport.setLinks(linksWithLabels);
            this.postMessageToClient(clientMessage);
            if (pendingLink) {
              const { colName, parentViewportId, parentColName } = pendingLink;
              const requestId = nextRequestId();
              const serverViewportId =
                this.mapClientToServerViewport.get(parentViewportId);
              if (serverViewportId) {
                const message = viewport.createLink(
                  requestId,
                  colName,
                  serverViewportId,
                  parentColName
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
        console.error(body.msg);
        break;

      default:
        console.log(`handleMessageFromServer ${body["type"]}.`);
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
  getActiveLinks(links: VuuLink[]) {
    return links.filter((link) => {
      const viewport = this.viewports.get(link.parentVpId);
      return viewport && !viewport.suspended;
    });
  }

  processUpdates(timeStamp: number) {
    this.viewports.forEach((viewport) => {
      if (viewport.hasUpdatesToProcess) {
        const rows = viewport.getClientRows(timeStamp);
        const size = viewport.getNewRowCount();
        if (size !== undefined || (rows && rows.length > 0)) {
          this.postMessageToClient({
            clientViewportId: viewport.clientViewportId,
            rows,
            size,
            type: "viewport-update",
          });
        }
      }
    });
  }
}
