package org.finos.vuu.core.table

import org.finos.vuu.core.table.column.ColumnNames.{VuuCreatedTimestamp, VuuMsg, VuuUpdatedTimestamp}

enum DefaultColumn(val columnName: String, val dataType: Class[?]) extends java.lang.Enum[DefaultColumn] {
  case CreatedTime extends DefaultColumn(VuuCreatedTimestamp, DataType.EpochTimestampType)
  case LastUpdatedTime extends DefaultColumn(VuuUpdatedTimestamp, DataType.EpochTimestampType)
  case MSG extends DefaultColumn(VuuMsg, DataType.StringDataType)
}

object DefaultColumn {

  private val allDefaults = DefaultColumn.values

  def getDefaultColumns(customColumns: Array[Column]): Array[Column] =
    allDefaults.map(f => SimpleColumn(f.columnName, customColumns.length + f.ordinal, f.dataType))

  def isDefaultColumn(column: Column): Boolean =
    allDefaults.exists(f => f.columnName == column.name && f.dataType == column.dataType)

  def getDefaultColumnNames: Array[String] =
    allDefaults.map(f => f.columnName)

}
