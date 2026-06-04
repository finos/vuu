package org.finos.vuu.core.table

enum DefaultColumn(val name: String, val dataType: Class[_]) {
  case CreatedTime extends DefaultColumn("vuuCreatedTimestamp", DataType.EpochTimestampType)
  case LastUpdatedTime extends DefaultColumn("vuuUpdatedTimestamp", DataType.EpochTimestampType)
  case VuuMsg extends DefaultColumn("vuu_msg", DataType.StringDataType)
}

object DefaultColumn {

  val COUNT: Int = DefaultColumn.values.length
  val CREATED_TIME: DefaultColumn = DefaultColumn.CreatedTime
  val LAST_UPDATED_TIME: DefaultColumn = DefaultColumn.LastUpdatedTime
  val VUU_MSG: DefaultColumn = DefaultColumn.VuuMsg

  private val allDefaults = DefaultColumn.values

  def getDefaultColumns(customColumns: Array[Column], isSessionTable: Boolean = false): Array[Column] = {
    val defaults = if (isSessionTable) allDefaults else allDefaults.filterNot(_ == DefaultColumn.VuuMsg)
    defaults.zipWithIndex.map({ case (f, index) =>
      SimpleColumn(f.name, customColumns.length + index, f.dataType)
    })
  }

  def isDefaultColumn(column: Column): Boolean =
    allDefaults.exists(f => f.name == column.name && f.dataType == column.dataType)

  def getDefaultColumnNames: Array[String] =
    allDefaults.map(f => f.name)

}

