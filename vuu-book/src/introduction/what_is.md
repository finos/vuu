# What is a View (Vuu) Server

A View Server is a component in a computer system which allows you to track state and potentially off-load some 
of the processing cost of the UI on to the server. 

Typically, View Servers offer some or all of these features to a UI:

* **View Porting** - The Server maintains a full set of data for the client. When a client has a large grid open on their 
screen they are passed only the data that is visible (plus a bit extra at the top and bottom for performance), not the entire data set. When the 
client then scrolls through this data it appears it's all on the client but is in reality being streamed from the server.
Updates to the clients data (view port) are propogated as they happen. Server side view ports typically offer:
  * Filtering & Sorting of the data, as if it were on the client. 
  * Treeing and Aggregations on columns within viewports
* **Remote Procedure Calls** - When a client wants to effect change in the outside world they need a place to host business
logic. This business logic potentially needs access to the whole set of data within the server itself, as the client only has its viewport
onto this data, it is poorly suited to do that. RPC calls are a way of hosting logic that a client can call.
* **Joining Data** - When data comes from different sources, example stock prices verses stock reference data, we often want to join that data together
and present it as a single table/single grid at runtime. 
* **Storing of UI State** - When a client changes how her UI is configured, the view server typically offers a mechanism to persist that state. 

Happily Vuu offers all of these features. 

