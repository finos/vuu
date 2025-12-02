package org.finos.vuu.core.filter.`type`

import org.finos.vuu.core.sort.FilterAndSortFixture.{setupTable, setupTableWithCreationTime}
import org.finos.vuu.core.table.{DefaultColumnNames, EmptyTablePrimaryKeys}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class FrozenTimeFilterTest extends AnyFeatureSpec with Matchers {

  Feature("Applying frozen filters") {

    Scenario("Freeze filter with created time column missing") {
      val table = setupTable()
      val frozenTimeFilter = FrozenTimeFilter(10001L)

      val results = frozenTimeFilter.doFilter(table, table.primaryKeys, true)

      results.length shouldEqual 0
    }

    Scenario("Freeze filter with created time column present") {
      val table = setupTableWithCreationTime()
      val frozenTimeFilter = FrozenTimeFilter(10001L)

      val results = frozenTimeFilter.doFilter(table, table.primaryKeys, true)

      results.length shouldEqual 2
      results.toList shouldEqual List("NYC-0004", "LDN-0003")
    }

    Scenario("Freeze filter with indexed created time") {
      val table = setupTableWithCreationTime(List(DefaultColumnNames.CreatedTimeColumnName))
      val frozenTimeFilter = FrozenTimeFilter(10001L)

      val results = frozenTimeFilter.doFilter(table, table.primaryKeys, true)

      results.length shouldEqual 2
      results.toList shouldEqual List("NYC-0004", "LDN-0003")
    }

    Scenario("Freeze filter with indexed created time and not first in chain") {
      val table = setupTableWithCreationTime(List(DefaultColumnNames.CreatedTimeColumnName))
      val frozenTimeFilter = FrozenTimeFilter(10001L)

      val results = frozenTimeFilter.doFilter(table, table.primaryKeys, false)

      results.length shouldEqual 2
      results.toList shouldEqual List("NYC-0004", "LDN-0003")
    }

    Scenario("Freeze filter with no input primary keys") {
      val table = setupTableWithCreationTime(List(DefaultColumnNames.CreatedTimeColumnName))
      val frozenTimeFilter = FrozenTimeFilter(10001L)

      val results = frozenTimeFilter.doFilter(table, EmptyTablePrimaryKeys, true)

      results.length shouldEqual 0
    }

  }

}
