# What is a View (Vuu) Server

A View Server is a component in a computer system which allows you to track state and potentially off-load some 
of the processing cost of the UI on to the server. 

Typically many users can connect into a single view server, and data which is being used by them can be shared rather than distinct copies. 

View Servers offer some or all of these features to a UI:

* **View Porting** - The Server maintains a full set of data for the client. When a client has a large grid open on their 
screen they are passed only the data that is visible (plus a bit extra at the top and bottom for performance), not the entire data set. When the 
client then scrolls through this data it appears it's all on the client but is in reality being streamed from the server.
Updates to the client's data (view port) are propagated as they happen. Server side viewports can offer:
  * **Filtering & Sorting** of the data, as if it were on the client. 
  * **Treeing and Aggregations** on columns within viewports
* **Remote Procedure Calls** - When a client wants to effect change in the outside world they need a place to host business
logic. This business logic potentially needs access to the whole set of data within the server itself. As the client only has its viewport
onto this data, it is poorly suited to do that. RPC calls are a way of hosting logic that a client can call.
* **Joining Data** - When data comes from different sources, example stock prices verses stock reference data, we often want to join that data together
and present it as a single table/single grid at runtime. 
* **Storing of UI State** - When a client changes how her UI is configured, the view server typically offers a mechanism to persist that state. 

Happily Vuu offers all of these features. 

## What Vuu Is:

* A mechanism for representing ticking external data in table form on the server
* A relational algebra function for joining tables on server at runtime, including linking parent child tables
* A viewporting layer for giving clients a virtualized view onto large tables
* A filter (ANTLR grammar) and sort within viewports
* A "fast path" for updating ticking data to the client
* A "slow path" for updating viewport contents via separate threads
* A treeing and aggregation mechanism (showing totals, averages etc..)
* A highly performant React based Grid implementation and layout framework
* A websocket based wire protocol for handling viewport changes
* An RPC framework for invoking CRUD style operations on the server from the client 

## What Vuu is not:

* A UI Widget framework
* A client side UI Framework
* An alternative to Tomcat/Websphere
* A portal framework
* A data distribution or store and forward technology like Kafka or MQ

## When should I use Vuu?

* If you want to develop a highly functional largely grid based app
* Where your data neatly fits into a table like paradigm
* Where you want to target html5 technologies
* Where you want updates to trigger directly through to client when they occur in the outside world 
