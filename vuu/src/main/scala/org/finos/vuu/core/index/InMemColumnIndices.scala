package org.finos.vuu.core.index

import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.datatype.EpochTimestamp
import org.finos.vuu.core.table.{Column, DataType, RowData}

trait InMemColumnIndices {

  def indexForColumn(column: Column): Option[IndexedField[_]]

  def insert(rowData: RowData): Unit

  def update(originalRow: RowData, updatedRow: RowData): Unit

  def remove(rowData: RowData): Unit

}

object InMemColumnIndices {

  def apply(tableDef: TableDef): InMemColumnIndices = {
    val indices = tableDef.indices.indices
      .map(index => tableDef.columnForName(index.column))
      .map(c => c -> buildIndexForColumn(c))
      .toMap[Column, IndexedField[_]]
    val updaters = buildUpdaters(indices)
    InMemColumnIndicesImpl(indices, updaters)
  }

  private def buildIndexForColumn(c: Column): IndexedField[_] = {
    c.dataType match {
      case DataType.StringDataType =>
        new HashMapIndexedStringField(c)
      case DataType.IntegerDataType =>
        new SkipListIndexedIntField(c)
      case DataType.LongDataType =>
        new SkipListIndexedLongField(c)
      case DataType.DoubleDataType =>
        new SkipListIndexedDoubleField(c)
      case DataType.BooleanDataType =>
        new SkipListIndexedBooleanField(c)
      case DataType.EpochTimestampType =>
        new SkipListIndexedEpochTimestampField(c)
      case DataType.CharDataType =>
        new SkipListIndexedCharField(c)
      case _ =>
        throw new UnsupportedOperationException(s"Unsupported type ${c.dataType} in column ${c.name}")
    }
  }

  private def buildUpdaters(indices: Map[Column, IndexedField[?]]): Array[IndexUpdater] = {        
    indices.map {
      case (column, index) =>

        //helper method (handy!)
        def create[T](index: IndexedField[T]): IndexUpdater = IndexUpdater(
          column,
          insertFunction = (v, k) => index.insert(v.asInstanceOf[T], k),
          replaceFunction = (v1, v2, k) => index.replace(v1.asInstanceOf[T], v2.asInstanceOf[T], k),
          removeFunction = (v, k) => index.remove(v.asInstanceOf[T], k)
        )

        column.dataType match {
          case DataType.StringDataType => create(index.asInstanceOf[IndexedField[String]])
          case DataType.IntegerDataType => create(index.asInstanceOf[IndexedField[Int]])
          case DataType.LongDataType => create(index.asInstanceOf[IndexedField[Long]])
          case DataType.DoubleDataType => create(index.asInstanceOf[IndexedField[Double]])
          case DataType.BooleanDataType => create(index.asInstanceOf[IndexedField[Boolean]])
          case DataType.EpochTimestampType => create(index.asInstanceOf[IndexedField[EpochTimestamp]])
          case DataType.CharDataType => create(index.asInstanceOf[IndexedField[Char]])
          case _ => throw new UnsupportedOperationException(s"Unsupported type ${column.dataType} in column ${column.name}")
        }
    }.toArray
  }
  
}

private case class IndexUpdater(column: Column, 
                                insertFunction: (Any, String) => Unit,
                                replaceFunction: (Any, Any, String) => Unit,
                                removeFunction: (Any, String) => Unit)

private case class InMemColumnIndicesImpl(indices: Map[Column, IndexedField[?]], 
                                          updaters: Array[IndexUpdater]) extends InMemColumnIndices {

  override def indexForColumn(column: Column): Option[IndexedField[_]] = indices.get(column)

  override def insert(rowData: RowData): Unit = {
    val rowKey = rowData.key

    var i = 0
    while (i < updaters.length) {
      val updater = updaters(i)
      val value = rowData.get(updater.column)
      if (value != null) {
        updater.insertFunction.apply(value, rowKey)
      }
      i += 1
    }
  }

  override def update(originalRow: RowData, updatedRow: RowData): Unit = {
    val rowKey = updatedRow.key

    var i = 0
    while (i < updaters.length) {
      val updater = updaters(i)
      val originalValue = originalRow.get(updater.column)
      val currentValue = updatedRow.get(updater.column)
      if (originalValue != currentValue) {
        if (originalValue == null && currentValue != null) {
          updater.insertFunction.apply(currentValue, rowKey)
        } else if (originalValue != null && currentValue == null) {
          updater.removeFunction.apply(originalValue, rowKey)
        } else {
          updater.replaceFunction.apply(originalValue, currentValue, rowKey)
        }
      }
      i += 1
    }
  }

  override def remove(rowData: RowData): Unit = {
    val rowKey = rowData.key

    var i = 0
    while (i < updaters.length) {
      val updater = updaters(i)
      val value = rowData.get(updater.column)
      if (value != null) {
        updater.removeFunction.apply(value, rowKey)
      }
      i += 1
    }
  }

}