package org.finos.vuu.example.ignite

import org.finos.vuu.core.table.ColumnValueProvider


class IgniteColumnValueProvider(final val igniteStore: IgniteOrderStore) extends ColumnValueProvider {

  private val MAX_RESULT_COUNT = 10
  override def getUniqueValues(columnName: String): Array[String] =
    igniteStore.getDistinct(columnName, MAX_RESULT_COUNT).toArray

  override def getUniqueValuesStartingWith(columnName: String, starts: String): Array[String] =
    igniteStore.getDistinct(columnName, starts, MAX_RESULT_COUNT).toArray
}
