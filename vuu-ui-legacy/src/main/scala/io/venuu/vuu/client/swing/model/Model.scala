/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 06/01/2016.
 *
 */
package io.venuu.vuu.client.swing.model

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.collection.window.ArrayBackedMovingWindow
import io.venuu.toolbox.logging.LogAtFrequency
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.messages._
import io.venuu.vuu.client.swing.EventBus
import io.venuu.vuu.client.swing.gui.SwingThread
import io.venuu.vuu.net.SortDef

import javax.swing.table.{AbstractTableModel, TableCellEditor, TableCellRenderer}
import javax.swing.{JComponent, JTable}
import scala.collection.mutable.{ArrayBuffer, ListBuffer}
import scala.swing.Table
import scala.util.{Failure, Success, Try}

class VSHackedTable extends Table(0, 0) {
  override lazy val peer: JTable = new JTable with SuperMixin {
    override def getCellRenderer(r: Int, c: Int): TableCellRenderer = new TableCellRenderer {
      def getTableCellRendererComponent(table: JTable, value: AnyRef, isSelected: Boolean,
                                        hasFocus: Boolean, row: Int, column: Int): JComponent =
        VSHackedTable.this.rendererComponent(isSelected, hasFocus, row, column).peer
    }
    override def getCellEditor(r: Int, c: Int): TableCellEditor = editor(r, c)
    override def getValueAt(r: Int, c: Int): AnyRef = VSHackedTable.this.apply(r,c).asInstanceOf[AnyRef]
    override def clearSelection(): Unit = {
    }
  }


  /*
  boolean dragComplete = false;
        apTable.getTableHeader().addMouseListener(new MouseAdapter() {
            @Override
            public void mouseReleased(MouseEvent e) {
                if (dragComplete) {
                    System.out.println("Drag completed");
                }
                dragComplete = false;
            }
        });
        columnModel.addColumnModelListener(new TableColumnModelListener() {

            public void columnAdded(TableColumnModelEvent e) {
            }

            public void columnRemoved(TableColumnModelEvent e) {
            }

            public void columnMoved(TableColumnModelEvent e) {
                dragComplete = true;
            }

            public void columnMarginChanged(ChangeEvent e) {
            }

            public void columnSelectionChanged(ListSelectionEvent e) {
            }
        });
   */


  //this.peer.getTableHeader.addMouseListener()

  override def apply(row: Int, column: Int): Any = model.getValueAt(viewToModelRow(row), modelToViewRow(column))

  override def viewToModelRow(idx: Int) = peer.convertRowIndexToModel(idx)

  override def modelToViewRow(idx: Int) = peer.convertRowIndexToView(idx)

  //peer.setRowSorter(new TableRowSorter(model))
}

object DataFormatter {

  def format(data: String, dataType: String): Any = {
    dataType match {
      case "string" => data
      case "double" => if (isEmpty(data)) Double.NaN else data.toDouble
      case "long" => if (isEmpty(data)) 0l else data.toLong
      case "int" => if (isEmpty(data)) 0 else data.toInt
      case "boolean" => data.toBoolean
    }
  }

  protected def isEmpty(s: String): Boolean = {
    s == null || s.isEmpty
  }
}


class RpcModel() extends AbstractTableModel() {

  @volatile private var currentColumns: Array[String] = Array()
  @volatile private var currentDataTypes: Array[String] = Array()
  @volatile private var currentKey: String = ""

  @volatile private var data = new ListBuffer[ArrayBuffer[AnyRef]]()

  def getData(): List[(String, Map[String, Any])] = {

    import DataFormatter._

    val rowsAsMaps = data.map(row => {
      val asMap = row.zip(currentColumns.zip(currentDataTypes)).map({ case (value, (key, dataType)) => (key -> format(value.toString, dataType)) }).toMap
      (asMap.get(currentKey).get.asInstanceOf[String], asMap)
    }).toList
    rowsAsMaps
  }

  def setColumns(columns: Array[String], dataTypes: Array[String], key: String) = {
    currentColumns = columns
    currentDataTypes = dataTypes
    currentKey = key
    resetData()
    addEmptyRow()
    fireTableStructureChanged()
    fireTableDataChanged()
  }

  def resetData() = {
    data.clear()
  }

  def addEmptyRow(): Unit = {
    data.+=(ArrayBuffer.fill[AnyRef](currentColumns.length)(""))
  }

  override def getColumnName(column: Int): String = {
    currentColumns(column)
  }

  override def isCellEditable(rowIndex: Int, columnIndex: Int): Boolean = {
    true
  }

  override def setValueAt(aValue: scala.Any, rowIndex: Int, columnIndex: Int): Unit = {
    data(rowIndex)(columnIndex) = aValue.asInstanceOf[AnyRef]
  }

  override def getRowCount: Int = data.length

  override def getColumnCount: Int = currentColumns.length

