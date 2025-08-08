package org.finos.vuu.core.table

object DefaultColumnNames {
  val CreatedTimeColumnName: String = "vuuCreatedTimestamp"
  val LastUpdatedTimeColumnName: String = "vuuUpdatedTimestamp"
  val allDefaultColumns: Set[String] = Set(CreatedTimeColumnName, LastUpdatedTimeColumnName)
}
