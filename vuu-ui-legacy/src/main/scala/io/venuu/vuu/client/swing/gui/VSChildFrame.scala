package io.venuu.vuu.client.swing.gui

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.api.AvailableViewPortVisualLink
import io.venuu.vuu.client.messages._
import io.venuu.vuu.client.swing.EventBus
import io.venuu.vuu.client.swing.gui.components._
import io.venuu.vuu.client.swing.model.ViewPortedModel
import io.venuu.vuu.net.{SortDef, SortSpec}
import io.venuu.vuu.viewport.ViewPortTable

import java.awt.Dimension
import scala.swing.TabbedPane.Page
import scala.swing._
import scala.swing.event.{ButtonClicked, SelectionChanged}

class VSChildFrame(parentFrame: Frame, sessId: String)(implicit eventBus: EventBus[ClientMessage], timeProvider: Clock) extends Frame with StrictLogging{

  import SwingThread._

  this.preferredSize = new Dimension(1024, 768)

  title = "Child Window"

  val connect = new Button("Login")

  val tablesCombo = new MutableComboBox[ViewPortTable]()
  val columnsCombo = new MutableComboBox[String]()
  val groupByCombo = new MutableMultiSelectComboBox[String](new MutableModel[String])
  val sortByCombo = new MutableMultiSelectComboBox[String](new MutableModel[String])
  val sessionLabel = new Label("Not logged in.")
  val createViewPort = new Button("Create VP")
  val editRpcTableButton = new Button("Edit Rpc")
  val openNewWindow = new Button("New Window")
  val filterTextBox = new TextField()
  var allColumnsAvailable = Array[String]()
  var sessionId: String = sessId

  val linkButton = new Button("Link")
  val unLinkButton = new Button("Unlink")
  val availableLinksCombo = new MutableComboBox[AvailableViewPortVisualLink]()
  val linkChildColumn = new Label("-")
  val linkParentColumn = new Label("-")

  @volatile var viewPortInfo: Option[ClientCreateViewPortSuccess] = None

  swing{ () =>
    eventBus.publish(ClientGetTableList(RequestId.oneNew()))
    enableControls(sessionId)
  }

  override def closeOperation(): Unit = {
    viewPortInfo match {
      case Some(vpInfo) =>
        eventBus.publish(ClientRemoveViewPort(RequestId.oneNew(), viewPortInfo.get.vpId))
      case None =>
        println("Closed before VP Created")
    }
    super.closeOperation()
  }

  def disableControls = {
    createViewPort.enabled = false
    tablesCombo.enabled = false
    editRpcTableButton.enabled = false
    openNewWindow.enabled = true
  }

  def enableControls(sessionId: String) = {
    createViewPort.enabled = true
    tablesCombo.enabled = true
    connect.enabled = false
    sessionLabel.text = sessionId
    editRpcTableButton.enabled = true
    openNewWindow.enabled = true
  }

  def setTablesComboContents(msg: ClientGetTableListResponse): Unit = {
    tablesCombo.items = msg.tables.toSeq
  }

  def setColumnsComboContents(msg: ClientGetTableMetaResponse): Unit = {
    allColumnsAvailable = msg.columns
    columnsCombo.items = Seq("*") ++ msg.columns.toSeq
    columnsCombo.enabled = true
    groupByCombo.setItems(msg.columns)
    sortByCombo.setItems(msg.columns)
  }

  lazy val tabbedPanel = new TabbedPane {
    //pages += new Page("Test", new ViewServerGridPanel())
    //pages += new Page("Test2", new VSGridPanel())
  }

  eventBus.register({
    case msg: LogonSuccess =>
      eventBus.publish(ClientGetTableList(RequestId.oneNew()))
      sessionId = msg.body.sessionId
      swing( () => enableControls(msg.body.sessionId) )
    case msg: ClientCreateViewPortSuccess =>
      viewPortInfo = Some(msg)
      eventBus.publish(ClientGetVisualLinks(RequestId.oneNew(), msg.vpId))
    case msg: ClientGetTableListResponse =>
      swing( () => setTablesComboContents(msg) )
    case msg: ClientGetTableMetaResponse =>
      swing( () => setColumnsComboContents(msg) )
    case msg: ClientGetVisualLinksResponse =>
      swing( () => availableLinksCombo.items = msg.vpLinks )

    case _ =>
  })

