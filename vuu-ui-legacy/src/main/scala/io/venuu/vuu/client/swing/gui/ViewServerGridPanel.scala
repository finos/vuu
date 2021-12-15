package io.venuu.vuu.client.swing.gui

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.messages._
import io.venuu.vuu.client.swing.{ClientConstants, EventBus}
import io.venuu.vuu.client.swing.gui.SwingThread.swing
import io.venuu.vuu.client.swing.gui.components.FilterBarPanel
import io.venuu.vuu.client.swing.gui.components.popup.ViewServerPopupMenus
import io.venuu.vuu.client.swing.gui.components.renderer.{SortedColumnRenderer, TreeGridCellRenderer}
import io.venuu.vuu.client.swing.model.{VSHackedTable, ViewPortedModel}
import io.venuu.vuu.net._
import io.venuu.vuu.viewport._

import java.awt.event.{MouseAdapter, MouseEvent}
import java.awt.{Color, Dimension, Point}
import java.util.UUID
import javax.swing.event.{ChangeEvent, ChangeListener, ListSelectionEvent, ListSelectionListener}
import javax.swing.table.TableColumn
import javax.swing.{DefaultListSelectionModel, JComponent}
import scala.swing.BorderPanel.Position
import scala.swing._
import scala.swing.event.{MouseClicked, TableEvent}

class ComponentWithContext(val component: Component, val context: Object) extends Component {
  override lazy val peer: JComponent = component.peer
}

case class ColumnHeaderClicked(override val source: Table, column: Int, e: MouseEvent) extends TableEvent(source)

case class ViewPortContext(requestId: String, vpId: String, table: ViewPortTable, availableColumns: Array[String], columns: Array[String] = Array(),
                           sortBy: SortSpec = SortSpec(List()), filter: String = "", groupBy: Array[String] = Array(),
                           currentColumn: Option[TableColumn] = None,
                           aggregations: Array[Aggregations] = Array(),
                           menus: Option[ClientGetViewPortMenusResponse] = None)

