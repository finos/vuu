package org.finos.vuu.feature.ignite.sort

import org.finos.vuu.core.sort.SortDirection
import org.scalatest.featurespec.AnyFeatureSpec

class IgniteSqlSortBuilderTest extends AnyFeatureSpec {

  private val sortBuilder = new IgniteSqlSortBuilder()
  Feature("IgniteSqlSortBuilder") {
    Scenario("can create sql order by clause for ignite column with different name") {

      val sortSpecInternal = Map("parentOrderId"-> SortDirection.Descending)
      val sortSql = sortBuilder.toSql(sortSpecInternal, _ => Some("orderId"))

      assert(sortSql == "orderId DESC")
    }

    Scenario("can create sql order by clause for multiple ignite columns") {

      val sortSpecInternal = Map(
        "column1" -> SortDirection.Descending,
        "column2" -> SortDirection.Ascending,
      )
      val sortSql = sortBuilder.toSql(sortSpecInternal, x => mapToMatchingIgniteColumn(x))

      assert(sortSql == "column1 DESC, column2 ASC")
    }

    Scenario("skip sort if no mapping found to ignite columns") {

      val sortSpecInternal = Map("someTableColumnNotInMap" -> SortDirection.Descending)
      val sortSql = sortBuilder.toSql(sortSpecInternal, _ => None)

      assert(sortSql == "")
    }
  }

  private def mapToMatchingIgniteColumn(tableColumn:String) = Some(tableColumn)
}
