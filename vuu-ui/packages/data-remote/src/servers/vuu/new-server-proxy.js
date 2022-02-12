import * as Message from './messages';
import { authRequest, getViewportMenus, getVisualLinks, loginRequest } from './messages';
import { Viewport } from './new-viewport';
import { getRpcService } from './rpc-services';

// TEST_DATA_COLLECTION
// import { saveTestData } from '../../test-data-collection';

let _requestId = 1;
export const TEST_setRequestId = (id) => (_requestId = id);

const nextRequestId = () => `${_requestId++}`;
const EMPTY_ARRAY = [];
const DEFAULT_OPTIONS = {};

const MENU_RPC_CALLS = {
  'selected-rows': 'VIEW_PORT_MENUS_SELECT_RPC'
};

export class ServerProxy {
  constructor(connection, callback) {
    this.connection = connection;
    this.postMessageToClient = callback;
    this.viewports = new Map();
    this.mapClientToServerViewport = new Map();
    this.currentTimestamp = undefined;
  }

  async authenticate(username, password) {
    return new Promise((resolve, reject) => {
      this.sendMessageToServer(authRequest(username, password), '');
      this.pendingAuthentication = { resolve, reject };
    });
  }

  async login(token = this.loginToken) {
    return new Promise((resolve, reject) => {
      this.sendMessageToServer(loginRequest(token, 'user'), '');
      this.pendingLogin = { resolve, reject };
    });
  }

  subscribe(message) {
    // guard against subscribe message when a viewport is already subscribed
    if (!this.mapClientToServerViewport.has(message.viewport)) {
      const viewport = new Viewport(message);
      this.viewports.set(message.viewport, viewport);
      // use client side viewport as request id, so that when we process the response,
      // with the serverside viewport we can establish a mapping between the two
      const isReady = this.sessionId !== '';
      this.sendIfReady(viewport.subscribe(), message.viewport, isReady);
    } else {
      console.log(`ServerProxy spurious subscribe call ${message.viewport}`);
    }
  }

  unsubscribe(clientViewportId) {
    const serverViewportId = this.mapClientToServerViewport.get(clientViewportId);
    this.sendMessageToServer({
      type: Message.REMOVE_VP,
      viewPortId: serverViewportId
    });
  }

  handleMessageFromClient(message) {
    const { type, viewport: clientViewportId } = message;
    const serverViewportId = this.mapClientToServerViewport.get(clientViewportId);

    // TEST DATA COLLECTION
    // saveTestData(message, 'client');
    //---------------------
    const viewport = this.viewports.get(serverViewportId);
    if (!viewport) {
      switch (type) {
        case Message.GET_TABLE_LIST:
          this.sendMessageToServer({ type }, message.requestId);
          break;
        case Message.GET_TABLE_META:
          this.sendMessageToServer({ type, table: message.table }, message.requestId);
          break;
        case Message.RPC_CALL:
          {
            // below duplicated - tidy up
            const { method } = message;
            const [service, module] = getRpcService(method);
            this.sendMessageToServer(
              {
                type,
                service,
                method,
                params: message.params || [viewport.serverViewportId],
                namedParams: {}
              },
              message.requestId,
              { module }
            );
          }
          break;

        default:
      }
      return;
    }
    const isReady = viewport.status === 'subscribed';

    switch (message.type) {
      case 'setViewRange':
        {
          // onsole.log(`%c[serverProxy] setViewRange ${message.range.lo} ${message.range.hi}`,'color:brown;')
          const requestId = nextRequestId();
          const [serverRequest, rows] = viewport.rangeRequest(
            requestId,
            message.range.lo,
            message.range.hi
          );
          if (serverRequest) {
            this.sendIfReady(serverRequest, requestId, isReady);
          }
          if (rows) {
            const clientMessage = {
              type: 'viewport-updates',
              viewports: {
                [viewport.clientViewportId]: { rows }
              }
            };
            this.postMessageToClient(clientMessage);
          }
        }
        break;

      case 'aggregate':
        {
          const requestId = nextRequestId();
          const request = viewport.aggregateRequest(requestId, message.aggregations);
          this.sendIfReady(request, requestId, isReady);
        }
        break;

      case 'sort':
        {
          const requestId = nextRequestId();
          const request = viewport.sortRequest(requestId, message.sortCriteria);
          this.sendIfReady(request, requestId, isReady);
        }
        break;

      case 'groupBy':
        {
          const requestId = nextRequestId();
          const request = viewport.groupByRequest(requestId, message.groupBy);
          this.sendIfReady(request, requestId, isReady);
        }
        break;

      case 'filterQuery':
        {
          const requestId = nextRequestId();
          const { filter, filterQuery } = message;
          const request = viewport.filterRequest(requestId, filter, filterQuery);
          this.sendIfReady(request, requestId, isReady);
        }
        break;

      case 'select':
        {
          const requestId = nextRequestId();
          const { selected } = message;
          const request = viewport.selectRequest(requestId, selected);
          this.sendIfReady(request, requestId, isReady);
        }
        break;

      case 'suspend':
        viewport.suspend();
        break;

      case 'resume':
        {
          const rows = viewport.resume();
          const clientMessage = {
            type: 'viewport-updates',
            viewports: {
              [viewport.clientViewportId]: { rows }
            }
          };
          this.postMessageToClient(clientMessage);
        }
        break;
      case 'disable':
        {
          // onsole.log(`%cDISABLE`, 'color:red;font-weight: bold;');
          const requestId = nextRequestId();
          const request = viewport.disable(requestId);
          this.sendIfReady(request, requestId, isReady);
        }
        break;

      case 'enable':
        {
          const requestId = nextRequestId();
          const request = viewport.enable(requestId);
          this.sendIfReady(request, requestId, isReady);
        }
        break;

      case 'openTreeNode':
        this.sendIfReady(
          {
            type: Message.OPEN_TREE_NODE,
            vpId: viewport.serverViewportId,
            treeKey: message.key
          },
          _requestId++,
          isReady
        );
        break;

      case 'closeTreeNode':
        this.sendIfReady(
          {
            type: Message.CLOSE_TREE_NODE,
            vpId: viewport.serverViewportId,
            treeKey: message.key
          },
          _requestId++,
          isReady
        );

        break;

      case 'createLink':
        {
          const {
            parentVpId,
            parentColumnName,
            childColumnName,
            viewport: clientViewportId
          } = message;

          const serverViewportId = this.mapClientToServerViewport.get(clientViewportId);
          const viewport = this.viewports.get(serverViewportId);
          const requestId = nextRequestId();
          const request = viewport.createLink(
            requestId,
            childColumnName,
            parentVpId,
            parentColumnName
          );

          this.sendMessageToServer(request, requestId);
        }
        break;

      case Message.MENU_RPC_CALL:
        {
          const { context, rpcName } = message;
          this.sendMessageToServer(
            {
              type: MENU_RPC_CALLS[context],
              rpcName,
              vpId: viewport.serverViewportId
            },
            message.requestId,
            'CORE'
          );
        }

        break;

      case Message.RPC_CALL:
        {
          const { method } = message;
          const [service, module] = getRpcService(method);
          this.sendMessageToServer(
            {
              type,
              service,
              method,
              params: message.params || [viewport.serverViewportId],
              namedParams: {}
            },
            message.requestId,
            module
          );
        }

        break;

      default:
        console.log(`Vuu ServerProxy Unexpected message from client ${JSON.stringify(message)}`);
    }
  }

