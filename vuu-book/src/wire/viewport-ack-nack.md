# Viewport Ack-Nack

When using viewports there are certain requirements to be aware of in the protocol. This is especially important when a 
change in viewport results in a substantial change in the structure of the data returned, for example switching from
non-tree'd to tree'd data and vice versa. 

## The Problem:

The Vuu server is heavily asynchronous internally, so when making changes to a viewport you may get out of date changes coming 
down the websocket before a change has been ack'd nack'd by the view server. 

As such we need a contract as to how we should handle updates to a viewport which may no longer be valid. 

The rules are:

1. When you submit a viewport change request (CHANGE_VP msg), the request id on the message functions like a version number. 
2. All updates should be ignored on the wire until a CHANGE_VP_SUCCESS or CHANGE_VP_REJECT has been received for your requestId.
3. Any subsequent updates that are received for your vpId which have a different version to the ACK/NACK'd one should be dropped.

## Sample Flow:

Success Case: 
```json
IN: {"requestId":"1234","sessionId":"f17ba634-3f52-400a-9d94-af667cfa9097","token":"6ae37e02-e89c-4223-9801-e57547fe772f","user":"user","body":{"type":"CHANGE_VP","viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","columns":["ask","askSize","bid","bidSize","close","last","open","phase","ric","scenario"],"sort":{"sortDefs":[]},"groupBy":["ric"],"filterSpec":null,"aggregations":[]},"module":"CORE"}
//1233 was the last version, this update should be dropped
OUT: {"requestId":"1233","sessionId":"f17ba634-3f52-400a-9d94-af667cfa9097","token":"","user":"user","body":{"type":"TABLE_ROW","batch":"fed5b89f-dbf3-471f-b25d-893b6da8721c","isLast":true,"timeStamp":1639988606160,"rows":[{"viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","vpSize":68794,"rowIndex":96,"rowKey":"ALK.N","updateType":"U","ts":1639988606160,"sel":0,"data":[540.35,1800,535.0,1800,"",642.32,"","C","ALK.N","walkBidAsk"]},{"viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","vpSize":68794,"rowIndex":106,"rowKey":"ALK.A","updateType":"U","ts":1639988606160,"sel":0,"data":[540.35,1800,535.0,1800,"",642.32,"","C","ALK.A","walkBidAsk"]},{"viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","vpSize":68794,"rowIndex":111,"rowKey":"ALK.L","updateType":"U","ts":1639988606160,"sel":0,"data":[540.35,1800,535.0,1800,"",558.49,"","C","ALK.L","walkBidAsk"]},{"viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","vpSize":68794,"rowIndex":136,"rowKey":"ACQ.A","updateType":"U","ts":1639988606160,"sel":0,"data":[409.05,1400,405.0,1400,"",642.32,"","C","ACQ.A","fastTick"]}]},"module":"CORE"}
//ACK the VP change, we're all good
OUT: {"requestId":"1234","sessionId":"f17ba634-3f52-400a-9d94-af667cfa9097","token":"6ae37e02-e89c-4223-9801-e57547fe772f","user":"user","body":{"type":"CHANGE_VP_SUCCESS","viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","columns":["ask","askSize","bid","bidSize","close","last","open","phase","ric","scenario"],"sort":{"sortDefs":[]},"groupBy":["ric"],"filterSpec":null},"module":"CORE"}
//this update should be used
OUT: {"requestId":"1234","sessionId":"f17ba634-3f52-400a-9d94-af667cfa9097","token":"","user":"user","body":{"type":"TABLE_ROW","batch":"9f507f7c-24ea-4287-9dd2-01e61b6e8f70","isLast":true,"timeStamp":1639988606280,"rows":[{"viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","vpSize":68794,"rowIndex":127,"rowKey":"AHX.N","updateType":"U","ts":1639988606280,"sel":0,"data":[452.12,1500,428.0,1500,"",447.12,"","C","AHX.N","fastTick"]},{"viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","vpSize":68794,"rowIndex":129,"rowKey":"AHX.A","updateType":"U","ts":1639988606280,"sel":0,"data":[457.12,1500,433.0,1500,"",452.12,"","C","AHX.A","fastTick"]},{"viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","vpSize":68794,"rowIndex":131,"rowKey":"AHX.L","updateType":"U","ts":1639988606280,"sel":0,"data":[419.38,700,307.0,700,"",415.38,"","C","AHX.L","walkBidAsk"]}]},"module":"CORE"}
```

