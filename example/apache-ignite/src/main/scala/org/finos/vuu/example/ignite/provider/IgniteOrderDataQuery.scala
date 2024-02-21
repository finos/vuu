package org.finos.vuu.example.ignite.provider

import org.finos.vuu.core.module.simul.model.ChildOrder
import org.finos.vuu.core.sort.ModelType.SortSpecInternal
import org.finos.vuu.example.ignite.IgniteOrderStore
import org.finos.vuu.feature.ignite.FilterAndSortSpecToSql
import org.finos.vuu.net.FilterSpec
import org.finos.vuu.util.schema.SchemaMapper

class IgniteOrderDataQuery private (private val igniteOrderStore: IgniteOrderStore,
                                    private val schemaMapper: SchemaMapper) {

  private val filterAndSortSpecToSql = FilterAndSortSpecToSql(schemaMapper)

  def getFilterSql(filterSpec: FilterSpec): String =
    filterAndSortSpecToSql.filterToSql(filterSpec)

  def fetch(filterSpec: FilterSpec, sortSpec: SortSpecInternal, startIndex: Long, rowCount: Int): Iterator[ChildOrder] = {
    igniteOrderStore.findChildOrder(
      filterAndSortSpecToSql.filterToSql(filterSpec),
      filterAndSortSpecToSql.sortToSql(sortSpec),
      startIndex = startIndex,
      rowCount = rowCount
    )
  }

}

object IgniteOrderDataQuery {
  def apply(igniteOrderStore: IgniteOrderStore, schemaMapper: SchemaMapper): IgniteOrderDataQuery =
    new IgniteOrderDataQuery(igniteOrderStore, schemaMapper)
}