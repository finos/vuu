package org.finos.vuu.core.table

enum DefaultColumn(val name: String, val dataType: Class[_], val isEditable: Boolean = false) {
  case CreatedTime extends DefaultColumn("vuuCreatedTimestamp", DataType.EpochTimestampType)
  case LastUpdatedTime extends DefaultColumn("vuuUpdatedTimestamp", DataType.EpochTimestampType)
  case MSG extends DefaultColumn("vuuMsg", DataType.StringDataType, true)
}

object DefaultColumn {

  val CREATED_TIME: DefaultColumn = DefaultColumn.CreatedTime
  val LAST_UPDATED_TIME: DefaultColumn = DefaultColumn.LastUpdatedTime

  private val allDefaults = DefaultColumn.values

  def getDefaultColumns(customColumns: Array[Column]): Array[Column] =
    allDefaults.map(f => SimpleColumn(f.name, customColumns.length + f.ordinal, f.dataType, isEditable = f.isEditable))

  def isDefaultColumn(column: Column): Boolean =
    allDefaults.exists(f => f.name == column.name && f.dataType == column.dataType)

  def getDefaultColumnNames: Array[String] =
    allDefaults.map(f => f.name)

}