Reject Case:
```json
IN: {"requestId":"1234","sessionId":"f17ba634-3f52-400a-9d94-af667cfa9097","token":"6ae37e02-e89c-4223-9801-e57547fe772f","user":"user","body":{"type":"CHANGE_VP","viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","columns":["ask","askSize","bid","bidSize","close","last","open","phase","ric","scenario"],"sort":{"sortDefs":[]},"groupBy":["ric"],"filterSpec":null,"aggregations":[]},"module":"CORE"}
//1233 was the last version, this update should be dropped
OUT: {"requestId":"1233","sessionId":"f17ba634-3f52-400a-9d94-af667cfa9097","token":"","user":"user","body":{"type":"TABLE_ROW","batch":"fed5b89f-dbf3-471f-b25d-893b6da8721c","isLast":true,"timeStamp":1639988606160,"rows":[{"viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","vpSize":68794,"rowIndex":96,"rowKey":"ALK.N","updateType":"U","ts":1639988606160,"sel":0,"data":[540.35,1800,535.0,1800,"",642.32,"","C","ALK.N","walkBidAsk"]},{"viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","vpSize":68794,"rowIndex":106,"rowKey":"ALK.A","updateType":"U","ts":1639988606160,"sel":0,"data":[540.35,1800,535.0,1800,"",642.32,"","C","ALK.A","walkBidAsk"]},{"viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","vpSize":68794,"rowIndex":111,"rowKey":"ALK.L","updateType":"U","ts":1639988606160,"sel":0,"data":[540.35,1800,535.0,1800,"",558.49,"","C","ALK.L","walkBidAsk"]},{"viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","vpSize":68794,"rowIndex":136,"rowKey":"ACQ.A","updateType":"U","ts":1639988606160,"sel":0,"data":[409.05,1400,405.0,1400,"",642.32,"","C","ACQ.A","fastTick"]}]},"module":"CORE"}
//ACK the VP change, we're all good
OUT: {"requestId":"1234","sessionId":"f17ba634-3f52-400a-9d94-af667cfa9097","token":"6ae37e02-e89c-4223-9801-e57547fe772f","user":"user","body":{"type":"CHANGE_VP_REJECT","viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","columns":["ask","askSize","bid","bidSize","close","last","open","phase","ric","scenario"],"sort":{"sortDefs":[]},"groupBy":["ric"],"filterSpec":null},"module":"CORE"}
//this update should be used now, as we've reverted back to 1233, change was rejected
OUT: {"requestId":"1233","sessionId":"f17ba634-3f52-400a-9d94-af667cfa9097","token":"","user":"user","body":{"type":"TABLE_ROW","batch":"9f507f7c-24ea-4287-9dd2-01e61b6e8f70","isLast":true,"timeStamp":1639988606280,"rows":[{"viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","vpSize":68794,"rowIndex":127,"rowKey":"AHX.N","updateType":"U","ts":1639988606280,"sel":0,"data":[452.12,1500,428.0,1500,"",447.12,"","C","AHX.N","fastTick"]},{"viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","vpSize":68794,"rowIndex":129,"rowKey":"AHX.A","updateType":"U","ts":1639988606280,"sel":0,"data":[457.12,1500,433.0,1500,"",452.12,"","C","AHX.A","fastTick"]},{"viewPortId":"user-8e5dbeb5-e0c6-404c-95eb-0548cb8d28fd","vpSize":68794,"rowIndex":131,"rowKey":"AHX.L","updateType":"U","ts":1639988606280,"sel":0,"data":[419.38,700,307.0,700,"",415.38,"","C","AHX.L","walkBidAsk"]}]},"module":"CORE"}
```








