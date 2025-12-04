package org.finos.vuu.core.filter.`type`

import org.finos.vuu.core.sort.FilterAndSortFixture.{setupTable, setupTableWithCreationTime}
import org.finos.vuu.viewport.ViewPortColumns
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class BaseFilterTest extends AnyFeatureSpec with Matchers {

  Feature("Applying base filters") {

    Scenario("No freeze filter") {

      val table = setupTable()
      val permissionFilter = PermissionFilter("ric", Set("VOD.L","AAPL.L"))
      val baseFilter = BaseFilter.apply(permissionFilter, Option.empty)

      val results = baseFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), true)

      results.length shouldEqual 5
      results.toSet shouldEqual Set("NYC-0004", "LDN-0001", "LDN-0003", "NYC-0002", "NYC-0010")
    }

    Scenario("Freeze filter applied") {

      val table = setupTableWithCreationTime()
      val permissionFilter = PermissionFilter("ric", Set("VOD.L","AAPL.L"))
      val baseFilter = BaseFilter(permissionFilter, Option(10001L))

      val results = baseFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), true)

      results.length shouldEqual 2
      results.toSet shouldEqual Set("NYC-0004", "LDN-0003")
    }

    Scenario("Freeze filter with allow all permission filter") {

      val table = setupTableWithCreationTime()
      val baseFilter = BaseFilter(AllowAllPermissionFilter, Option(10002L))

      val results = baseFilter.doFilter(table, table.primaryKeys, ViewPortColumns(table.columns().toList), true)

      results.length shouldEqual 4
      results.toSet shouldEqual Set("NYC-0004", "LDN-0001", "LDN-0003", "LDN-0008")
    }

  }

}
