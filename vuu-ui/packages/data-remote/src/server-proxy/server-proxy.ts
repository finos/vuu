import * as Message from "./messages";
import { Viewport } from "./viewport";
import { getRpcService } from "./rpc-services";
import { Connection } from "../connectionTypes";
import {
  ServerToClientMessage,
  ClientToServerMessage,
  VuuLink,
  VuuMenuContext,
  VuuTable,
} from "@vuu-ui/data-types";
import {
  isViewporttMessage as isViewportMessage,
  ServerProxySubscribeMessage,
  VuuUIMessageIn,
  VuuUIMessageInTableList,
  VuuUIMessageInTableMeta,
  VuuUIMessageInViewportUpdates,
  VuuUIMessageOut,
  VuuUIMessageOutAggregate,
  VuuUIMessageOutConnect,
  VuuUIMessageOutCreateLink,
  VuuUIMessageOutDisable,
  VuuUIMessageOutEnable,
  VuuUIMessageOutFilterQuery,
  VuuUIMessageOutGroupby,
  VuuUIMessageOutMenuRPC,
  VuuUIMessageOutRPC,
  VuuUIMessageOutOpenTreeNode,
  VuuUIMessageOutCloseTreeNode,
  VuuUIMessageOutSelect,
  VuuUIMessageOutSort,
  VuuUIMessageOutSubscribe,
  VuuUIMessageOutUnsubscribe,
  VuuUIMessageOutViewRange,
} from "../vuuUIMessageTypes";

export type PostMessageToClientCallback = (message: VuuUIMessageIn) => void;

// TEST_DATA_COLLECTION
// import { saveTestData } from '../../test-data-collection';

let _requestId: number = 1;
export const TEST_setRequestId = (id: number) => (_requestId = id);

const nextRequestId = () => `${_requestId++}`;
const EMPTY_ARRAY: unknown[] = [];
const DEFAULT_OPTIONS = {};

