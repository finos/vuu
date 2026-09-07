package org.finos.vuu.core.table

import org.finos.vuu.core.table.column.ColumnNames.{VuuCreatedTimestamp, VuuMsg, VuuUpdatedTimestamp}

enum DefaultColumn(val name: String, val dataType: Class[_]) {
  case CreatedTime extends DefaultColumn(VuuCreatedTimestamp, DataType.EpochTimestampType)
  case LastUpdatedTime extends DefaultColumn(VuuUpdatedTimestamp, DataType.EpochTimestampType)
  case MSG extends DefaultColumn(VuuMsg, DataType.StringDataType)
}

object DefaultColumn {

  val CREATED_TIME: DefaultColumn = DefaultColumn.CreatedTime
  val LAST_UPDATED_TIME: DefaultColumn = DefaultColumn.LastUpdatedTime
  val VUU_MESSAGE: DefaultColumn = DefaultColumn.MSG

  private val allDefaults = DefaultColumn.values

  def getDefaultColumns(customColumns: Array[Column]): Array[Column] =
    allDefaults.map(f => SimpleColumn(f.name, customColumns.length + f.ordinal, f.dataType))

  def isDefaultColumn(column: Column): Boolean =
    allDefaults.exists(f => f.name == column.name && f.dataType == column.dataType)

  def getDefaultColumnNames: Array[String] =
    allDefaults.map(f => f.name)

}
