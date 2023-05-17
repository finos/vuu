# RPC Calls

## Menu Items

Menu items encapsulate behaviour that we expose in a UI component at runtime in a generic way. UI components can be authored (the Vuu DataTable is an example) such that they offer these commands to the user with no client-side configuration required nor any knowledge of the Menu items themselves or their structure. That is all determnined server-side. Context Menus are used to present Menu items to users. Alternative UI implementations are possible, but would require some custom UI work, Context Menus are assumed in the explanations that follow.

The Menu items available for a given ViewPort can be queried with a `GET_VIEW_PORT_MENUS` message and are returned in a `VIEW_PORT_MENUS_RESP` response. The UI client issues this request for every ViewPort created (on receipt of the `CREATE_VP_SUCCESS` message).

Menu items have a concept of `context` which helps determine whether of not a particular Menu item should be included in a Menu when a user opens a Context Menu from a given location within the UI. The `context` also determines how the UI handles the Menu item when clicked by the user. When a Menu item is clicked, the UI will send a message to the server. The type and payload of this message is determined by the context.
It is the responsibility of the UI to build the Context Menu (or other UI componentry to expose Menu items) with an appropriate treatment of `context` that takes into account the UI location clicked by user. The Vuu client packages provide such an implementation, using the Vuu ContextMenu component. The Vuu Table component has this behaviour built-in.

Currently, four context values are supported, each Menu item must use one of these context values:

- `table`: Menu item will send a `VIEW_PORT_MENU_TABLE_RPC` message to server, no payload
- `row`: Menu item will send a `VIEW_PORT_MENU_ROW_RPC` message to server, payload includes row clicked
- `cell`: Menu item will send a `VIEW_PORT_MENU_CELL_RPC` message to server, payload includes row and column clicked
- `selected-rows`: Menu item will send a `VIEW_PORT_MENU_SELECT_RPC` message to server. No payload, server knows which rows are selected

Menu items are defined on the server, alongside the table definition in the module, per the following example:

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

| Aggregate Type            | Description                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| SelectionViewPortMenuItem | Passes the selected rows back to rpc service                                                            |
| CellViewPortMenuItem      | Passes the value in an individual cell                                                                  |
| TableViewPortMenuItem     | Passes no context other than the fact we're in this table                                               |
| RowViewPortMenuItem       | Passes the content of a row, not this need not be the selected row and may not exist in the grid at all |

## User interaction with Menu Items

Each Menu item has a unique `rpcName`. When the user clicks a Menu item in the UI, a `VIEW_PORT_MENU_<context>_RPC` message should be sent to the server, together with this rpcName and the appropriate payload. The server will respond with a `VIEW_PORT_MENU_RESP` message and an `action`. Many Menu items will trigger behaviour on the server which require no further input from the user. In these cases, the `action` returned with the menu response will be `NO_ACTION`.

