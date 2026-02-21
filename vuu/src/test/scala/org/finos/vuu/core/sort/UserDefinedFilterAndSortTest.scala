package org.finos.vuu.core.sort

import org.finos.vuu.core.filter.NoFilter
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util.Objects

class UserDefinedFilterAndSortTest extends AnyFeatureSpec with Matchers {

  Feature("Boilerplate") {

    Scenario("Hashcode") {
      val userDefinedFilterAndSort = UserDefinedFilterAndSort(NoFilter, NoSort)

      Objects.hash(NoFilter, NoSort) shouldEqual userDefinedFilterAndSort.hashCode()
    }

  }

}
