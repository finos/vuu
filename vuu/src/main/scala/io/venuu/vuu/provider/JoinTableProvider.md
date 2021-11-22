# Join Table Provider

## Description

The join table provider takes update or delete events from data tables (either SimpleDataTables aka normal sinks) or join tables
and sends them on to join tables which listen on them. 

##The Input Interface

The main interface for the join provider is below

```scala
def sendEvent(tableName: String, ev: java.util.HashMap[String, Any]): Unit
```

This takes a specific event for a table, (example "orders") and emits it to join tables that are composed of that table 
*directly*. The last point is important when we discuss joins of join tables below. 

Below is an example of data inbound from the SimpleDataTable "orders" and the output which is sent on to the table 
"orderPrices."

###Input:
```
tableName = "orders"

ev = {\ 
    "orderId" -> "1"
    "_isDeleted" -> {Boolean@2626} false
    "ric" -> "VOD.L"
    \} 
```
###Output:
Output is put onto the outputQueue in the joinManager
```
RowWithData:
data = {HashMap@2665} "HashMap" size = 5
     0 = {Tuple2@3183} "(orders.orderId,1)"
     1 = {Tuple2@3184} "(prices._isDeleted,null)"
     2 = {Tuple2@3185} "(orders.ric,VOD.L)"
     3 = {Tuple2@3186} "(prices.ric,null)"
     4 = {Tuple2@3187} "(orders._isDeleted,false)"
```

This output is then consumed by the JoinTable Implementation in this format, what the join table is trying to build up 
is the array of the keys that the join is composed of, and the way this is consumed is by loading the keys by qualifed 
name.

see io/venuu/vuu/core/table/JoinTable.scala:116

```scala
  def rowUpdateToArray(update: RowWithData): Array[Any] = {
    //val data    = columns.map(update.get(_))

    var index = 0
    val result = Array.ofDim[Any](columns.length)

    while (index < columns.length) {
      val column = columns(index)

      val data = update.getFullyQualified(column)

      result(index) = data

      index += 1
    }

    result
  }
```
We end up with a data structure like this within the join table:
```
[
    ["1", "VOD.L", "GBPUSD"],
    ["2", "VOD.L", "GBPUSD"],
    ["3", "VOD.L", "GBPUSD"]
]
```
##Joins of Joins

With joins of joins we need to propagate updates as if they have been created by the last table that consumed them, for 
example, if we have the join tables:

```
orderPrices     (this is the join of orders & prices)
orderPricesFx   (this is the join of orderPrices, a join table itself and Fx rates)
```

The join events going into orderPrices look exactly like the example above. The input for orderPrices is subtly different though.

###Input:
```
tableName = "orderPrices"

ev = {\ 
    "orderId" -> "1"
    "_isDeleted" -> {Boolean@2626} false
    "ric" -> "VOD.L"
    \} 
```
###Output:
Output is put onto the outputQueue in the joinManager. 
```
RowWithData:
data = {HashMap@2665} "HashMap" size = 5
     0 = {Tuple2@3183} "(ordersPrices.orderId,1)"
     1 = {Tuple2@3184} "(ordersPrices._isDeleted,null)"
     2 = {Tuple2@3185} "(ordersPrices.ric,VOD.L)"
     3 = {Tuple2@3186} "(fx.cross,null)"
     4 = {Tuple2@3187} "(fx._isDeleted,false)"
```

What this means is that the event emitted into the join manager from an existing join table has to rebadge the event as from itself, not from 
the original source.