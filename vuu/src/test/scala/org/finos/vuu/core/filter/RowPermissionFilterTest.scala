package org.finos.vuu.core.filter

import org.finos.vuu.core.auths.RowPermissionChecker
import org.finos.vuu.core.sort.FilterAndSortFixture.setupTable
import org.finos.vuu.core.sort.RowPermissionFilter
import org.finos.vuu.core.table.RowData
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers;

class RowPermissionFilterTest extends AnyFeatureSpec with Matchers {
    private val data = setupTable()

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
            rowPermissionFilter.dofilter(data, data.primaryKeys, null).size should equal(3)
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