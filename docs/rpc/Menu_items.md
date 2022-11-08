# Menu Items

Menu items are behaviour that we want to add to a grid at runtime without changing the Grid (or other) controls in any way.

Menu items are passed down to the UI when a viewport is opened. They are defined in the table definition in the module in the following way: 

```scala
      .addTable(
        AutoSubscribeTableDef(
          name = "prices",
          keyField = "ric",
          Columns.fromNames("ric".string(), "bid".double(), "bidSize".int(), "ask".double(), "askSize".int(),
                            "last".double(), "open".double(), "close".double(), "scenario".string(), "phase".string()),
          joinFields = "ric"
        ),
        (table, vs) => new SimulatedPricesProvider(table, maxSleep = 800),
        //this callback explicitly adds behaviour to the menu items
        (table, provider, providerContainer) => ViewPortDef(
          columns = table.getTableDef.columns,
          service = new PricesService(table, provider)
        )
      )
```
You can see in the definition of the prices table below the provider, there is an additional section ViewPortDef()
This allows us to specify a service we want to be associated with the viewport. This service is behaviour we're adding
to the default viewport/grid. 

Looking at the definition of the service you can see: 

```scala 
class PricesService(val table: DataTable, val provider: Provider) extends RpcHandler with StrictLogging {

  private val pricesProvider = provider.asInstanceOf[SimulatedPricesProvider]

  def setSpeedSlow(selection: ViewPortSelection, sessionId: ClientSessionId):ViewPortAction = {
    pricesProvider.setSpeed(8000)
    NoAction()
  }

  def setSpeedMedium(selection: ViewPortSelection, sessionId: ClientSessionId):ViewPortAction = {
    pricesProvider.setSpeed(2000)
    NoAction()
  }

  def setSpeedFast(selection: ViewPortSelection, sessionId: ClientSessionId):ViewPortAction = {
    pricesProvider.setSpeed(400)
    NoAction()
  }

  override def menuItems(): ViewPortMenu = ViewPortMenu("Root",
      new SelectionViewPortMenuItem("Set Slow", "", this.setSpeedSlow, "SET_SPEED_SLOW"),
      new SelectionViewPortMenuItem("Set Medium", "", this.setSpeedMedium, "SET_SPEED_MED"),
      new SelectionViewPortMenuItem("Set Fast", "", this.setSpeedFast, "SET_SPEED_FAST")
  )
}
```

That there is a callback to define Menu Items, which returns three options, set Slow, Set Medium, Set Fast. 
The other interesting point is that the MenuItems are typed to SelectionViewPortMenuItem's. 

Looking at the method signature you can see that all the calls are off the form: 

```scala
def setSpeedSlow(selection: ViewPortSelection, sessionId: ClientSessionId):ViewPortAction
```

Where the ViewPortSelection is passed in. 

What this means in practice is that these options are only displayed when a row is selected, and when a menu item is clicked
the server is passed the details of which row(s) are selected. 

In this case, we don't do anything with the data, however you could image that this might be a delete record type interaction
where knowing the row that we want to delete is key. 

The other options we have for typing the calls are:

```scala
@JsonIgnoreProperties(Array("func", "menus"))
class SelectionViewPortMenuItem(override val name: String, filter: String, val func: (ViewPortSelection, ClientSessionId) => ViewPortAction, rpcName: String) extends ViewPortMenuItem(name, filter, rpcName) {
  val context: String = "selected-rows"
}

@JsonIgnoreProperties(Array("func", "menus"))
class CellViewPortMenuItem(override val name: String, filter: String, val func: (String, String, Object, ClientSessionId) => ViewPortAction, rpcName: String) extends ViewPortMenuItem(name, filter, rpcName) {
  val context: String = "cell"
}

@JsonIgnoreProperties(Array("func", "menus"))
class TableViewPortMenuItem(override val name: String, filter: String, val func: (ClientSessionId) => ViewPortAction, rpcName: String) extends ViewPortMenuItem(name, filter, rpcName) {
  val context: String = "grid"
}

@JsonIgnoreProperties(Array("func", "menus"))
class RowViewPortMenuItem(override val name: String, filter: String, val func: (String, Map[String, AnyRef], ClientSessionId) => ViewPortAction, rpcName: String) extends ViewPortMenuItem(name, filter, rpcName) {
  val context: String = "row"
}
```

You can see from the method signatures they each have a specific purpose: 


| Aggregate Type | Description                                                                                           |
|----------------|-------------------------------------------------------------------------------------------------------|
| SelectionViewPortMenuItem   | Passes the selected rows back to rpc service                                                          |
| CellViewPortMenuItem        | Passes the value in an individual cell                                                                |
| TableViewPortMenuItem       | Passes no context other than the fact we're in this table                                             |
| RowViewPortMenuItem         | Passes the content of a row, not this need not be the selected row and may not exist in the grid at all |







