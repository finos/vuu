package org.finos.vuu.core.row
import org.finos.vuu.core.table.{Column, RowData, RowWithData}

import scala.collection.mutable

class InMemMapRowBuilder extends RowBuilder {

  private val mutableMap = new mutable.HashMap[String, Any]()
  private var key: String = ""
  override def setLong(column: Column, v: Long): RowBuilder = {
    mutableMap.put(column.name, v)
    this
  }

  override def setDouble(column: Column, v: Double): RowBuilder = {
    mutableMap.put(column.name, v)
    this
  }

  override def setInt(column: Column, v: Int): RowBuilder = {
    mutableMap.put(column.name, v)
    this
  }

  override def setString(column: Column, v: String): RowBuilder = {
    mutableMap.put(column.name, v)
    this
  }

  override def setBoolean(column: Column, v: Boolean): RowBuilder = {
    mutableMap.put(column.name, v)
    this
  }
  override def setKey(key: String): RowBuilder = {
    this.key = key
    this
  }
  override def asRow: RowData = {
    val immMap = mutableMap.toMap
    val rowData = RowWithData(key, immMap)
    mutableMap.clear()
    key = ""
    rowData
  }
}