class ViewServerGridPanel(val parentFrame: Frame, requestId: String, tableName: ViewPortTable, availableColumns: Array[String],
                          val columns: Array[String], theModel: ViewPortedModel)(implicit val eventBus: EventBus[ClientMessage], timeProvider: Clock)
  extends BorderPanel with ViewPortContextProvider with StrictLogging {

  private final val selfReference = this;

  @volatile var context: ViewPortContext = ViewPortContext(requestId, "", tableName, availableColumns)

  eventBus.register( {
      //case ru: ClientServerRowUpdate if ru.vpId == vpId => handleRowUpdate(ru)
      case msg: ClientCreateViewPortSuccess =>
        if(msg.requestId == requestId) context = context.copy(vpId = msg.vpId, columns = msg.columns, sortBy = msg.sortBy, filter = msg.filter, groupBy = msg.groupBy)
        eventBus.publish(ClientGetViewPortMenusRequest(RequestId.oneNew(), this.context.vpId))
      case msg: ClientChangeViewPortSuccess =>
        if(msg.requestId == requestId) context = context.copy(columns = msg.columns, sortBy = msg.sortBy, filter = msg.filterSpec.filter, groupBy = msg.groupBy)
        eventBus.publish(ClientGetViewPortMenusRequest(RequestId.oneNew(), this.context.vpId))
        toggleRenderer()
      case msg: ClientGetViewPortMenusResponse =>
        println("Viewport response")
        context = context.copy(menus = Some(msg))
      case msg: ClientMenuRpcResponse =>
        swing{ () =>
          processRpcAction(msg.action)
        }
      case _ =>
  })

  def processRpcAction(action: ViewPortAction) = {
    action match {
      case noAction: NoAction =>
        println("No Action from RPC")
      case open: OpenDialogViewPortAction =>
          val dialog = new VSModalRPCFrame(parentFrame, open.table, Array("*"))
          dialog.open()
//        val frame = new VSChildFrame(parentFrame, "")
//        frame.open()
      case close: CloseDialogViewPortAction =>
        println("I Would close the window now")
    }
  }

  override def setContext(viewPortContext: ViewPortContext): Unit = {
    this.context = viewPortContext
  }

  final val componentId: String = UUID.randomUUID().toString

  def getTable(): Table = {

    new VSHackedTable {
      model = theModel//new ViewPortedModel(vpId, columns)
    }
  }

  this.background = Color.YELLOW
  this.preferredSize = new Dimension(400, 500)

  val parent = this

  lazy val popUp = popMenu

  val popUpGroupBy = ViewServerPopupMenus.groupByPopup(this)

  val table = getTable()

  val header = table.peer.getTableHeader

  def popMenu:components.PopupMenu = {
    ViewServerPopupMenus.parseViewPortMenu(context.menus, eventBus, this.context)
  }

  table.peer.getTableHeader.addMouseListener(new MouseAdapter() {
    override def mouseClicked(e: MouseEvent) {
      publish(ColumnHeaderClicked(table, header.columnAtPoint(e.getPoint()), e) )
    }
  })

  table.peer.getTableHeader.setDefaultRenderer(new SortedColumnRenderer(theModel))

  listenTo(table.mouse.clicks)
  listenTo(table)
  listenTo(table.selection)

  table.peer.getSelectionModel.addListSelectionListener(new ListSelectionListener {
    override def valueChanged(e: ListSelectionEvent): Unit = {
      val selected = e.getSource.asInstanceOf[DefaultListSelectionModel].getSelectedIndices.toArray
      eventBus.publish(ClientSetSelection(RequestId.oneNew(), context.vpId, selected))
      logger.info("Setting Selected" + selected.mkString(",") + " e(first:" + e.getFirstIndex + ",last:" + e.getLastIndex + ",adjusting:" + e.getValueIsAdjusting + ")" + e.getSource)
    }
  })

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
    new components.PopupMenu{
      contents += ViewServerPopupMenus.defaultPopup(selfReference)
      //    contents += rpcViewPort
      //    contents += disableViewPort
      //    contents += enableViewPort
    }
      Map(name -> sortDef)
    }

    val asList = sortsAsMap.values.toList

    setContext(context.copy(sortBy = SortSpec(asList)))

    onChangeViewPort(selfReference)
  }

  val pane = new ScrollPane(table)

  val viewPort = pane.peer.getViewport

  @volatile var lastLast = -1
  @volatile var lastFirst = -1

  viewPort.addChangeListener(new ChangeListener {

    override def stateChanged(e: ChangeEvent): Unit = {

      val rectangle = viewPort.getViewRect

      val firstRow = table.peer.rowAtPoint(new Point(0, rectangle.y))

      val last = if( table.peer.rowAtPoint(new Point(0, rectangle.y + rectangle.height)) > firstRow ) table.peer.rowAtPoint(new Point(0, rectangle.y + rectangle.height)) else theModel.getRowCount

      logger.debug(s"state changed: view rect = $rectangle, firstrow = $firstRow, lastrow = $last")

      if(firstRow == lastFirst && lastLast == last){
      }
      else{
        if(context.vpId != ""){
          logger.info(s"[VP] Range Req ${firstRow}->${last + ClientConstants.OVERLAP}")
          if(firstRow == -1 || last == -1){
            eventBus.publish(ClientUpdateVPRange(RequestId.oneNew(), context.vpId, 0, 100))
          }else{
            eventBus.publish(ClientUpdateVPRange(RequestId.oneNew(), context.vpId, firstRow, last + ClientConstants.OVERLAP))
          }
        }

      }

      lastFirst = firstRow
      lastLast = last
    }
  })

  val filter = new FilterBarPanel(this)

  def onChangeViewPort(contextProvider: ViewPortContextProvider): Unit = {
    ViewServerPopupMenus.mutateViewPort(contextProvider)
  }

  layout(filter) = Position.North
  layout(pane) = Position.Center

}
