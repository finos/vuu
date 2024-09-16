package org.finos.vuu.core.sort;

import org.finos.vuu.core.auths.RowPermissionChecker
import org.finos.vuu.core.sort.FilterAndSortFixture.setupTable
import org.finos.vuu.core.table.RowData
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers;

class RowPermissionFilterTest extends AnyFeatureSpec with Matchers {
    private val data = setupTable()

    Feature("Row Permission Filter") {
        Scenario("Should return all rows based with always happy permission checker") {
            val rowPermissionFilter = RowPermissionFilter(AlwaysHappyRowPermissionChecker())
            rowPermissionFilter.dofilter(data, data.primaryKeys, data.viewPortColumns) should contain theSameElementsAs data.primaryKeys
        }

        Scenario("Should filter out all rows based with always sad permission checker") {
            val rowPermissionFilter = RowPermissionFilter(AlwaysSadRowPermissionChecker())
            rowPermissionFilter.dofilter(data, data.primaryKeys, data.viewPortColumns) should be(empty)
        }

        Scenario("Should handle error and return no rows with always error permission checker") {
            val rowPermissionFilter = RowPermissionFilter(AlwaysErrorRowPermissionChecker())
            rowPermissionFilter.dofilter(data, data.primaryKeys, data.viewPortColumns) should be(empty)
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