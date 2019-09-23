/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 06/01/2016.

  */
package io.venuu.vuu.client.swing.model

import java.util.concurrent.ConcurrentHashMap

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.logging.LogAtFrequency
import io.venuu.toolbox.time.TimeProvider
import io.venuu.vuu.client.swing.gui.SwingThread
import io.venuu.vuu.client.swing.messages._
import io.venuu.vuu.client.swing.{ClientConstants, EventBus}
import io.venuu.vuu.net.SortDef
import javax.swing.table.AbstractTableModel

import scala.collection.mutable.{ArrayBuffer, ListBuffer}
import scala.swing.Table
import scala.util.{Failure, Success, Try}

class VSHackedTable extends Table(0, 0) {


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

object DataFormatter{

  protected def isEmpty(s: String): Boolean = {
    s == null || s.isEmpty
  }

  def format(data: String, dataType: String): Any = {
    dataType match {
      case "string" => data
      case "double" => if(isEmpty(data)) Double.NaN else data.toDouble
      case "long" => if(isEmpty(data)) 0l else data.toLong
      case "int" => if(isEmpty(data)) 0 else  data.toInt
      case "boolean" => data.toBoolean
    }
  }
}


class RpcModel() extends AbstractTableModel(){

  @volatile private var currentColumns: Array[String] = Array()
  @volatile private var currentDataTypes: Array[String] = Array()
  @volatile private var currentKey: String = ""

  @volatile private var data = new ListBuffer[ArrayBuffer[AnyRef]]()

  def getData(): List[(String, Map[String, Any])] = {

    import DataFormatter._

    val rowsAsMaps = data.map(row => {
      val asMap = row.zip(currentColumns.zip(currentDataTypes)).map({case(value, (key, dataType)) => (key -> format(value.toString, dataType))}).toMap
      (asMap.get(currentKey).get.asInstanceOf[String], asMap)
    } ).toList
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

  override def getColumnName(column: Int): String = {
    currentColumns(column)
  }

  override def isCellEditable(rowIndex: Int, columnIndex: Int): Boolean = {
    true
  }

  override def setValueAt(aValue: scala.Any, rowIndex: Int, columnIndex: Int): Unit = {
    data(rowIndex)(columnIndex) = aValue.asInstanceOf[AnyRef]
  }

  def resetData() = {
    data.clear()
  }

  def addEmptyRow(): Unit = {
    data.+=(ArrayBuffer.fill[AnyRef](currentColumns.length)(""))
  }

  override def getRowCount: Int = data.length

  override def getColumnCount: Int = currentColumns.length

  override def getValueAt(rowIndex: Int, columnIndex: Int): AnyRef = {
    if(rowIndex + 1 > data.size)
      ""
    else
      data(rowIndex)(columnIndex)
  }
}

object ViewPortModel{
  final val LoadingString = "-"
}

class ViewPortedModel(requestId: String, val theColumns: Array[String])(implicit val eventBus: EventBus[ClientMessage], timeProvider: TimeProvider) extends AbstractTableModel with StrictLogging {

  import ViewPortModel._

  @volatile var columns = theColumns

  @volatile var sorts = Map[String, SortDef]()

  @volatile var groupBy: Array[String] = Array()

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

  @volatile private var vpId: String = ""

  eventBus.register({
      case msg: ClientCreateViewPortSuccess if msg.requestId == requestId =>
        logger.info(s"setting vpId to $vpId")
        vpId = msg.vpId
        sorts = msg.sortBy.sortDefs.map(sd => sd.column -> sd).toMap
        groupBy = msg.groupBy
        columns = if(!msg.groupBy.isEmpty)
                    Array("_tree", "_depth", "_isOpen", "_treeKey", "_isLeaf", "_caption", "_childCount") ++ Array("rowIndex") ++ msg.columns
                  else
                    Array("rowIndex") ++ msg.columns

        //val groupByColumns = Array("_depth", "_isOpen", "_treeKey", "_isLeaf", "_caption", "_childCount") ++ columns
        SwingThread.swing(() => {
          fireTableStructureChanged()
          fireTableDataChanged()
        })

      case ru: ClientServerRowUpdate if ru.vpId == vpId =>
        handleRowUpdate(ru)
      //case ru: ClientServerRowUpdate => handleRowUpdate(ru)
      case msg: ClientChangeViewPortSuccess =>
        logger.info(s"Client Change VP Success ${msg} ")

        columns = if(!msg.groupBy.isEmpty)
          Array("_tree", "_depth", "_isOpen", "_treeKey", "_isLeaf", "_caption", "_childCount") ++ Array("rowIndex") ++ msg.columns
        else
          Array("rowIndex") ++ msg.columns

        sorts = msg.sortBy.sortDefs.map(sd => sd.column -> sd).toMap
        groupBy = msg.groupBy

        //dump the cache
        localCache.clear()

        SwingThread.swing(() => {
          fireTableStructureChanged()
          fireTableDataChanged()
        })

      case _ =>
  })

  private val model = this

  @volatile
  private var range = new Range(0, 100)
  @volatile
  private var rowCount = 0

  def setRange(start: Int, end: Int) = range = new Range(start, end)

  private val localCache = new ConcurrentHashMap[Int, Array[AnyRef]]()

  case class RangeUpdate(from: Int, to: Int)

  case class Range(row: Int, size: Int) {

    def isRowWithin(r: Int): Boolean = {
      r >= row && r <= row + size
    }

  }

  val addedRowLog = new LogAtFrequency(1000)

  def handleRowUpdate(ru: ClientServerRowUpdate) = {
    rowCount = ru.size
    vpId = ru.vpId

    if(range.isRowWithin(ru.index)){

      if(addedRowLog.shouldLog())
        logger.debug(s"put value into cache: ${ru.index} ${ru.data}")

      localCache.put(ru.index, ru.data)
      SwingThread.swing(() => {
        model.fireTableRowsUpdated(ru.index, ru.index)
      })

    }else{
      logger.debug(s"dropped $ru as not in range ${range}")
    }
    SwingThread.swing(() => {
      model.fireTableRowsUpdated(ru.index, ru.index)
    })
  }



  override def getRowCount: Int = rowCount

  override def getColumnCount: Int = columns.size

  override def getValueAt(rowIndex: Int, columnIndex: Int): AnyRef = {

    if(columnIndex == 0) rowIndex.toString

    else{

      if (!range.isRowWithin(rowIndex)) {
        val overlap = if(rowIndex - 100 < 0) 0 else rowIndex - 100

        println(s"Added to queue... $rowIndex,$columnIndex")
        localCache.clear()

        if(vpId != ""){
          logger.info("sending VP update from Model")
          range = Range(overlap, rowIndex + 200)
          eventBus.publish(ClientUpdateVPRange(RequestId.oneNew(), vpId, overlap, rowIndex + ClientConstants.OVERLAP))
        }


        //range = Range(overlap, rowIndex + 100, 100)
        LoadingString
      } else {

        //if(this.gr)

        val entry = localCache.get(rowIndex)
        if(entry != null){
          if(columnIndex  > entry.size)
            LoadingString
          else
            Try(entry(columnIndex - 1)) match {
              case Success(value) => value
              case Failure(e) =>
                logger.error("error on get data", e)
                LoadingString
            }
        }else{
          LoadingString
        }

      }
    }

  }

}
