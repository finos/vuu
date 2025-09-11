package org.finos.vuu.core.filter

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.auths.RowPermissionChecker
import org.finos.vuu.core.sort.FilterAndSortFixture.{now, setupTable, setupTableWithCreationTime}
import org.finos.vuu.core.sort.{FrozenTimeFilter, RowPermissionAndFrozenTimeFilter, RowPermissionFilter}
import org.finos.vuu.core.table.RowData
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers;

class DefaultFilterTest extends AnyFeatureSpec with Matchers {
    private val data = setupTable()
  private val dataWithCreationTime = setupTableWithCreationTime()

    Feature("Row Permission Filter") {
        Scenario("Should return all rows based with always happy permission checker") {
            val rowPermissionFilter = RowPermissionFilter(AlwaysHappyRowPermissionChecker())
            rowPermissionFilter.dofilter(data, data.primaryKeys, null) should contain theSameElementsAs data.primaryKeys
        }

        Scenario("Should filter out all rows based with always sad permission checker") {
            val rowPermissionFilter = RowPermissionFilter(AlwaysSadRowPermissionChecker())
            rowPermissionFilter.dofilter(data, data.primaryKeys, null) should be(empty)
        }

        Scenario("Should handle error and return no rows with always error permission checker") {
            val rowPermissionFilter = RowPermissionFilter(AlwaysErrorRowPermissionChecker())
            rowPermissionFilter.dofilter(data, data.primaryKeys, null) should be(empty)
        }

        Scenario("Should return rows for a given trader") {
            val rowPermissionFilter = RowPermissionFilter(AllowSpecificTraderRowPermissionChecker("steve"))
          val expected = InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0002", "NYC-0002", "NYC-0010")))
            rowPermissionFilter.dofilter(data, data.primaryKeys, null) should contain theSameElementsAs expected
        }
    }

  Feature("Frozen Time Filter") {
    Scenario("Should only return rows created before frozen time") {
      val filter = FrozenTimeFilter(now)
      val expected = InMemTablePrimaryKeys(ImmutableArray.from(Array("NYC-0004", "LDN-0003")))
      filter.dofilter(dataWithCreationTime, dataWithCreationTime.primaryKeys, null) should contain theSameElementsAs expected
    }
  }

  Feature("Row Permission And Frozen Time Filter") {
    Scenario("Should only return permitted rows created before frozen time") {
      val filter = RowPermissionAndFrozenTimeFilter(AllowSpecificTraderRowPermissionChecker("steve"), now)
      val expected = InMemTablePrimaryKeys(ImmutableArray.from(Array("LDN-0003")))
      filter.dofilter(dataWithCreationTime, dataWithCreationTime.primaryKeys, null) should contain theSameElementsAs expected
    }
  }
}

case class AlwaysHappyRowPermissionChecker() extends RowPermissionChecker {
    override def canSeeRow(row: RowData): Boolean = true
}

case class AlwaysSadRowPermissionChecker() extends RowPermissionChecker {
    override def canSeeRow(row: RowData): Boolean = false
}

case class AlwaysErrorRowPermissionChecker() extends RowPermissionChecker {
    override def canSeeRow(row: RowData): Boolean = throw new RuntimeException("Error as always")
}

case class AllowSpecificTraderRowPermissionChecker(trader: String) extends RowPermissionChecker {
    override def canSeeRow(row: RowData): Boolean = {
        row.get("trader").equals(trader)
    }
}