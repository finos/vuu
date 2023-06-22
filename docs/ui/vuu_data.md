# Vuu Data

package name `@finos/vuu-data`

## Introduction

The `vuu-data` package includes everything needed to connect a Web application to a Vuu server. An application will connect to a single Vuu server. There are two important APIs that client code will always use when connecting to a Vuu server:

- connectToServer
- RemoteDataSource

`connectToServer` does exactly what the name suggests, it opens a (WebSocket) connection to the server using the credentials established at login time. This must be called once, and must succeed before any DataSource subscription can be opened.

```JavaScript
import { connectToServer } from "@vuu-ui/vuu-data";


connectToServer({
    authToken: user.token,
    url: serverUrl,
    username: user.username,
});

```

Internally a singleton object, the `ConnectionManager`, orchestrates both the initial connection to the server and then individual table subscriptions made by `DataSource` clients. A WebWorker is created so that data messaging with Vuu is moved off the main UI thread. Within the worker, a WebSocket connection is opened to the server. All messages, across any number of subscriptions, are routed across the same WebSocket connection.

The Vuu server stores data (in memory) in tables. An application may make use of one or many tables. A client will use a `RemoteDataSource` to open a subscription to a single Vuu table. If the client connects to multiple Vuu tables, multiple `RemoteDataSource` instances will be created. This is normally handled at the component level. A UI component, a DataGrid for example, will create a `RemoteDataSource` to load data from the target Vuu table. An application will quite possibly have multiple data-bound UI components, each will create a RemoteDataSource.

It is not uncommon for a UI to host multiple UI components consuming and rendering data from the same server table. For example, an application view may host two DataGrids showing Order data - one filtered to show only cancelled orders, the other showing live orders. Although the underlying Orders table might be the same, these two DataGrid components would still each create their own RemoteDataSource instance. The RemoteDataSource encapsulates all aspects of a client subscription - not just the remote table to which the subscription is made, but also any filtering criteria, sorting criteria, grouping criteria etc applied by the user. In the example above, two subscriptions would be created to the Orders table, but each would have different filtering criteria applied. On the Vuu server, these translate into two Viewports being created on the same underlying table.

## RemoteDataSource

A `RemoteDataSource` manages a client subscription to a single Vuu table. The subscription initiated by the client will provide configuration options to describe the data required. The only mandatory option is the identifier for the table itself. This cannot be changed once the subscription is opened. If the client needs to switch a subscription to a different table, a new `RemoteDataSource` should be created. All other subscription details are optional and can be changed at any time once the subscription is open.

A minimal implementation of RemoteDataSource creation:

```JavaScript
    const ds = new RemoteDataSource({
      table: {module: 'SIMUL', table: 'instruments'},
      columns: ['ric', 'description'],
    });
```

This defines a RemoteDataSource that will (when subscribe is called) create a subscription to the instruments table. When the subscription is opened, data returned by Vuu will be for two columns only, 'ric' and 'description'.

An equally minimalist subscribe call:

```JavaScript
    dataSource.subscribe(
      {
        range: {from: 0, to: 20},
      },
      datasourceMessageHandler
    );
```

The datasourceMessageHandler is a callback function through which all messages from the Vuu server will be routed. It is described below.
The `range` property is important. Vuu provides a movable 'window' into the full serverside dataset. The UI sends `range` to inform the server of the subset of data rows that are currently visible in the UI. If the user scrolls through data, in a DataGrid component for example, updates to the range are sent to the server, which responds with the corresponding data. `range` will be explored in more detail later, when client side data caching is described.

The configuration options that define the data to be loaded are as follows (other configuration options will be described further below):

<table>
<tr><th>Property</th><th>Description</th></tr>
<tr><td>aggregations</td><td>describe how to aggregate values when grouping is in effect</td></tr>
<tr><td>columns</td><td>the set of columns for which client wants to to receive data </td></tr>
<tr><td>filter</td><td>describe any filter(s) to apply to data</td></tr>
<tr><td>groupBy</td><td>if grouping is to be applied to data, describe the columns that should be grouped</td></tr>
<tr><td>range</td><td>the range of data rows currently visible in a scrollable UI</td></tr>
<tr><td>sort</td><td>the list of columns by which data should be sorted</td></tr>
</table>

A few points to understand about the above two code shippets. No interaction with the server happens when the RemoteDataSource itself is created, it simply stores the details provided. Configuration options can be passed either via the `DataSource` constructor or via the `subscribe` method call. The `subscribe` method is asynchronous. It doesn't return a useful result. Rather, messages will be passed to the client via the `datasourceMessageHandler` callback.

The call to `connectToServer` described above must succeed before any subscription will be opened. There is no requirement for the client to manage the sequencing of these operations - if calls are made to `subscribe` before the connection has been opened to the server (or even before `connectToServer` has been called), the `subscribe` calls will block until `connectToServer` is called and the connection is open.

## dataSource.subscribe

When a client calls `subscribe`, a `CREATE_VP` message is sent to the Vuu server. The Vuu server will create a `Viewport` to handle all subsequent interaction on this subscription. A `Viewport` is a lightweight data structure that manages client access to an underlying data table. There is a one-to-one relationship between a server `Viewport` and a client subscription. The `Viewport` is a set of indices that reflect the configuration options provided by the client subscription - sorting, filtering, grouping etc. These indices store pointers to data rows in the underlying data table. Whereas the `Viewport` is unique to a single client subscription, the underlying data tables are shared across all subscriptions and all clients.

One of the key features of Vuu is that it can manage large data tables, but sends to the client only the data currently visible in the browser viewport. If offers a virtualized window into a larger dataset. The `range` value sent by the client drives this. The server will only send data to a client when a `range` is provided and will only send the data rows that correspond to that range. It is only when a range of rows is prepared for delivery to the client that data is loaded from the underlying table, using the indices that comprise the `Viewport`.

## further subscribe options
