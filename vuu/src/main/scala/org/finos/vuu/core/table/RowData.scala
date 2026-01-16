package org.finos.vuu.core.table

import scala.jdk.CollectionConverters.MapHasAsScala

trait RowData {
  
  def key: String

  def get(field: String): Any

  def get(column: Column): Any

  def getFullyQualified(column: Column): Any

  def set(field: String, value: Any): RowData

  def toArray(columns: List[Column]): Array[Any]

  def size: Int
}

case class RowWithData(key: String, data: Map[String, Any]) extends RowData {

  def this(key: String, data: java.util.Map[String, Any]) = this(key, data.asScala.toMap)

  override def size: Int = data.size

  override def getFullyQualified(column: Column): Any = column.getDataFullyQualified(this)

  override def toArray(columns: List[Column]): Array[Any] = {
    columns.map(c => this.get(c)).toArray
  }

  override def get(column: Column): Any = {
    if (column != null) {
      column.getData(this)
    } else {
      null
    }
  }

  def get(column: String): Any = {
    if (data == null) {
      null
    } else {
      data.get(column).orNull
    }
  }

  def set(field: String, value: Any): RowWithData = {
    RowWithData(key, data ++ Map[String, Any](field -> value))
  }
}

object EmptyRowData extends RowData {

  override def key: String = null

  override def size: Int = 0

  override def toArray(columns: List[Column]): Array[Any] = Array()

  override def get(field: String): Any = null

  override def get(column: Column): Any = null

  override def getFullyQualified(column: Column): Any = null

  override def set(field: String, value: Any): RowData = EmptyRowData
}
