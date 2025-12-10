package org.finos.vuu.core.table

enum DefaultColumn(val name: String, val dataType: Class[_]) {
  case CreatedTime extends DefaultColumn("vuuCreatedTimestamp", DataType.EpochTimestampType)
  case LastUpdatedTime extends DefaultColumn("vuuUpdatedTimestamp", DataType.EpochTimestampType)
}

object DefaultColumn {

  val CREATED_TIME: DefaultColumn = DefaultColumn.CreatedTime
  val LAST_UPDATED_TIME: DefaultColumn = DefaultColumn.LastUpdatedTime

  private val allDefaults = DefaultColumn.values

  def getDefaultColumns(customColumns: Array[Column]): Array[Column] =
    allDefaults.map(f => SimpleColumn(f.name, customColumns.length + f.ordinal, f.dataType))

  def isDefaultColumn(column: Column): Boolean =
    allDefaults.exists(f => f.name == column.name && f.dataType == column.dataType)

  def getDefaultColumnNames: Array[String] =
    allDefaults.map(f => f.name)

}
