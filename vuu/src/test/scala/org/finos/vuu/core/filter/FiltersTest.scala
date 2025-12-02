package org.finos.vuu.core.filter

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.sort.FilterAndSortFixture.setupTable
import org.finos.vuu.core.table.{EmptyTablePrimaryKeys, TablePrimaryKeys}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class FiltersTest extends AnyFeatureSpec with Matchers {

  Feature("Test built in filters") {

    Scenario("NoFilter returns everything") {
      val table = setupTable()

      val result = NoFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), true)

      result shouldEqual table.primaryKeys
    }

    Scenario("FilterOutEverythingFilter returns nothing") {
      val table = setupTable()

      val result = FilterOutEverythingFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), true)

      result shouldEqual EmptyTablePrimaryKeys
    }

    Scenario("Compound filter applies filters in succession") {

      val table = setupTable()

      class Filter1 extends ViewPortFilter {
        override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
          if (firstInChain) {
            InMemTablePrimaryKeys(ImmutableArray.from(table.primaryKeys.filter(s => s != "NYC-0004").toArray))
          } else {
            InMemTablePrimaryKeys(ImmutableArray.from(primaryKeys.filter(s => s != "NYC-0004").toArray))
          }
        }
      }

      class Filter2 extends ViewPortFilter {
        override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
          if (firstInChain) {
            InMemTablePrimaryKeys(ImmutableArray.from(table.primaryKeys.filter(s => s != "LDN-0003").toArray))
          } else {
            InMemTablePrimaryKeys(ImmutableArray.from(primaryKeys.filter(s => s != "LDN-0003").toArray))
          }
        }
      }

      val result = CompoundFilter(Filter1(), Filter2()).doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), true)

      result.size shouldEqual 5
      result.toSet shouldEqual Set("LDN-0001", "LDN-0002", "LDN-0008", "NYC-0002", "NYC-0010")

      //Should get same result when applying in reverse

      val result2 = CompoundFilter(Filter2(), Filter1()).doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), true)

      result2.size shouldEqual result.size
      result2.toSet shouldEqual result.toSet

    }

  }

}