  override def getValueAt(rowIndex: Int, columnIndex: Int): AnyRef = {
    if (rowIndex + 1 > data.size)
      ""
    else
      data(rowIndex)(columnIndex)
  }
}

object ViewPortModel {
  final val LoadingString = "-"
}

class ViewPortedModel(requestId: String, val theColumns: Array[String])(implicit val eventBus: EventBus[ClientMessage], timeProvider: Clock) extends AbstractTableModel with StrictLogging {

  import ViewPortModel._

  val addedRowLog = new LogAtFrequency(1000)
  private val model = this
  private val movingWindow = new ArrayBackedMovingWindow[ClientServerRowUpdate](200)
  @volatile var columns = theColumns
  @volatile var sorts = Map[String, SortDef]()
  @volatile var groupBy: Array[String] = Array()
  @volatile private var vpId: String = ""
  @volatile
  private var rowCount = 0

  eventBus.register({

    case msg: ClientChangeViewPortRangeSuccess if msg.vpId == vpId =>
      logger.info(s"Updated VP range in model ${vpId} from ${msg.from} to ${msg.to}")
      this.setRange(msg.from, msg.to)

    case msg: ClientCreateViewPortSuccess if msg.requestId == requestId =>
      logger.info(s"setting vpId to $vpId")
      vpId = msg.vpId
      sorts = msg.sortBy.sortDefs.map(sd => sd.column -> sd).toMap
      groupBy = msg.groupBy
      columns = if (!msg.groupBy.isEmpty)
        Array("rowIndex") ++ Array("selected") ++ Array("_tree", "_depth", "_isOpen", "_treeKey", "_isLeaf", "_caption", "_childCount") ++ msg.columns
      else
        Array("rowIndex") ++ Array("selected") ++ msg.columns

      //val groupByColumns = Array("_depth", "_isOpen", "_treeKey", "_isLeaf", "_caption", "_childCount") ++ columns
      SwingThread.swing(() => {
        fireTableStructureChanged()
        fireTableDataChanged()
      })

    case ru: ClientServerRowUpdate if ru.vpId == vpId =>
      handleRowUpdate(ru)


    case msg: ClientChangeViewPortSuccess  if msg.viewPortId == vpId =>
      logger.info(s"Client Change VP Success ${msg} ")

      columns = if (!msg.groupBy.isEmpty)
        Array("rowIndex") ++ Array("selected") ++ Array("_tree", "_depth", "_isOpen", "_treeKey", "_isLeaf", "_caption", "_childCount") ++ msg.columns
      else
        Array("rowIndex") ++ Array("selected") ++ msg.columns

      sorts = msg.sortBy.sortDefs.map(sd => sd.column -> sd).toMap
      groupBy = msg.groupBy

      SwingThread.swing(() => {
        fireTableStructureChanged()
        fireTableDataChanged()
      })

    case _ =>
  })

  override def getColumnName(column: Int): String = {
    //println("Chris>> get column name: " + columns(column))
    columns(column)
  }

  def hasSort(column: Int): Option[SortDef] = {
    val name = columns(column)
    sorts.get(name)
  }

  def getSortsMap() = sorts

  def getSorts() = sorts.values.toArray

  def setRange(start: Int, end: Int) = {
    this.movingWindow.setRange(start, end)
  }

  def handleRowUpdate(ru: ClientServerRowUpdate) = {
    rowCount = ru.size
    vpId = ru.vpId

    if(ru.index == -1){
      SwingThread.swing(() => {
        model.fireTableDataChanged()
      })
    }
    else if (movingWindow.isWithinRange(ru.index)) {
      logger.debug(s"Adding ${ru.index} row to window")
      movingWindow.setAtIndex(ru.index, ru)
      SwingThread.swing(() => {
        model.fireTableRowsUpdated(ru.index, ru.index)
        //model.fireTableDataChanged()
      })
    } else {
      logger.debug(s"Dropping ${ru.index} row, not in range" + movingWindow.getRange().from + "->" + movingWindow.getRange().to)
    }

  }

  override def getRowCount: Int = rowCount

  override def getColumnCount: Int = columns.size

  override def getValueAt(rowIndex: Int, columnIndex: Int): AnyRef = {

      movingWindow.getAtIndex(rowIndex) match {
        case Some(entry: ClientServerRowUpdate) =>
          if (entry != null) {
              if(columnIndex == 0) {
                entry.index.toString
              }else if(columnIndex == 1) {
                entry.selected.toString
              }
              else if (columnIndex > entry.data.size + 1)
                LoadingString
              else
                Try(entry.data(columnIndex - 2)) match {
                  case Success(value) => value
                  case Failure(e) =>
                    logger.error("error on get data", e)
                    LoadingString
                }
          } else {
            LoadingString
          }

        case None =>
          LoadingString
      }
    }

  case class RangeUpdate(from: Int, to: Int)

  case class Range(row: Int, size: Int) {

    def isRowWithin(r: Int): Boolean = {
      r >= row && r <= row + size
    }
  }
}
