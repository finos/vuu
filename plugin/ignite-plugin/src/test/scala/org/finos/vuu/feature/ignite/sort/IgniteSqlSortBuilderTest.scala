package org.finos.vuu.feature.ignite.sort

import org.finos.vuu.core.sort.SortDirection
import org.scalatest.featurespec.AnyFeatureSpec

class IgniteSqlSortBuilderTest extends AnyFeatureSpec {

  private val sortBuilder = new IgniteSqlSortBuilder()
  Feature("IgniteSqlSortBuilder") {
    Scenario("can create sql order by clause for ignite columns") {

      val sortSpecInternal = Map("parentOrderId"-> SortDirection.Descending)
      val sortSql = sortBuilder.toSql(sortSpecInternal, _ => Some("orderId"))

      assert(sortSql == "orderId DESC")
    }

    ignore("skip sort if no mapping found to ignite columns") {

      val sortSpecInternal = Map("someTableColumnNotInMap" -> SortDirection.Descending)
      val sortSql = sortBuilder.toSql(sortSpecInternal, _ => None)

      assert(sortSql == "")
    }
  }
}
