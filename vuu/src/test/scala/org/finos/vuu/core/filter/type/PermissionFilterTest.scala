package org.finos.vuu.core.filter.`type`

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.time.TestFriendlyClock
import org.finos.vuu.core.sort.FilterAndSortFixture.{setupTable, setupTable2, setupTableWithCreationTime}
import org.finos.vuu.core.table.{DefaultColumn, EmptyTablePrimaryKeys, RowData}
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class PermissionFilterTest extends AnyFeatureSpec with Matchers {

  Feature("Test basic built in filters") {

    Scenario("DenyAllPermissionFilter returns nothing") {
      val table = setupTable()

      val results = DenyAllPermissionFilter.doFilter(table, table.primaryKeys, true)

      results shouldEqual EmptyTablePrimaryKeys
    }

    Scenario("AllowAllPermissionFilter returns everything") {
      val table = setupTable()

      val results = AllowAllPermissionFilter.doFilter(table, table.primaryKeys, true)

      results shouldEqual table.primaryKeys
    }

    Scenario("Chain filter applies filters in succession") {

      val table = setupTable()
      val filter1 = PermissionFilter("ric", Set("VOD.L", "BT.L"))
      val filter2 = PermissionFilter("onMkt", Set("true"))

      val result = PermissionFilter(List(filter1, filter2)).doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 5
      result.toSet shouldEqual Set("LDN-0001", "LDN-0002", "LDN-0003", "LDN-0008", "NYC-0010")

      //Should get same result when applying in reverse

      val result2 = PermissionFilter(List(filter2, filter1)).doFilter(table, table.primaryKeys, true)

      result2.size shouldEqual result.size
      result2.toSet shouldEqual result.toSet
    }

    Scenario("Chain filter with indices applies filters in succession") {

      val table = setupTable2()
      val filter1 = PermissionFilter("ric", Set("VOD.L", "BT.L"))
      val filter2 = PermissionFilter("onMkt", Set("true"))

      val result = PermissionFilter(List(filter1, filter2)).doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 5
      result.toSet shouldEqual Set("LDN-0001", "LDN-0002", "LDN-0003", "LDN-0008", "NYC-0010")

      //Should get same result when applying in reverse

      val result2 = PermissionFilter(List(filter2, filter1)).doFilter(table, table.primaryKeys, true)

      result2.size shouldEqual result.size
      result2.toSet shouldEqual result.toSet
    }

    Scenario("Basic row filter") {

      val table = setupTable()

      val filter = PermissionFilter((row: RowData) => {
        val ric = row.get("ric")
        ric != null && ric.asInstanceOf[String] != "VOD.L"
      }
      )

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 3
      result.toSet shouldEqual Set("NYC-0004", "LDN-0002", "LDN-0008")
    }

    Scenario("Basic row filter with no input rows") {

      val table = setupTable()

      val filter = PermissionFilter((row: RowData) => {
        val ric = row.get("ric")
        ric != null && ric.asInstanceOf[String] != "VOD.L"
      }
      )

      val result = filter.doFilter(table, EmptyTablePrimaryKeys, false)

      result.size shouldEqual 0
    }

    Scenario("Contains filter with no allowed values") {

      val table = setupTable()

      val filter = PermissionFilter("ric", Set())

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 0
    }

    Scenario("Contains filter with invalid column") {

      val table = setupTable()

      val filter = PermissionFilter("iceCream", Set("vanilla"))

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 0
    }

    Scenario("Contains filter with no input keys") {

      val table = setupTable()

      val filter = PermissionFilter("ric", Set("VOD.L", "BT.L"))

      val result = filter.doFilter(table, EmptyTablePrimaryKeys, true)

      result.size shouldEqual 0
    }

  }

  Feature("Contains filter - String") {

    Scenario("Contains filter with no index") {

      val table = setupTable()

      val filter = PermissionFilter("ric", Set("VOD.L", "BT.L"))

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 6
      result.toSet shouldEqual Set("LDN-0008", "LDN-0001", "LDN-0003", "NYC-0002", "NYC-0010", "LDN-0002")
    }

    Scenario("Contains filter with no index, not first in chain") {

      val table = setupTable()

      val filter = PermissionFilter("ric", Set("VOD.L", "BT.L"))

      val result = filter.doFilter(table, InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0001", "LDN-0003", "NYC-0002", "NYC-0004"))), false)

      result.size shouldEqual 3
      result.toSet shouldEqual Set("LDN-0001", "LDN-0003", "NYC-0002")
    }

    Scenario("Contains filter with index") {

      val table = setupTable2()

      val filter = PermissionFilter("ric", Set("VOD.L", "BT.L"))

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 6
      result.toSet shouldEqual Set("LDN-0008", "LDN-0001", "LDN-0003", "NYC-0002", "NYC-0010", "LDN-0002")
    }

    Scenario("Contains filter with index, not first in chain") {

      val table = setupTable2()

      val filter = PermissionFilter("ric", Set("VOD.L", "BT.L"))

      val result = filter.doFilter(table, InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0001", "LDN-0003", "NYC-0002", "NYC-0004"))), false)

      result.size shouldEqual 3
      result.toSet shouldEqual Set("LDN-0001", "LDN-0003", "NYC-0002")
    }

  }

  Feature("Contains filter - Long") {

    Scenario("Contains filter with no index") {

      val table = setupTable()

      val filter = PermissionFilter("tradeTime", Set("6", "3"))

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 3
      result.toSet shouldEqual Set("LDN-0003", "NYC-0002", "NYC-0010")
    }

    Scenario("Contains filter with no index, not first in chain") {

      val table = setupTable()

      val filter = PermissionFilter("tradeTime", Set("6", "3"))

      val result = filter.doFilter(table, InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0001", "LDN-0003", "NYC-0002", "NYC-0004"))), false)

      result.size shouldEqual 2
      result.toSet shouldEqual Set("LDN-0003", "NYC-0002")
    }

    Scenario("Contains filter with index") {

      val table = setupTable2()

      val filter = PermissionFilter("tradeTime", Set("6", "3"))

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 6
      result.toSet shouldEqual Set("NYC-0011", "NYC-0012", "LDN-0003", "NYC-0002", "NYC-0013", "NYC-0010")
    }

    Scenario("Contains filter with index, not first in chain") {

      val table = setupTable2()

      val filter = PermissionFilter("tradeTime", Set("6", "3"))

      val result = filter.doFilter(table, InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0001", "LDN-0003", "NYC-0002", "NYC-0004"))), false)

      result.size shouldEqual 2
      result.toSet shouldEqual Set("LDN-0003", "NYC-0002")
    }

  }

  Feature("Contains filter - Int") {

    Scenario("Contains filter with no index") {

      val table = setupTable()

      val filter = PermissionFilter("quantity", Set("100"))

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 6
      result.toSet shouldEqual Set("LDN-0008", "LDN-0001", "LDN-0003", "NYC-0002", "NYC-0010", "LDN-0002")
    }

    Scenario("Contains filter with no index, not first in chain") {

      val table = setupTable()

      val filter = PermissionFilter("quantity", Set("100"))

      val result = filter.doFilter(table, InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0001", "LDN-0003", "NYC-0002", "NYC-0004"))), false)

      result.size shouldEqual 3
      result.toSet shouldEqual Set("LDN-0001", "LDN-0003", "NYC-0002")
    }

    Scenario("Contains filter with index") {

      val table = setupTable2()

      val filter = PermissionFilter("quantity", Set("100"))

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 4
      result.toSet shouldEqual Set("LDN-0001", "LDN-0002", "LDN-0008", "NYC-0002")
    }

    Scenario("Contains filter with index, not first in chain") {

      val table = setupTable2()

      val filter = PermissionFilter("quantity", Set("100"))

      val result = filter.doFilter(table, InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0001", "LDN-0003", "NYC-0002", "NYC-0004"))), false)

      result.size shouldEqual 2
      result.toSet shouldEqual Set("LDN-0001", "NYC-0002")
    }

  }

  Feature("Contains filter - Double") {

    Scenario("Contains filter with no index") {

      val table = setupTable()

      val filter = PermissionFilter("price", Set("94.12"))

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 4
      result.toSet shouldEqual Set("LDN-0001", "LDN-0003", "NYC-0002", "NYC-0010")
    }

    Scenario("Contains filter with no index, not first in chain") {

      val table = setupTable()

      val filter = PermissionFilter("price", Set("94.12"))

      val result = filter.doFilter(table, InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0001", "LDN-0003", "NYC-0002", "NYC-0004"))), false)

      result.size shouldEqual 3
      result.toSet shouldEqual Set("LDN-0001", "LDN-0003", "NYC-0002")
    }

    Scenario("Contains filter with index") {

      val table = setupTable2()

      val filter = PermissionFilter("price", Set("94.12"))

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 7
      result.toSet shouldEqual Set("NYC-0011", "LDN-0001", "NYC-0012", "LDN-0003", "NYC-0002", "NYC-0013", "NYC-0010")
    }

    Scenario("Contains filter with index, not first in chain") {

      val table = setupTable2()

      val filter = PermissionFilter("price", Set("94.12"))

      val result = filter.doFilter(table, InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0001", "LDN-0003", "NYC-0002", "NYC-0004"))), false)

      result.size shouldEqual 3
      result.toSet shouldEqual Set("LDN-0001", "LDN-0003", "NYC-0002")
    }

  }

  Feature("Contains filter - Boolean") {

    Scenario("Contains filter with no index") {

      val table = setupTable()

      val filter = PermissionFilter("onMkt", Set("true"))

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 5
      result.toSet shouldEqual Set("LDN-0008", "LDN-0001", "LDN-0003", "NYC-0010", "LDN-0002")
    }

    Scenario("Contains filter with no index, not first in chain") {

      val table = setupTable()

      val filter = PermissionFilter("onMkt", Set("true"))

      val result = filter.doFilter(table, InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0001", "LDN-0003", "NYC-0002", "NYC-0004"))), false)

      result.size shouldEqual 2
      result.toSet shouldEqual Set("LDN-0001", "LDN-0003")
    }

    Scenario("Contains filter with index") {

      val table = setupTable2()

      val filter = PermissionFilter("onMkt", Set("true"))

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 8
      result.toSet shouldEqual Set("NYC-0011", "LDN-0008", "LDN-0001", "NYC-0012", "LDN-0003", "NYC-0013", "NYC-0010", "LDN-0002")
    }

    Scenario("Contains filter with index, not first in chain") {

      val table = setupTable2()

      val filter = PermissionFilter("onMkt", Set("true"))

      val result = filter.doFilter(table, InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0001", "LDN-0003", "NYC-0002", "NYC-0004"))), false)

      result.size shouldEqual 2
      result.toSet shouldEqual Set("LDN-0001", "LDN-0003")
    }

  }

  Feature("Contains filter - Char") {

    Scenario("Contains filter with no index") {

      val table = setupTable()

      val filter = PermissionFilter("side", Set("B"))

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 4
      result.toSet shouldEqual Set("NYC-0004", "LDN-0002", "LDN-0008", "NYC-0010")
    }

    Scenario("Contains filter with no index, not first in chain") {

      val table = setupTable()

      val filter = PermissionFilter("side", Set("B"))

      val result = filter.doFilter(table, InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0001", "LDN-0003", "NYC-0002", "NYC-0004"))), false)

      result.size shouldEqual 1
      result.toSet shouldEqual Set("NYC-0004")
    }

    Scenario("Contains filter with index") {

      val table = setupTable2()

      val filter = PermissionFilter("side", Set("S"))

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 5
      result.toSet shouldEqual Set("NYC-0011", "LDN-0001", "LDN-0003", "NYC-0002", "NYC-0013")
    }

    Scenario("Contains filter with index, not first in chain") {

      val table = setupTable2()

      val filter = PermissionFilter("side", Set("S"))

      val result = filter.doFilter(table, InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0001", "LDN-0003", "NYC-0002", "NYC-0004"))), false)

      result.size shouldEqual 3
      result.toSet shouldEqual Set("LDN-0001", "LDN-0003", "NYC-0002")
    }

  }

  Feature("Contains filter - Epoch Timestamp") {

    Scenario("Contains filter with no index") {
      val clock = TestFriendlyClock(1000L)
      val table = setupTableWithCreationTime(List())(using clock)
      val now = clock.now()
      val filter = PermissionFilter(DefaultColumn.CreatedTime.name, Set(now.toString))

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 2
      result.toSet shouldEqual Set("LDN-0001", "LDN-0008")
    }

    Scenario("Contains filter with no index, not first in chain") {
      val clock = TestFriendlyClock(1000L)
      val table = setupTableWithCreationTime(List())(using clock)
      val now = clock.now()
      val filter = PermissionFilter(DefaultColumn.CreatedTime.name, Set(now.toString))

      val result = filter.doFilter(table, InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0001", "LDN-0003", "NYC-0002", "NYC-0004"))), false)

      result.size shouldEqual 1
      result.toSet shouldEqual Set("LDN-0001")
    }

    Scenario("Contains filter with index") {
      val clock = new TestFriendlyClock(1000L)
      val table = setupTableWithCreationTime(List(DefaultColumn.CreatedTime.name))(using clock)
      val now = clock.now()
      val filter = PermissionFilter(DefaultColumn.CreatedTime.name, Set(now.toString))

      val result = filter.doFilter(table, table.primaryKeys, true)

      result.size shouldEqual 2
      result.toSet shouldEqual Set("LDN-0001", "LDN-0008")
    }

    Scenario("Contains filter with index, not first in chain") {
      val clock = new TestFriendlyClock(1000L)
      val table = setupTableWithCreationTime(List(DefaultColumn.CreatedTime.name))(using clock)
      val now = clock.now()
      val filter = PermissionFilter(DefaultColumn.CreatedTime.name, Set(now.toString))

      val result = filter.doFilter(table, InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0001", "LDN-0003", "NYC-0002", "NYC-0004"))), false)

      result.size shouldEqual 1
      result.toSet shouldEqual Set("LDN-0001")
    }

  }

}
