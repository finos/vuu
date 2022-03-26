import { createLogger, logColor, EventEmitter, invariant } from '@vuu-ui/utils';
import connect from '../remote-websocket-connection';

const serverProxies = new WeakMap();
const servers = new WeakMap();

const logger = createLogger('ConnectionManager', logColor.green);

// const getServerProxy = async serverName => {
//   console.log(`request for proxy class for ${serverName}`,serverProxies[serverName])
//   return serverProxies[serverName] || (serverProxies[serverName] =
//     import(/* webpackIgnore: true */`/server-proxy/viewserver.js`));
//     // import(/* webpackChunkName: "viewserver" */`./servers/viewserver/server-proxy.js`));
// }
const getServerProxy = async (serverName) => {
  console.log(`request for proxy class for ${serverName}`, serverProxies[serverName]);
  return (
    serverProxies[serverName] ||
    (serverProxies[serverName] =
      // import(/* webpackIgnore: true */`/server-proxy/${serverName}.js`));
      import(`./servers/${serverName}/server-proxy.js`))
  );
};
const connectServer = async (serverName, url, onConnectionStatusMessage) => {
  const promisedServer = servers[url];

  if (promisedServer) {
    const server = await promisedServer;
    if (server.connection.status === 'closed') {
      logger.log('reconnect to server');
      await server.reconnect();
    }
    return server;
  } else {
    // eslint-disable-next-line no-async-promise-executor
    return (servers[url] = new Promise(async (resolve) => {
      const proxyModule = getServerProxy(serverName);
      const pendingConnection = connect(
        url,
        // if this was called during connect, we would get a ReferenceError, but it will
        // never be called until subscriptions have been made, so this is safe.
        (msg) => server.handleMessageFromServer(msg),
        (msg) => {
          onConnectionStatusMessage(msg);
          if (msg.status === 'disconnected') {
            server.disconnected();
          } else if (msg.status === 'reconnected') {
            server.resubscribeAll();
          }
        }
      );

      const [{ ServerProxy }, connection] = [await proxyModule, await pendingConnection];
      invariant(
        typeof ServerProxy === 'function',
        'Unable to load ServerProxy class for ${serverName}'
      );
      invariant(connection !== undefined, 'unable to open connection to ${url}');
      // if the connection breaks, the serverPrtoxy will continue top 'send' messages
      const server = new ServerProxy(connection);

      // How do we handle authentication, login
      if (typeof server.authenticate === 'function') {
        await server.authenticate('bill', 'pword');
      }
      if (typeof server.login === 'function') {
        await server.login();
      }

      resolve(server);
    }));
  }
};

class ConnectionManager extends EventEmitter {
  async connect(url, serverName) {
    logger.log(`ConnectionManager.connect ${serverName} ${url}`);
    return connectServer(serverName, url, (msg) =>
      this.onConnectionStatusChanged(serverName, url, msg)
    );
  }

  // Note we might have multiple server connections, we're not distinguishing between them here
  onConnectionStatusChanged(serverName, url, msg) {
    const { status } = msg;
    logger.log(`connectionStatusChanged server ${serverName}, url ${url} status ${status}`);
    this.emit('connection-status', msg);
  }
}

export default new ConnectionManager();
