package org.finos.vuu.core.sort

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{Column, DataType, RowData, ViewPortColumnCreator}
import org.finos.vuu.net.SortSpec
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}
import org.finos.toolbox.collection.array.ImmutableArray

import scala.annotation.tailrec

trait Sort {
  def doSort(source: RowSource, primaryKeys: ImmutableArray[String], vpColumns: ViewPortColumns): ImmutableArray[String]
}

object NoSort extends Sort {
  override def doSort(source: RowSource, primaryKeys: ImmutableArray[String], vpColumns: ViewPortColumns): ImmutableArray[String] = {
    primaryKeys
  }
}

object SortDirection {
  type TYPE = Short
  final val Descending: Short = 1
  final val Ascending: Short = 2
}

case class NumericSort(direction: SortDirection.TYPE, column: Column) extends Sort {

  override def doSort(source: RowSource, primaryKeys: ImmutableArray[String], vpColumns: ViewPortColumns): ImmutableArray[String] = {
    //val vpColumn = ViewPortColumnCreator.create(source.asTable, List(column.name))

    //val vpColumn = List(vpColumns.getColumnForName(column.name).get)

    val sortedKeys = if (direction == SortDirection.Ascending)
      primaryKeys.toArray.sortBy(sortOneRow(_, source, vpColumns))(Ordering[Double])
    else
      primaryKeys.toArray.sortBy(sortOneRow(_, source, vpColumns))(Ordering[Double].reverse)

    ImmutableArray.from(sortedKeys)
  }

  def sortOneRow(key: String, source: RowSource, vpColumns: ViewPortColumns): Double = {

    val value = source.pullRow(key, vpColumns).get(column.name)

    if (value == null)
      Double.NaN
    else
      value.asInstanceOf[Double]

  }
}

case class GenericSort(spec: SortSpec, columns: List[Column]) extends Sort with StrictLogging {

  val sortColumns = spec.sortDefs.map(sdef => sdef.column)

  val sortDirections = spec.sortDefs.map(sdef => sdef.sortType)

  val sortFn = SortFunctions.sortByFields(columns, sortDirections, _: Map[String, RowData], _: String, _: String)


  //val sortFunc        =

  override def doSort(source: RowSource, primaryKeys: ImmutableArray[String], vpColumns: ViewPortColumns): ImmutableArray[String] = {

    //val vpColumns = ViewPortColumnCreator.create(source.asTable, columns.map(_.name))

    val snapshot = primaryKeys.toArray.map(key => (key -> source.pullRow(key, vpColumns))).toMap

    val curried = sortFn(snapshot, _: String, _: String)

    logger.debug(s"sorting ${primaryKeys.length} keys")

    val sortedArray = primaryKeys.toArray.sortWith(curried)

    ImmutableArray.from(sortedArray)
  }

}

object SortFunctions extends StrictLogging {

  def sortByFields(columns: List[Column], directions: List[Char], source: Map[String, RowData], left: String, right: String): Boolean = {

    val leftRow = source.get(left).get
    val rightRow = source.get(right).get

    def sortByDt(currentColumn: Column, leftVal: Any, rightVal: Any, direction: Char) = {

      //      if(leftVal == null && rightVal != null)
      //        true
      //      else if(rightVal == null && leftVal != null)
      //        false
      //      else if(rightVal == null && leftVal != null)

      if (currentColumn.dataType == DataType.StringDataType)
        stringSort(leftVal, rightVal, direction)
      else if (currentColumn.dataType == DataType.IntegerDataType)
        intSort(leftVal, rightVal, direction)
      else if (currentColumn.dataType == DataType.LongDataType)
        longSort(leftVal, rightVal, direction)
      else if (currentColumn.dataType == DataType.BooleanDataType)
        booleanSort(leftVal, rightVal, direction)
      else if (currentColumn.dataType == DataType.DoubleDataType)
        doubleSort(leftVal, rightVal, direction)
      else {
        logger.error("hit this condition")
        stringSort(leftVal, rightVal, direction)
      }
    }


    //algo
    @tailrec
    def oneColSort(columns: List[Column], directions: List[Char]): Boolean = {
      if (columns.isEmpty)
        println("here")

      val currentColumn = columns.head
      val direction = directions.head

      val leftVal = leftRow.get(currentColumn)
      val rightVal = rightRow.get(currentColumn)

      //sort by the first field,
      if (leftVal != rightVal) {
        sortByDt(currentColumn, leftVal, rightVal, direction)
        //if the value in the first field is equal, recurse sorting each subsequent field
        //until equality or end of fields.
      } else {
        if (columns.tail.isEmpty)
        //leftval == rightval
          false
        else
          oneColSort(columns.tail, directions.tail)
      }
    }

    //start recursive step
    oneColSort(columns, directions)

  }

  protected def stringSort(a: Any, b: Any, direction: Char): Boolean = {
    if(a == null && b == null){
      false
    } else if(a == null && b != null){
      true
    }else if(a != null && b == null){
      false
    } else if (direction == 'A')
      a.asInstanceOf[String] > b.asInstanceOf[String]
    else
      a.asInstanceOf[String] < b.asInstanceOf[String]
  }

  protected def booleanSort(a: Any, b: Any, direction: Char): Boolean = {
    if (a == null && b != null)
      false
    else if (b == null && a != null)
      true
    else {
      if (direction == 'A')
        a.asInstanceOf[Boolean] > b.asInstanceOf[Boolean]
      else
        a.asInstanceOf[Boolean] < b.asInstanceOf[Boolean]
    }

  }

  protected def doubleSort(a: Any, b: Any, direction: Char): Boolean = {

    if (direction == 'A')
      a.asInstanceOf[Double] > b.asInstanceOf[Double]
    else
      a.asInstanceOf[Double] < b.asInstanceOf[Double]
  }

  protected def intSort(a: Any, b: Any, direction: Char): Boolean = {
    if (direction == 'A')
      a.asInstanceOf[Int] > b.asInstanceOf[Int]
    else
      a.asInstanceOf[Int] < b.asInstanceOf[Int]
  }

  protected def longSort(a: Any, b: Any, direction: Char): Boolean = {
    if (direction == 'A')
      a.asInstanceOf[Long] > b.asInstanceOf[Long]
    else
      a.asInstanceOf[Long] < b.asInstanceOf[Long]
  }

}

case class AlphaSort(direction: SortDirection.TYPE, column: Column) extends Sort {

  override def doSort(source: RowSource, primaryKeys: ImmutableArray[String], vpColumns: ViewPortColumns): ImmutableArray[String] = {

    //val vpColumns = ViewPortColumnCreator.create(source.asTable, List(column.name))

    val sortedKeys = if (direction == SortDirection.Ascending)
      primaryKeys.toArray.sortBy(sortOneRow(_, source, vpColumns))(Ordering[String])
    else
      primaryKeys.toArray.sortBy(sortOneRow(_, source, vpColumns))(Ordering[String].reverse)

    ImmutableArray.from(sortedKeys)
  }

  def sortOneRow(key: String, source: RowSource, vpColumns: ViewPortColumns): String = {

    val value = source.pullRow(key, vpColumns).get(column.name)

    if (value == null)
      ""
    else
      value.toString

  }

}


