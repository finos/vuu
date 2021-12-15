/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 06/01/2016.

  */
package io.venuu.vuu.client.swing.gui

import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.swing.EventBus
import io.venuu.vuu.client.swing.gui.components.{MutableComboBox, MutableModel, MutableMultiSelectComboBox}
import io.venuu.vuu.client.swing.messages._
import io.venuu.vuu.client.swing.model.ViewPortedModel
import io.venuu.vuu.net.{SortDef, SortSpec}
import io.venuu.vuu.viewport.ViewPortTable

import java.awt.Dimension
import scala.swing.TabbedPane.Page
import scala.swing._
import scala.swing.event.{ButtonClicked, SelectionChanged}

class VSMainFrame(sessId: String)(implicit eventBus: EventBus[ClientMessage], timeProvider: Clock) extends MainFrame {

  import SwingThread._

  this.preferredSize = new Dimension(1024, 768)

  title = "VS Client"

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

  disableControls

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
      //swing( () => addVpPanel(msg) )
    case msg: ClientGetTableListResponse =>
      swing( () => setTablesComboContents(msg) )
    case msg: ClientGetTableMetaResponse =>
      swing( () => setColumnsComboContents(msg) )

    case _ =>
  })

  listenTo(`connect`)
  listenTo(`createViewPort`)
  listenTo(`tablesCombo`)
  listenTo(`editRpcTableButton`)
  listenTo(`openNewWindow`)

  reactions += {
    case ButtonClicked(`openNewWindow`) =>
      val frame = new VSChildFrame(this, this.sessionId)
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
        val columnsForTree = Array("RowIndex") ++ Array("_depth", "_isOpen", "_treeKey", "_isLeaf", "_caption", "_childCount") ++ columns
        val model = new ViewPortedModel(requestId, columnsForTree)
        model.setRange(0, 100)
        tabbedPanel.pages.+=(new Page(table.table, new ViewServerTreeGridPanel(this, requestId, table, allColumnsAvailable, columnsForTree, model, groupBy)))
      }
      else{
        val model = new ViewPortedModel(requestId, Array("RowIndex") ++ columns)
        model.setRange(0, 100)
        tabbedPanel.pages.+=(new Page(table.table, new ViewServerTreeGridPanel(this, requestId, table, allColumnsAvailable, Array("RowIndex") ++ columns, model, groupBy)))

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

  contents = new BorderPanel {

    import scala.swing.BorderPanel.Position._

    add(tabbedPanel, Center)
    add(buttonPanel, South)

  }

  pack()
}