Menu items may require further input from the user. This can be entirely managed from the server, using a [Session Table](../providers_tables_viewports//tables.md). There is an example of this interaction in the default installation of Vuu in the `EDITABLE` module. This can be tested in the UI by adding the EDITABLE.Process table to a workspace, selecting a row and invoking the `Admin/Reset SeqNum` menu action.

this works as follows:

When user clicks this Menu item, server is sent a `VIEW_PORT_MENUS_SELECT_RPC` message with the rpcName `OPEN_EDIT_RESET_FIX`. The server will create a Session table to manage the data that the user will be invited to edit. In the case of this example they will just edit the sequence number. Having created the Session Table, the server will respond with a `VIEW_PORT_MENU_RESP` message which will include an action that looks something like the following:

```json
{
  "type": "OPEN_DIALOG_ACTION",
  "table": {
    "table": "session:ClientSessionId(SESS-4f10bbdb-d634-4360-9252-47418ee503a7,user)/simple-fixSequenceReset_1684329685192",
    "module": "EDITABLE"
  },
  "renderComponent": "inline-form"
}
```

This is an instruction to the UI to show an input form to the user to capture data. Whatever UI is displayed should be bound to the Session table provided. In other words, an editable view should be opened on this table and any edits performed by the user shoule be communicated to the server.
The `renderComponent` attribute provides a hint to the UI to help it decide what kind of UI component to use for this. The default would be an editable DataTable. Here, we indicate that some kind of Form should be used. This could also be used to specify a more custom UI component, eg a Trading Ticket or custom Form.

The following RPC messages can be employed by the UI to communicate data edits to the server

- VP_EDIT_CELL_RPC
- VP_EDIT_ROW_RPC
- VP_EDIT_ADD_ROW_RPC
- VP_EDIT_DELETE_CELL_RPC
- VP_EDIT_DELETE_ROW_RPC

When the user has finished editing data, they will submit the work, a `VP_EDIT_SUBMIT_FORM_RPC` message communicates this to the server. The server will then perform whatever business functionality is appropriate, using the edited data and terminate the workflow with one of either `VP_EDIT_RPC_SUCCESS` ??? or `VP_EDIT_RPC_REJECT`, according to the outcome. Although the example used manages edits to just one column/attribute, this approach can scale to editing much larger data structures.

The server code that manages the Session table will look something like the following example (from the EDITABLE module)

from the EDITABLE module definition, we include the definition of the Session Table needed for editing ...

```scala
      .addTable(
        TableDef(
          name = "process",
          keyField = "id",
          columns = Columns.fromNames("id".string(), "name".string(), "uptime".long(), "status".string()),
          VisualLinks(),
          joinFields = "id"
        ),
        (table, vs) => new ProcessProvider(table),
        (table, _, _, tableContainer) => ViewPortDef(
          columns = table.getTableDef.columns,
          service = new ProcessRpcService(tableContainer)
        )
      ).addSessionTable(
      SessionTableDef(
        name = "fixSequenceReset",
        keyField = "process-id",
        columns = Columns.fromNames("process-id:String", "sequenceNumber:Long")
      ),
      (table, _, _, _) => ViewPortDef(
        columns = table.getTableDef.columns,
        service = new FixSequenceRpcService()
      )
```

the ProcessRpcService referenced above is defined as follows ...

```scala
class ProcessRpcService(val tableContainer: TableContainer)(implicit clock: Clock) extends RpcHandler{

  private final val FIX_SEQ_RESET_TABLE = "fixSequenceReset"

  private def openEditSeqNum(selection: ViewPortSelection, session: ClientSessionId): ViewPortAction = {

    val baseTable = tableContainer.getTable(FIX_SEQ_RESET_TABLE)

    val sessionTable = tableContainer.createSimpleSessionTable(baseTable, session)

    val row = selection.rowKeyIndex.keys.map(selection.viewPort.table.pullRow(_)).toList.head

    val processId = row.get("id").toString

    sessionTable.processUpdate(processId, RowWithData(processId, Map("process-id" -> processId, "sequenceNumber" -> 0)), clock.now())

    OpenDialogViewPortAction(ViewPortTable(sessionTable.name, sessionTable.tableDef.getModule().name), RenderComponent.InlineForm)
  }

  override def menuItems(): ViewPortMenu = ViewPortMenu("Admin",
    new SelectionViewPortMenuItem("Reset SeqNum", "", this.openEditSeqNum, "OPEN_EDIT_RESET_FIX")
  )
}
```

and, finally, the FixSeqenceRpcService

```scala
class FixSequenceRpcService(implicit clock: Clock) extends RpcHandler with EditRpcHandler{

  def onDeleteRow(key: String, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    ViewPortEditSuccess()
  }

  def onDeleteCell(key: String, column: String, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    ViewPortEditSuccess()
  }

  def onAddRow(key: String, data: Map[String, Any], vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    ViewPortEditSuccess()
  }

  private def onEditCell(key: String, columnName: String, data: Any, vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    val table = vp.table.asTable
    table.processUpdate(key, RowWithData(key, Map(columnName -> data)), clock.now())
    ViewPortEditSuccess()
  }

  private def onEditRow(key: String, row: Map[String, Any], vp: ViewPort, session: ClientSessionId): ViewPortEditAction = {
    val table = vp.table.asTable
    table.processUpdate(key, RowWithData(key, row), clock.now())
    ViewPortEditSuccess()
  }

  private def onFormSubmit(vp: ViewPort, session: ClientSessionId): ViewPortAction = {
    val table = vp.table.asTable
    val primaryKeys = table.primaryKeys
    val headKey = primaryKeys.head
    val sequencerNumber = table.pullRow(headKey).get("sequenceNumber").asInstanceOf[Long]

    if (sequencerNumber > 0) {
      logger.info("I would now send this fix seq to a fix engine to reset, we're all good:" + sequencerNumber)
      CloseDialogViewPortAction(vp.id)
    } else {
      logger.error("Seq number not set, returning error")
      ViewPortEditFailure("Sequencer number has not been set.")
    }
  }

  private def onFormClose(vp: ViewPort, session: ClientSessionId): ViewPortAction = {
    CloseDialogViewPortAction(vp.id)
  }

  override def deleteRowAction(): ViewPortDeleteRowAction = ViewPortDeleteRowAction("", this.onDeleteRow)
  override def deleteCellAction(): ViewPortDeleteCellAction = ViewPortDeleteCellAction("", this.onDeleteCell)
  override def addRowAction(): ViewPortAddRowAction = ViewPortAddRowAction("", this.onAddRow)
  override def editCellAction(): ViewPortEditCellAction = ViewPortEditCellAction("", this.onEditCell)
  override def editRowAction(): ViewPortEditRowAction = ViewPortEditRowAction("", this.onEditRow)
  override def onFormSubmit(): ViewPortFormSubmitAction = ViewPortFormSubmitAction("", this.onFormSubmit)
  override def onFormClose(): ViewPortFormCloseAction = ViewPortFormCloseAction("", this.onFormClose)
}

```
