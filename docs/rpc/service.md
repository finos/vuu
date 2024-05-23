import { SvgDottySeparator } from "@site/src/components/SvgDottySeparator";

# RPC Services

<SvgDottySeparator style={{marginBottom: 32}}/>

The best way to describe service rpc calls is with an example. In the default React grid for Vuu, we have the filter
component. The filter uses an ANTLR  grammar for defining how we want to filter the data. Examples of how we use this are:

```
ric = AAA.L
//or
exchange in [XLON, XAMS, NYSE]
```

You may have noticed when you type in the filter in the grid you get a typeahead hint for the available values. If I had
typed "exchange in [" the UI offers up to 10 values based on the contents of the tables.

These suggestions are implemented as an RPC service within the type ahead module:

```scala

object TypeAheadModule extends DefaultModule {

  final val NAME = "TYPEAHEAD"

  def apply()(implicit clock: Clock, lifecycle: LifecycleContainer): ViewServerModule = {
    ModuleFactory.withNamespace(NAME)
      .addRpcHandler(server => new GenericTypeAheadRpcHandler(server.tableContainer))
      .asModule()
  }
}
```

You can see we've defined an RpcHandler called GenericTypeAheadRpcHandler, which implements the interface:

```scala
trait TypeAheadRpcHandler{
  def getUniqueFieldValues(tableMap: Map[String, String], column: String, ctx: RequestContext): Array[String]
  def getUniqueFieldValuesStartingWith(tableMap: Map[String, String], column: String, starts: String, ctx: RequestContext): Array[String]
}
```

These two calls are called by the search bar when it is trying to get a list of unique values within a column in a table on the server.

The calling of these rpc calls is specifically coded into the React control as behaviour. Then these modules allow us the aility to call it without
having to interfere with the core of the server.