const getRPCType = (
  msgType: "MENU_RPC_CALL",
  context: VuuMenuContext
): "VIEW_PORT_MENUS_SELECT_RPC" => {
  if (msgType === "MENU_RPC_CALL" && context === "selected-rows") {
    return "VIEW_PORT_MENUS_SELECT_RPC";
  } else {
    throw Error("No RPC command for ${msgType} / ${context}");
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
  private authToken: string = "";
  private pendingLogin?: PendingLogin;
  private sessionId?: string;
  private queuedRequests: Array<ClientToServerMessage["body"]> = [];

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
        `ServerProxy: failed to unsubscribe client viewport ${clientViewportId}`
      );
    }
  }

  private getViewportForClient(clientViewportId: string): Viewport {
    const serverViewportId =
      this.mapClientToServerViewport.get(clientViewportId);
    if (serverViewportId) {
      const viewport = this.viewports.get(serverViewportId);
      if (viewport) {
        return viewport;
      } else {
        throw Error(
          `Viewport not found for client viewport ${clientViewportId}`
        );
      }
    } else {
      throw Error(
        `Viewport server id not found for client viewport ${clientViewportId}`
      );
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
        type: "viewport-updates",
        viewports: {
          [viewport.clientViewportId]: { rows },
        },
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
    const request = viewport.sortRequest(requestId, message.sortDefs);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  private groupBy(viewport: Viewport, message: VuuUIMessageOutGroupby) {
    const requestId = nextRequestId();
    const request = viewport.groupByRequest(requestId, message.groupBy);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  private filter(viewport: Viewport, message: VuuUIMessageOutFilterQuery) {
    const requestId = nextRequestId();
    const { filter, filterQuery } = message;
    const request = viewport.filterRequest(requestId, filter, filterQuery);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  private select(viewport: Viewport, message: VuuUIMessageOutSelect) {
    const requestId = nextRequestId();
    const { selected } = message;
    const request = viewport.selectRequest(requestId, selected);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  //TODO when do we ever checj the disabled state ?
  private disableViewport(viewport: Viewport, message: VuuUIMessageOutDisable) {
    const requestId = nextRequestId();
    const request = viewport.disable(requestId);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  private enableViewport(viewport: Viewport, message: VuuUIMessageOutEnable) {
    const requestId = nextRequestId();
    const request = viewport.enable(requestId);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }

  private resumeViewport(viewport: Viewport) {
    const rows = viewport.resume();
    this.postMessageToClient({
      type: "viewport-updates",
      viewports: {
        [viewport.clientViewportId]: { rows },
      },
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
    console.log(
      `ServerProxy removeLink ${viewport.serverViewportId} ${viewport.table.table}`
    );
    const requestId = nextRequestId();
    const request = viewport.removeLink(requestId);
    this.sendMessageToServer(request, requestId);
  }

  private menuRpcCall(viewport: Viewport, message: VuuUIMessageOutMenuRPC) {
    if (viewport.serverViewportId) {
      const { context, rpcName } = message;
      this.sendMessageToServer(
        {
          type: getRPCType(message.type, context),
          rpcName,
          vpId: viewport.serverViewportId,
        },
        message.requestId
      );
    }
  }

  private rpcCall(message: VuuUIMessageOutRPC) {
    // below duplicated - tidy up
    const { method, requestId, type } = message;
    const [service, module] = getRpcService(method);
    this.sendMessageToServer(
      {
        type,
        service,
        method,
        params: message.params /*|| [viewport.serverViewportId]*/,
        namedParams: {},
      },
      requestId,
      { module }
    );
  }

  public handleMessageFromClient(
    message: Exclude<
      VuuUIMessageOut,
      | VuuUIMessageOutConnect
      | VuuUIMessageOutSubscribe
      | VuuUIMessageOutUnsubscribe
    >
  ) {
    if (isViewportMessage(message)) {
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
        case "filterQuery":
          return this.filter(viewport, message);
        case "select":
          return this.select(viewport, message);
        case "suspend":
          return viewport.suspend();
        case "resume":
          return this.resumeViewport(viewport);
        case "disable":
          return this.disableViewport(viewport, message);
        case "enable":
          return this.enableViewport(viewport, message);
        case "openTreeNode":
          return this.openTreeNode(viewport, message);
        case "closeTreeNode":
          return this.closeTreeNode(viewport, message);
        case "createLink":
          return this.createLink(viewport, message);
        case "removeLink":
          return this.removeLink(viewport);
        case "MENU_RPC_CALL":
          return this.menuRpcCall(viewport, message);
        default:
      }
    } else {
      const { type, requestId } = message;
      switch (type) {
        case Message.GET_TABLE_LIST:
          return this.sendMessageToServer({ type }, requestId);
        case Message.GET_TABLE_META:
          return this.sendMessageToServer(
            { type, table: message.table },
            requestId
          );
        case Message.RPC_CALL:
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
    isReady: boolean = true,
    options?: any
  ) {
    // TODO implement the message queuing in remote data view
    if (isReady) {
      this.sendMessageToServer(message, requestId, options);
    } else {
      // TODO need to make sure we keep the requestId
      this.queuedRequests.push(message);
    }
    return isReady;
  }

  public sendMessageToServer(
    body: ClientToServerMessage["body"],
    requestId: string = `${_requestId++}`,
    options: any = DEFAULT_OPTIONS
  ) {
    const { module = "CORE", ...restOptions } = options;
    // const { clientId } = this.connection;
    if (this.authToken) {
      this.connection.send(
        {
          requestId,
          sessionId: this.sessionId,
          token: this.authToken,
          user: "user",
          module,
          body,
        } as ClientToServerMessage
        // restOptions
      );
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
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            // do we need a destroy method on viewport for cleanup ?
            this.mapClientToServerViewport.delete(viewport.clientViewportId);
            viewports.delete(body.viewPortId);
          }
        }
        break;

      case Message.SET_SELECTION_SUCCESS:
        const viewport = this.viewports.get(body.vpId);
        if (viewport) {
          viewport.completeOperation(requestId);
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
              const clientMessage = {
                type: "viewport-updates",
                viewports: {
                  [viewport.clientViewportId]: { rows },
                },
              } as VuuUIMessageInViewportUpdates;
              this.postMessageToClient(clientMessage);
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
                console.log("Ignore blank rows sent after GroupBy");
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

      case Message.CREATE_VISUAL_LINK_SUCCESS:
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
        this.postMessageToClient({
          type: Message.TABLE_META_RESP,
          table: body.table,
          columns: body.columns,
          dataTypes: body.dataTypes,
          requestId,
        } as VuuUIMessageInTableMeta);
        break;

      /*

  private createLink(viewport: Viewport, message: VuuUIMessageOutCreateLink) {
    const { parentVpId, parentColumnName, childColumnName } = message;
    const requestId = nextRequestId();
    const request = viewport.createLink(requestId, childColumnName, parentVpId, parentColumnName);
    this.sendMessageToServer(request, requestId);
  }

        */
      case Message.VP_VISUAL_LINKS_RESP:
        {
          const links = this.getActiveLinks(body.links);
          const viewport = this.viewports.get(body.vpId);
          if (links.length && viewport) {
            const [clientMessage, pendingLink] = viewport.setLinks(links);
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

      case Message.VIEW_PORT_MENUS_RESP:
        if (body.menu.name) {
          const viewport = this.viewports.get(body.vpId);
          if (viewport) {
            const clientMessage = viewport.setMenu(body.menu);
            this.postMessageToClient(clientMessage);
          }
        }
        break;

      case Message.VIEW_PORT_MENU_RESP:
        {
          const { action } = body;
          this.postMessageToClient({
            type: Message.VIEW_PORT_MENU_RESP,
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
        console.log(`handleMessageFromServer ${(body as any).type as string}.`);
    }
  }

  isTableOpen(table?: VuuTable) {
    if (table) {
      const tableName = table.table;
      for (let viewport of this.viewports.values()) {
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
    let clientMessage: VuuUIMessageInViewportUpdates;
    this.viewports.forEach((viewport) => {
      if (viewport.hasUpdatesToProcess) {
        const rows = viewport.getClientRows(timeStamp);
        const size = viewport.getNewRowCount();
        if (size !== undefined || (rows && rows.length > 0)) {
          clientMessage = clientMessage || {
            type: "viewport-updates",
            viewports: {},
          };
          clientMessage.viewports[viewport.clientViewportId] = { rows, size };
        }
      }
      if (clientMessage) {
        // const now = performance.now();
        // if (updateTime){
        //   onsole.log(`time between updates ${now - updateTime}`)
        // }
        // updateTime = now;
        // Object.values(clientMessage.viewports).forEach(({rows, size}) =>
        //   onsole.log(`%c[ServerProxy] processUpdates, posting ${rows.length} rows (size ${size})`,'color:brown')
        // )
        this.postMessageToClient(clientMessage);
      }
    });
  }
}
