package org.finos.vuu.core.filter

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.table.{EmptyTablePrimaryKeys, TablePrimaryKeys}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.viewport.{RowSource, ViewPortColumns}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class FiltersTest extends AnyFeatureSpec with Matchers {

  Feature("Test built in filters") {

    val originalPrimaryKeys = InMemTablePrimaryKeys(ImmutableArray.from(Array[String]("A", "B", "C")))

    Scenario("NoFilter returns everything") {

      val result = NoFilter.doFilter(null, originalPrimaryKeys, null, true)

      result shouldEqual originalPrimaryKeys
    }

    Scenario("FilterOutEverythingFilter returns nothing") {
      val result = FilterOutEverythingFilter.doFilter(null, originalPrimaryKeys, null, true)

      result shouldEqual EmptyTablePrimaryKeys
    }

    Scenario("Compound filter applies filters in succession") {

      class Filter1 extends ViewPortFilter {
        override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
          if (firstInChain) {
            InMemTablePrimaryKeys(ImmutableArray.from(originalPrimaryKeys.filter(s => s != "A").toArray))
          } else {
            InMemTablePrimaryKeys(ImmutableArray.from(primaryKeys.filter(s => s != "A").toArray))
          }
        }
      }

      class Filter2 extends ViewPortFilter {
        override def doFilter(source: RowSource, primaryKeys: TablePrimaryKeys, vpColumns: ViewPortColumns, firstInChain: Boolean): TablePrimaryKeys = {
          if (firstInChain) {
            InMemTablePrimaryKeys(ImmutableArray.from(originalPrimaryKeys.filter(s => s != "C").toArray))
          } else {
            InMemTablePrimaryKeys(ImmutableArray.from(primaryKeys.filter(s => s != "C").toArray))
          }
        }
      }

      val result = CompoundFilter(Filter1(), Filter2()).doFilter(null, originalPrimaryKeys, null, true)

      result.size shouldEqual 1
      result.head shouldEqual "B"

      //Should get same result when applying in reverse

      val result2 = CompoundFilter(Filter2(), Filter1()).doFilter(null, originalPrimaryKeys, null, true)

      result2.size shouldEqual 1
      result2.head shouldEqual "B"

    }

  }

}
