# Modules

Modules are how you describe the tables, providers and rpc calls that you want to add to Vuu. They are intended to be logical groupings of functionality that can be shared. 

##How to define a module

The best place to start with defining a module is to look at the existing ones provided in the core infra. 

##An example module definition:

```scala
object VuiStateModule extends DefaultModule {

  final val NAME = "vui"

  def apply(store: VuiStateStore)(implicit clock: Clock, lifecycle: LifecycleContainer): ViewServerModule = {

    ModuleFactory.withNamespace(NAME)
      .addTable(
        TableDef(
          name = "uiState",
          keyField = "uniqueId",
          columns = Columns.fromNames("uniqueId".string(), "user".string(), "id".string(), "lastUpdate".long()),
          VisualLinks(),
        ),
        (table, vs) => new VuiStateStoreProvider(table, store)
      )
      .addRestService(_ => new VuiStateRestService(store))
      .asModule()
  }
}
```

Above is the module which provides storage and retrieval of UI state across sessions. As you can see there are a few key things that you need to provide when adding a module. 

1. Name - This is a unique name in the deployment
2. An apply function that defines zero or more tables, providers, rest services, rpc services etc..

In this example we define 1 table, "uiState", with the primary key "uniqueId." we also have three additional fields "user", "id" and "lastUpdate". 

The provider as discussed in a previous section, is responsible from sourcing data from somewhere and inserting the data or removing the data from the data table. 

If you look at the source code for the provider you can see that it uses a utility class VuiStateStore to retrieve the versions of the UI that have been saved. It also stores a magic
head state which is the current live state. 

```scala
class VuiStateStoreProvider(val table: DataTable, val store: VuiStateStore)(implicit clock: Clock, lifecycleContainer: LifecycleContainer) extends Provider {

  private final val runner = new LifeCycleRunner("vuiStateStoreProviderRunner", () => runOnce(), minCycleTime = 10)
  override val lifecycleId: String = "vuiStateStoreProvider"
  @volatile
  private var lastState = List[VuiHeader]()

  def runOnce() = {

    val states = store.getAll()

    for(state <- states){

      table.processUpdate(state.uniqueId, RowWithData( state.uniqueId, Map("uniqueId" ->  state.uniqueId,
        "user" -> state.user,
        "id" -> state.id,
        "lastUpdate" -> state.lastUpdate )
      ),
        clock.now()
      )
    }

    for(oldState <- lastState){
      if(!states.contains(oldState)){
        table.processDelete(oldState.uniqueId)
      }
    }
v
    lastState = states
  }

  override def subscribe(key: String): Unit = {}
  override def doStart(): Unit = {}
  override def doStop(): Unit = {}
  override def doInitialize(): Unit = {}
  override def doDestroy(): Unit = {}
}
```

In the module we also define a rest service. This is how the UI interacts with the state store. THe rest service is exposed via the underlying Vert.x
infrastructure. 

```scala
class VuiStateRestService(val store: VuiStateStore)(implicit clock: Clock) extends RestService {

  private final val service = "vui"

  override def getServiceName: String = service
  override def getUriGetAll: String = s"/api/$service/:user"
  override def getUriGet: String = s"/api/$service/:user/:id"
  override def getUriPost: String = s"/api/$service/:user"
  override def getUriDelete: String = s"/api/$service/:user/:id"
  override def getUriPut: String = s"/api/$service/:user/:id"

  override def onGetAll(ctx: RoutingContext): Unit = {
    val user = ctx.request().getParam("user")
    if(user == null){
      reply404(ctx)
    }else{
      val states = store.getAllFor(user)
      val json = JsonUtil.toPrettyJson(states)
      ctx.response()
        .putHeader("content-type", "application/json; charset=utf-8")
        .end(json)
    }
  }

  override def onPost(ctx: RoutingContext): Unit = {
    val user = ctx.request().getParam("user")
    val id   = "latest"
    val json = ctx.getBodyAsString()

    if(user == null || id == null || json == null){
      reply404(ctx)
    }else{
      store.add(VuiState(VuiHeader(user, id, user + "." + id, clock.now()), VuiJsonState(json)))
      ctx.response()
        .setStatusCode(201)
        .putHeader("content-type", "application/json; charset=utf-8")
        .end(json);
    }
  }

  override def onGet(ctx: RoutingContext): Unit = {
    val user = ctx.request().getParam("user")
    val id   = ctx.request().getParam("id")
    if(user == null || id == null){
      ctx.response().setStatusCode(404).end()
    }else{
      store.get(user, id) match {
        case Some(state) =>
          ctx.response()
            .putHeader("content-type", "application/json; charset=utf-8")
            .end(state.json.json);
        case None =>
          reply404(ctx)
      }
    }
  }

  override def onPut(ctx: RoutingContext): Unit = {
    val user = ctx.request().getParam("user")
    val id   = ctx.request().getParam("id")
    val json = ctx.getBodyAsString()
    if(user == null || id == null || json == null){
      reply404(ctx)
    }else{
      store.add(VuiState(VuiHeader(user, id, user + "." + id, clock.now()), VuiJsonState(json)))
      ctx.response()
        .setStatusCode(201)
        .putHeader("content-type", "application/json; charset=utf-8")
        .end(json);
    }
  }

  override def onDelete(ctx: RoutingContext): Unit = {
    val user = ctx.request().getParam("user")
    val id   = ctx.request().getParam("id")
    if(user == null || id == null){
      reply404(ctx)
    }else{
      store.delete(user, id)
      ctx.response.setStatusCode(204).end()
    }
  }
}


```

So you can see from this example we have:

1. A storage mechanism, the VuiStateStore
2. An update and retrieve mechanism, via the REST service. 
3. A table definition, that exposes the state store to the UI via the table mechanism. In this case this is largely for auditing purposes. 

From here we can move onto to a ore complicated example. 