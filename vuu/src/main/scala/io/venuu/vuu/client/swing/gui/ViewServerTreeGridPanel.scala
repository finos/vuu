package io.venuu.vuu.client.swing.gui

import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.swing.EventBus
import io.venuu.vuu.client.swing.gui.components.renderer.TreeGridCellRenderer
import io.venuu.vuu.client.swing.messages.{ClientCloseTreeNodeRequest, ClientMessage, ClientOpenTreeNodeRequest, RequestId}
import io.venuu.vuu.client.swing.model.ViewPortedModel

import scala.swing.event.MouseClicked

case class Column(index: Int, name: String)

object TreeColumns{
    //Map("_depth" -> depth, "_isOpen" -> isOpen, "_treeKey" -> key, "_isLeaf" -> isLeaf, "_caption" -> originalKey)
    final val RowIndex = Column(0, "rowIndex")
    final val Depth = Column(1, "_depth")
    final val IsOpen = Column(2, "_isOpen")
    final val TreeKey = Column(3, "_treeKey")
    final val IsLeaf = Column(4, "_isLeaf")
    final val Caption = Column(5, "_caption")
    final val ChildCount = Column(6, "_childCount")
}

/**
  * Created by chris on 10/04/2016.
  */
class ViewServerTreeGridPanel(requestId: String, tableName: String, availableColumns: Array[String],
                              columns: Array[String], theModel: ViewPortedModel, treeColumns: Array[String])
                             (implicit override val eventBus: EventBus[ClientMessage], timeProvider: Clock) extends ViewServerGridPanel(requestId, tableName, availableColumns, columns, theModel) {


  if(treeColumns.length > 0)
    this.table.peer.setDefaultRenderer(classOf[Object], new TreeGridCellRenderer())

  listenTo(this.table.mouse.clicks)

  reactions += {
    case x: MouseClicked =>

      if (x.peer.getButton == 1) {
        val row: Int = table.peer.rowAtPoint(x.point)
        val col: Int = table.peer.columnAtPoint(x.point)

        if (col == 0) {

          import TreeColumns._

          val depth = table.peer.getModel().getValueAt(row, Depth.index).toString.toInt
          val isOpen = table.peer.getModel().getValueAt(row, IsOpen.index).toString.toBoolean
          val treeKey = table.peer.getModel().getValueAt(row, TreeKey.index).toString
          val isLeaf = table.peer.getModel().getValueAt(row, IsLeaf.index).toString.toBoolean
          val caption = table.peer.getModel().getValueAt(row, Caption.index).toString()

          if(!isLeaf && !isOpen)
            eventBus.publish(ClientOpenTreeNodeRequest(RequestId.oneNew(), this.context.vpId, treeKey))
          else if(!isLeaf && isOpen)
            eventBus.publish(ClientCloseTreeNodeRequest(RequestId.oneNew(), this.context.vpId, treeKey))

          println(s">> depth ${depth} isOpen ${isOpen} treeKey ${treeKey} isLeaf ${isLeaf} caption ${caption}")

        }
      }
  }
}