  sendIfReady(message, requestId, isReady = true, options) {
    // TODO implement the message queuing in remote data view
    if (isReady) {
      this.sendMessageToServer(message, requestId, options);
    } else {
      // TODO need to make sure we keep the requestId
      this.queuedRequests.push(message);
    }
    return isReady;
  }

  sendMessageToServer(body, requestId = `${_requestId++}`, options = DEFAULT_OPTIONS) {
    const { module = 'CORE', ...restOptions } = options;
    // const { clientId } = this.connection;
    this.connection.send(
      {
        requestId,
        sessionId: this.sessionId,
        token: this.loginToken,
        user: 'user',
        module,
        body
      },
      restOptions
    );
  }

  handleMessageFromServer(message) {
    const {
      requestId,
      body: { type, timeStamp, ...body }
    } = message;

    // onsole.log(`%c<<< [${new Date().toISOString().slice(11,23)}]  (ServerProxy) ${message.type || JSON.stringify(message)}`,'color:white;background-color:blue;font-weight:bold;');

    const { viewports } = this;
    switch (type) {
      case Message.HB:
        this.sendMessageToServer({ type: Message.HB_RESP, ts: +new Date() }, 'NA');
        break;

      // TODO should be handle these more as Request/Response calls, so we handle the response
      // at the call site ?
      case Message.AUTH_SUCCESS:
        this.loginToken = message.token;
        this.pendingAuthentication.resolve(message.token);
        break;

      case Message.LOGIN_SUCCESS:
        this.sessionId = message.sessionId;
        this.pendingLogin.resolve(message.sessionId);
        break;

      case Message.CREATE_VP_SUCCESS:
        // The clientViewportId was used as requestId for CREATE_VPmessage
        if (viewports.has(requestId)) {
          const viewport = viewports.get(requestId);
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
          this.sendMessageToServer(getVisualLinks(serverViewportId));
          this.sendMessageToServer(getViewportMenus(serverViewportId));
        }
        break;

      case Message.REMOVE_VP_SUCCESS:
        if (viewports.has(body.viewPortId)) {
          // do we need a destroy method on viewport for cleanup ?
          const { clientViewportId } = viewports.get(body.viewPortId);
          this.mapClientToServerViewport.delete(clientViewportId);
          viewports.delete(body.viewPortId);
        }
        break;

      case Message.SET_SELECTION_SUCCESS:
        if (viewports.has(body.vpId)) {
          viewports.get(body.vpId).completeOperation(requestId);
        }
        break;

      case Message.CHANGE_VP_SUCCESS:
      case Message.DISABLE_VP_SUCCESS:
        if (viewports.has(body.viewPortId)) {
          const response = this.viewports.get(body.viewPortId).completeOperation(requestId);
          if (response) {
            this.postMessageToClient(response);
          }
        }

        break;

      case Message.ENABLE_VP_SUCCESS:
        if (viewports.has(body.viewPortId)) {
          const viewport = viewports.get(body.viewPortId);
          const response = viewport.completeOperation(requestId);
          this.postMessageToClient(response);
          const rows = viewport.currentData();
          const clientMessage = {
            type: 'viewport-updates',
            viewports: {
              [viewport.clientViewportId]: { rows }
            }
          };
          this.postMessageToClient(clientMessage);
        }
        break;
      case Message.TABLE_ROW:
        {
          const [{ ts: firstBatchTimestamp } = { ts: timeStamp }] = body.rows || EMPTY_ARRAY;
          // onsole.log(`\nbatch timestamp ${time(timeStamp)} first timestamp ${time(firstBatchTimestamp)} ${body.rows.length} rows in batch`)
          for (const row of body.rows) {
            const { viewPortId, rowIndex, rowKey, updateType } = row;
            const viewport = viewports.get(viewPortId);
            if (viewport) {
              // onsole.log(`row timestamp ${time(row.ts)}`)
              // This might miss rows if we receive rows after submitting a groupByRequest but before
              // receiving the ACK
              if (viewport.isTree && updateType === 'U' && !rowKey.startsWith('$root')) {
                console.log('Ignore blank rows sent after GroupBy');
              } else {
                viewport.handleUpdate(updateType, rowIndex, row);
              }
            } else {
              console.warn(`TABLE_ROW message received for non registered viewport ${viewPortId}`);
            }
            // onsole.log(`%c[ServerProxy] after updates, movingWindow has ${viewport.dataWindow.internalData.length} records`,'color:brown')
          }

          this.processUpdates(firstBatchTimestamp);
        }
        break;

      case Message.CHANGE_VP_RANGE_SUCCESS:
        {
          const { viewPortId, from, to } = body;
          viewports.get(viewPortId).completeOperation(requestId, from, to);
        }
        break;

      case Message.OPEN_TREE_SUCCESS:
      case Message.CLOSE_TREE_SUCCESS:
        break;

      case Message.CREATE_VISUAL_LINK_SUCCESS:
        {
          const { childVpId, childColumnName, parentVpId, parentColumnName } = body;
          const { clientViewportId: parentViewportId } = this.viewports.get(parentVpId);
          const response = this.viewports
            .get(childVpId)
            .completeOperation(requestId, childColumnName, parentViewportId, parentColumnName);
          if (response) {
            this.postMessageToClient(response);
          }
        }
        break;

      case Message.TABLE_LIST_RESP:
        this.postMessageToClient({ type, tables: body.tables, requestId });
        break;

      case Message.TABLE_META_RESP:
        this.postMessageToClient({
          type,
          table: body.table,
          columns: body.columns,
          dataTypes: body.dataTypes,
          requestId
        });
        break;

      case Message.VP_VISUAL_LINKS_RESP:
        {
          const links = this.getActiveLinks(body.links);
          if (links.length) {
            const viewport = this.viewports.get(body.vpId);
            const [clientMessage, pendingLink] = viewport.setLinks(links);
            this.postMessageToClient(clientMessage);
            if (pendingLink) {
              console.log({ pendingLink });
              const { colName, parentViewportId, parentColName } = pendingLink;
              const requestId = nextRequestId();
              const serverViewportId = this.mapClientToServerViewport.get(parentViewportId);
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
        break;

      case Message.VIEW_PORT_MENUS_RESP:
        if (body.menu.name) {
          const viewport = this.viewports.get(body.vpId);
          const clientMessage = viewport.setMenu(body.menu);
          this.postMessageToClient(clientMessage);
        }
        break;

      case Message.VIEW_PORT_MENU_RESP:
        {
          const { action } = body;
          this.postMessageToClient({
            type,
            action,
            tableAlreadyOpen: this.isTableOpen(action.table),
            requestId
          });
        }
        break;

      case Message.RPC_RESP:
        {
          const { method, result } = body;
          // check to see if the orderEntry is already open on the page
          this.postMessageToClient({
            type,
            method,
            result,
            requestId
          });
        }
        break;

      case 'ERROR':
        console.error(body.msg);
        break;

      default:
        console.log(`handleMessageFromServer,${body.type}.`);
    }
  }

  isTableOpen(table) {
    if (table) {
      const tableName = table.table;
      for (let viewport of this.viewports.values()) {
        if (!viewport.suspended && viewport.table === tableName) {
          return true;
        }
      }
    }
  }

  // Eliminate links to suspended viewports
  getActiveLinks(links) {
    return links.filter((link) => {
      const viewport = this.viewports.get(link.parentVpId);
      return viewport && !viewport.suspended;
    });
  }

  processUpdates(timeStamp) {
    let clientMessage;
    this.viewports.forEach((viewport) => {
      if (viewport.hasUpdatesToProcess) {
        const rows = viewport.getClientRows(timeStamp);
        const size = viewport.getNewRowCount();
        if (size !== undefined || rows) {
          clientMessage = clientMessage || {
            type: 'viewport-updates',
            viewports: {}
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
