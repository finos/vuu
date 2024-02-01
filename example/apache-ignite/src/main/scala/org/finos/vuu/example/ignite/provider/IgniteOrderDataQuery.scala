package org.finos.vuu.example.ignite.provider

import org.finos.vuu.core.module.simul.model.ChildOrder
import org.finos.vuu.core.sort.ModelType.SortSpecInternal
import org.finos.vuu.example.ignite.IgniteOrderStore
import org.finos.vuu.example.ignite.provider.IgniteOrderDataQuery.RowKeyAndData
import org.finos.vuu.feature.ignite.FilterAndSortSpecToSql
import org.finos.vuu.feature.ignite.schema.SchemaMapper
import org.finos.vuu.net.FilterSpec

class IgniteOrderDataQuery private (private val igniteOrderStore: IgniteOrderStore,
                                    private val schemaMapper: SchemaMapper) {

  private val filterAndSortSpecToSql = FilterAndSortSpecToSql(schemaMapper)

  def fetch(filterSpec: FilterSpec, sortSpec: SortSpecInternal, startIndex: Long, rowCount: Int): LazyList[ChildOrder] = {
    igniteOrderStore.findChildOrder(
      filterAndSortSpecToSql.filterToSql(filterSpec),
      filterAndSortSpecToSql.sortToSql(sortSpec),
      startIndex = startIndex,
      rowCount = rowCount
    )
  }

  def toInternalRow(keyField: String): Product => RowKeyAndData =
    dto => {
      val values = dto.productIterator.toList
      val rowData = schemaMapper.toTableRowData(values)
      val key = values(schemaMapper.externalSchemaField(keyField).get.index)
      (key.toString, rowData)
  }
}

object IgniteOrderDataQuery {
  def apply(igniteOrderStore: IgniteOrderStore, schemaMapper: SchemaMapper): IgniteOrderDataQuery =
    new IgniteOrderDataQuery(igniteOrderStore, schemaMapper)

  private type RowKey = String
  type RowKeyAndData = (RowKey, Map[String, Any])
}