package org.finos.vuu.example.ignite.provider

import org.finos.vuu.core.module.simul.model.ChildOrder
import org.finos.vuu.example.ignite.IgniteOrderStore
import org.finos.vuu.feature.ignite.{FilterAndSortSpecToSql, IgniteSqlQuery}
import org.finos.vuu.net.{FilterSpec, SortSpec}
import org.finos.vuu.util.schema.SchemaMapper

class IgniteOrderDataQuery private (private val igniteOrderStore: IgniteOrderStore,
                                    private val schemaMapper: SchemaMapper) {

  private val filterAndSortSpecToSql = FilterAndSortSpecToSql(schemaMapper)

  def getFilterSql(filterSpec: FilterSpec): IgniteSqlQuery =
    filterAndSortSpecToSql.filterToSql(filterSpec)

  def fetch(filterSpec: FilterSpec, sortSpec: SortSpec, startIndex: Long, rowCount: Int): Iterator[ChildOrder] = {
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