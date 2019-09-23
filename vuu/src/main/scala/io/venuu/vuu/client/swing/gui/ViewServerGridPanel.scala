/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 22/01/2016.

  */
package io.venuu.vuu.client.swing.gui

import java.awt.event.{MouseAdapter, MouseEvent}
import java.awt.{Color, Dimension, Point}
import java.util.UUID

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.time.TimeProvider
import io.venuu.vuu.client.swing.gui.components.FilterBarPanel
import io.venuu.vuu.client.swing.gui.components.renderer.{SortedColumnRenderer, TreeGridCellRenderer}
import io.venuu.vuu.client.swing.messages._
import io.venuu.vuu.client.swing.model.{VSHackedTable, ViewPortedModel}
import io.venuu.vuu.client.swing.{ClientConstants, EventBus}
import io.venuu.vuu.net.{FilterSpec, SortDef, SortSpec}
import javax.swing.JComponent
import javax.swing.event.{ChangeEvent, ChangeListener}
import javax.swing.table.TableColumn

import scala.swing.BorderPanel.Position
import scala.swing._
import scala.swing.event.{MouseClicked, TableEvent}

class ComponentWithContext(val component: Component, val context: Object) extends Component{
  override lazy val peer: JComponent = component.peer
}

case class ColumnHeaderClicked(override val source: Table, column: Int, e: MouseEvent) extends TableEvent(source)

case class GridPanelViewPortContext(requestId: String, vpId: String, table: String, availableColumns: Array[String], columns: Array[String] = Array(),
                                    sortBy: SortSpec = SortSpec(List()), filter: String = "", groupBy: Array[String] = Array(),
                                    currentColumn: Option[TableColumn] = None)

class ViewServerGridPanel(requestId: String, tableName: String, availableColumns: Array[String], columns: Array[String], theModel: ViewPortedModel)(implicit val eventBus: EventBus[ClientMessage], timeProvider: TimeProvider) extends BorderPanel with StrictLogging {

  //private var vpId: String = ""

  @volatile var context = GridPanelViewPortContext(requestId, "", tableName, availableColumns)

  eventBus.register( {
      //case ru: ClientServerRowUpdate if ru.vpId == vpId => handleRowUpdate(ru)
      case msg: ClientCreateViewPortSuccess =>
        if(msg.requestId == requestId) context = context.copy(vpId = msg.vpId, columns = msg.columns, sortBy = msg.sortBy, filter = msg.filter, groupBy = msg.groupBy)
      case msg: ClientChangeViewPortSuccess =>
        if(msg.requestId == requestId) context = context.copy(columns = msg.columns, sortBy = msg.sortBy, filter = msg.filterSpec.filter, groupBy = msg.groupBy)
        toggleRenderer()
      case _ =>
  })

  //final val FETCH_COUNT = 100

  final val componentId: String = UUID.randomUUID().toString

  def getTable(): Table = {

    new VSHackedTable {
      model = theModel//new ViewPortedModel(vpId, columns)
    }
  }

  this.background = Color.YELLOW
  this.preferredSize = new Dimension(400, 500)

  val popUp = new components.PopupMenu{
    val editViewPort = new MenuItem(Action("Edit"){
      val modal = new VSChangeVpPanel(context)
      modal.open()
    })

    contents += editViewPort
  }

  val popUpGroupBy = new components.PopupMenu {
    val addToGroupBy = new MenuItem(Action("Add To GroupBy") {
      //val invoker = this.peer.getInvoker.asInstanceOf[JComponentWithContext]

      //val column = table.peer.columnAtPoint(this. )
      //val name = table.peer.getColumnName(column);
      context.currentColumn match {
        case Some(column) =>
          val name = column.getIdentifier.asInstanceOf[String]
          context = context.copy(groupBy = context.groupBy ++ Array(name))
          onChangeViewPort(context.filter, None)
        case None => println("bad")
      }

      //context = context.copy(groupBy = context.groupBy ++ Array)
    })

    val removeFromGroupBy = new MenuItem(Action("Remove From GroupBy") {
      println("was here")
    })

    contents += addToGroupBy
    contents += removeFromGroupBy
  }

  val table = getTable()

  val header = table.peer.getTableHeader

