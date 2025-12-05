package org.finos.vuu.core.filter.`type`

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.time.TestFriendlyClock
import org.finos.vuu.core.sort.FilterAndSortFixture.{setupTable, setupTableWithCreationTime}
import org.finos.vuu.core.table.{DefaultColumnNames, EmptyTablePrimaryKeys}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
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
      val clock = TestFriendlyClock(1000L)
      val table = setupTableWithCreationTime(List())(using clock)
      val now = clock.now()
      val frozenTimeFilter = FrozenTimeFilter(now)

      val results = frozenTimeFilter.doFilter(table, table.primaryKeys, true)

      results.length shouldEqual 2
      results.toSet shouldEqual Set("NYC-0004", "LDN-0003")
    }

    Scenario("Freeze filter with indexed created time") {
      val clock = new TestFriendlyClock(1000L)
      val table = setupTableWithCreationTime(List(DefaultColumnNames.CreatedTimeColumnName))(using clock)
      val now = clock.now()
      val frozenTimeFilter = FrozenTimeFilter(now)

      val results = frozenTimeFilter.doFilter(table, table.primaryKeys, true)

      results.length shouldEqual 2
      results.toSet shouldEqual Set("NYC-0004", "LDN-0003")
    }

    Scenario("Freeze filter with indexed created time and not first in chain") {
      val clock = new TestFriendlyClock(1000L)
      val table = setupTableWithCreationTime(List(DefaultColumnNames.CreatedTimeColumnName))(using clock)
      val now = clock.now()
      val frozenTimeFilter = FrozenTimeFilter(now)

      val results = frozenTimeFilter.doFilter(table, InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0003"))), false)

      results.length shouldEqual 1
      results.toSet shouldEqual Set("LDN-0003")
    }

    Scenario("Freeze filter with no input primary keys") {
      val clock = new TestFriendlyClock(1000L)
      val table = setupTableWithCreationTime(List(DefaultColumnNames.CreatedTimeColumnName))(using clock)
      val now = clock.now()
      val frozenTimeFilter = FrozenTimeFilter(now)

      val results = frozenTimeFilter.doFilter(table, EmptyTablePrimaryKeys, true)

      results.length shouldEqual 0
    }

  }

}