  listenTo(`connect`)
  listenTo(`createViewPort`)
  listenTo(`tablesCombo`)
  listenTo(`editRpcTableButton`)
  listenTo(`openNewWindow`)
  listenTo(`linkButton`)

  reactions += {
    case ButtonClicked(`linkButton`) =>
      val link = availableLinksCombo.item
      viewPortInfo match {
        case Some(vpInfo) =>
          eventBus.publish(ClientCreateVisualLink(RequestId.oneNew(), vpInfo.vpId, link.parentVpId, link.link.fromColumn, link.link.toColumn))
        case None =>
          logger.error("No Viewport Registered with Grid, can't create Visual Link")
      }
    case ButtonClicked(`openNewWindow`) =>
      val frame = new VSMainFrame(this.sessionId)
      frame.open()

    case SelectionChanged(`tablesCombo`) =>
      eventBus.publish(ClientGetTableMeta(RequestId.oneNew(), tablesCombo.item))
    case ButtonClicked(`connect`) =>
      eventBus.publish(Logon("chris", "chris"))
    case ButtonClicked(`editRpcTableButton`) =>
      new RpcDataEntry("bar").visible = true
    case ButtonClicked(`createViewPort`) =>
      val table = tablesCombo.item
      //val columns = Array(columnsCombo.item)
      val columns = columnsCombo.items.filter(_ != "*").toArray
      val requestId = RequestId.oneNew()
      val groupBy = groupByCombo.selected.toArray
      val sortBy = sortByCombo.selected.toArray
      val filter = filterTextBox.text

      if(groupBy.size > 0){
        val columnsForTree = Array("RowIndex", "Selected") ++ Array("_depth", "_isOpen", "_treeKey", "_isLeaf", "_caption", "_childCount") ++ columns
        val model = new ViewPortedModel(requestId, columnsForTree)
        model.setRange(0, 100)
        tabbedPanel.pages.+=(new Page(table.table, new ViewServerTreeGridPanel(parentFrame, requestId, table, allColumnsAvailable, columnsForTree, model, groupBy)))
      }
      else{
        val model = new ViewPortedModel(requestId, Array("RowIndex", "Selected") ++ columns)
        model.setRange(0, 100)
        tabbedPanel.pages.+=(new Page(table.table, new ViewServerTreeGridPanel(parentFrame, requestId, table, allColumnsAvailable, Array("RowIndex", "Selected") ++ columns, model, groupBy)))
      }

      val spec = SortSpec(sortBy.map(column => SortDef(column, 'A')).toList)
      eventBus.publish(ClientCreateViewPort(requestId, table, columns, spec, groupBy, 0, 100, filter))
  }

  val buttonPanel = new GridPanel(2, 9){

    contents += new Label("")
    contents += new Label("Tables")
    contents += new Label("Columns")
    contents += new Label("Sort By")
    contents += new Label("Group By")
    contents += new Label("Filter")
    contents += new Label("")
    contents += new Label("")
    contents += new Label("")

    contents += connect
    contents += tablesCombo
    contents += columnsCombo
    contents += sortByCombo
    contents += groupByCombo
    contents += filterTextBox
    contents += createViewPort
    contents += editRpcTableButton
    contents += openNewWindow
  }

  val buttonPanel2 = new GridPanel(1, 9){
    contents += new Label("Link To:")
    contents += availableLinksCombo
    contents += new Label("Child Col:")
    contents += linkChildColumn
    contents += new Label("Parent Col:")
    contents += linkParentColumn
    contents += linkButton
    contents += unLinkButton
    contents += new Label("")
  }

  //val buttonPanel = new FlowPanel(connect, tablesCombo, columnsCombo, createViewPort, testCombo, sessionLabel)

  contents = new BorderPanel {

    import scala.swing.BorderPanel.Position._

    add(buttonPanel2, North)
    add(tabbedPanel, Center)
    add(buttonPanel, South)

  }

  pack()

}