  table.peer.getTableHeader.addMouseListener(new MouseAdapter() {
    override def mouseClicked(e: MouseEvent) {
      publish(ColumnHeaderClicked(table, header.columnAtPoint(e.getPoint()), e) )
    }
  })

  table.peer.getTableHeader.setDefaultRenderer(new SortedColumnRenderer(theModel))

  listenTo(table.mouse.clicks)
  listenTo(table)

  reactions += {

    case x: MouseClicked =>
      showGridMenuPopup(x)

    case x: ColumnHeaderClicked =>
      //if left click, then sort the column
      if(x.e.getButton == 1) {
        sortOnMenuClick(x)
      }
      //else this was a right click (or some ungoldy button 3 or 4
      //so show the popup
      else{
        showGroupByPopup(x)
      }
  }

  def toggleRenderer(): Unit = {
    if(context.groupBy.length > 0)
      this.table.peer.setDefaultRenderer(classOf[Object], new TreeGridCellRenderer())
    else
      table.peer.getTableHeader.setDefaultRenderer(new SortedColumnRenderer(theModel))
  }

  def showGridMenuPopup(x: MouseClicked) = {
    if(x.peer.getButton > 1) popUp.show(new ComponentWithContext(table, null), x.point.x,x.point.y)
  }

  def showGroupByPopup(x: ColumnHeaderClicked) = {
    val column = table.peer.columnAtPoint(x.e.getPoint)
    val name = table.peer.getColumnName(column)
    val columnObj = table.peer.getColumn(name)
    this.context = context.copy(currentColumn = Some(columnObj))
    popUpGroupBy.show(table, x.e.getX,x.e.getY)
  }

  def sortOnMenuClick(x: ColumnHeaderClicked) = {

    val name = theModel.getColumnName(x.column)

    val sortDef = theModel.hasSort(x.column) match {
      case Some(sort) => if(sort.sortType == 'A') sort.copy(sortType = 'D') else sort.copy(sortType = 'A')
      case None => SortDef(name, 'A')

    }

    val sortsAsMap = if(x.e.isShiftDown){
      theModel.getSortsMap().++(Map(name -> sortDef))
    }else{
      Map(name -> sortDef)
    }

    val asList = sortsAsMap.values.toList

    onChangeViewPort("", Some(asList))
  }

  val pane = new ScrollPane(table)

  val viewPort = pane.peer.getViewport

  @volatile var lastLast = -1
  @volatile var lastFirst = -1

  viewPort.addChangeListener(new ChangeListener {

    override def stateChanged(e: ChangeEvent): Unit = {

      val rectangle = viewPort.getViewRect

      val firstRow = table.peer.rowAtPoint(new Point(0, rectangle.y))

      val last = table.peer.rowAtPoint(new Point(0, rectangle.y + rectangle.height))

      logger.info(s"state changed: view rect = $rectangle, firstrow = $firstRow, lastrow = $last")

      if(firstRow == lastFirst && lastLast == last){
        //do nothing
      }
      else{
        //getTable().model.asInstanceOf[ViewPortedModel].setRange(0, 0, 100)

        if(context.vpId != ""){
          logger.info("sending VP update from Grid")
          eventBus.publish(ClientUpdateVPRange(RequestId.oneNew(), context.vpId, firstRow, last + ClientConstants.OVERLAP))
        }

      }

      lastFirst = firstRow
      lastLast = last
    }
  })

  val filter = new FilterBarPanel(onChangeViewPort(_, None))

  def onChangeViewPort(filterText: String, sort: Option[List[SortDef]]): Unit = {

    val filterSpec = if(filter.getFilterText != "") FilterSpec(filter.getFilterText)
                     else null

    val sortSpec = sort match {
      case Some(fields) => SortSpec(fields)
      case None => SortSpec(List())
    }

    val reqId = RequestId.oneNew()

    SwingThread.swing(() => {
      toggleRenderer()
    })

    eventBus.publish(ClientChangeViewPortRequest(reqId, context.vpId, context.columns, filterSpec = filterSpec, sortBy = sortSpec, groupBy = context.groupBy))
  }

  layout(filter) = Position.North
  layout(pane) = Position.Center

}
