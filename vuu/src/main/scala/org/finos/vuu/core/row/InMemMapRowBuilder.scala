package org.finos.vuu.core.row

import org.finos.vuu.core.table.datatype.{EpochTimestamp, ScaledDecimal}
import org.finos.vuu.core.table.{Column, RowData, RowWithData}

import scala.collection.mutable

class InMemMapRowBuilder extends RowBuilder {

  private val mutableMap = new mutable.HashMap[String, Any]()
  private var key: String = _

  override def setLong(column: Column, v: Long): RowBuilder = {
    mutableMap.update(column.name, v)
    this
  }

  override def setDouble(column: Column, v: Double): RowBuilder = {
    mutableMap.update(column.name, v)
    this
  }

  override def setInt(column: Column, v: Int): RowBuilder = {
    mutableMap.update(column.name, v)
    this
  }

  override def setString(column: Column, v: String): RowBuilder = {
    mutableMap.update(column.name, v)
    this
  }

  override def setBoolean(column: Column, v: Boolean): RowBuilder = {
    mutableMap.update(column.name, v)
    this
  }

  override def setEpochTimestamp(column: Column, v: EpochTimestamp): RowBuilder = {
    mutableMap.update(column.name, v)
    this
  }

  override def setChar(column: Column, v: Char): RowBuilder = {
    mutableMap.update(column.name, v)
    this
  }

  override def setScaledDecimal(column: Column, v: ScaledDecimal): RowBuilder = {
    mutableMap.update(column.name, v)
    this
  }

  override def setKey(key: String): RowBuilder = {
    this.key = key
    this
  }

  override def build: RowData = {
    if(key == null){
      throw new RuntimeException("Key has not been set, this is likely a coding error.")
    }
    val immMap = mutableMap.toMap
    val rowData = RowWithData(key, immMap)
    mutableMap.clear()
    key = null
    rowData
  }

}
