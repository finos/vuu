# Vuu Data

package name `@finos/vuu-data`

## Introduction

The `vuu-data` package includes everything needed to connect a Web application to a Vuu server. An application will connect to a single Vuu server. There are two important APIs that client code will always use when connectiong to a Vuu server:

- connectToServer
- RemoteDataSource

`connectToServer` does exactly what the name suggests, it opens a (WebSocket) connection to the server using the credentials established at login time. This must be called once, and must be successful before any DataSource subscription can be successfully opened.

Internally a singleton object, the `ConnectionManager`, orchestrates the details of server connection and individual subscriptions made by `DataSource` clients. A WebWorker is created and within the worker, a WebSocket connection is opened to the server.

The Vuu server stores data (in memory) in tables. An application may make use of one or many tables. A client can open a subscription to a table using a `RemoteDataSource`. Typically, a single UI component will create a `RemoteDataSource` to load data from one Vuu table. The DataGrid component is an example of this pattern. An application may have many UI components, each of which subscribe individually to Vuu tables.

## `connectToServer`

```JavaScript
import { connectToServer } from "@finos/vuu-data";


connectToServer({
    authToken: user.token,
    url: serverUrl,
    username: user.username,
});

```

## `RemoteDataSource`

A `RemoteDataSource` manages a client subscription to a single Vuu table. The subscription initiated by the client will provide configuration options to describe the data required. The only `required` option is the identifier for the table itself. This cannot be changed once the subscription is opened. If the client needs to switch a subscription to a different table, a new `RemoteDataSource` should be created. All other subscription details are optional and can be changed at any time once the subscription id open, these are:

- columns
- range
- sort
- groupBy
- filter
- aggregations

A minimal implementation of DataSource creation and subscription. See below for details of the `datasourceMessageHandler` callback

```JavaScript
    const ds = new RemoteDataSource({
      table: {module: 'SIMUL', table: 'instruments'},
      columns: ['ric', 'description'],
    });
```

```JavaScript
    dataSource.subscribe(
      {
        range: {from: 0, to: 20},
      },
      datasourceMessageHandler
    );
```

A few important points to understand about the above code. No interaction with the server happens when the DataSource itself is created, it simply stores the details provided. Configuration options can be passed either via the `DataSource` constructor or via the `subscribe` method call. The `subscribe` method is asynchronous. It doesn't return a useful result. Rather, messages will be passed to the client via the `datasourceMessageHandler` callback.

The call to `connectToServer` described above must succeed before any subscription will be opened. There is no requirement for the client to manage the sequencing of these operations - if calls are made to `subscribe` before the connection has been opened to the server (or even before `connectToServer` has been called), the `subscribe` calls will block until that call is made and the connection is open.

## What exactly does `dataSource.subscribe` do ?

When a client calls `subscribe`, a `CREATE_VP` message is sent to the Vuu server. The Vuu server will create a `Viewport` to handle all subsequent interaction on this subscription. A `Viewport` is a lightweight data structure that manages client access to an underlying data table. There is a one-to-one relationship between a server `Viewport` and a client subscription. The `Viewport` is a set of indices that reflect the configuration options provided by the client subscription - sorting, filtering, grouping etc. These indices store pointers to data rows in the underlying data table. Whereas the `Viewport` is unique to a single client subscription, the underlying data tables are shared across all subscriptions and all clients.

One of the key features of Vuu is that it can manage large data tables, but sends to the client only the data currently visible in the browser viewport. If offers a virtualized window into a larger dataset. It is the `range` option which drives this. The server will only send data to a client when a `range` is provided and will only send the data rows that correspond to that range. It is only when a range of rows is prepared for delivery to the client that data is loaded from the underlying table, using the indices that comprise the `Viewport`.

## `subscribe` options
