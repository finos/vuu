package org.finos.vuu.plugin.clickhouse.provider.sort

import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.net.{SortDef, SortSpec}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.GivenWhenThen

class ClickHouseSortFactoryTest extends AnyFeatureSpec with GivenWhenThen with Matchers {

  Feature("ClickHouse ORDER BY clause generation") {

    Scenario("Handling null or empty sort specifications") {
      Given("a null SortSpec object")
      val nullSpec: SortSpec = null

      When("building the sort query string")
      val nullResult = ClickHouseSortFactory.build(nullSpec)

      Then("it should return an empty string")
      nullResult shouldBe ""

      And("given an empty SortSpec object with no definitions")
      val emptySpec = SortSpec(List.empty)

      When("building the sort query string")
      val emptyResult = ClickHouseSortFactory.build(emptySpec)

      Then("it should also return an empty string")
      emptyResult shouldBe ""
    }

    Scenario("Generating a single column ascending sort") {
      Given("a SortSpec for a single column with ASCENDING direction")
      val spec = SortSpec(List(
        SortDef("quantity", SortDirection.ASCENDING.external)
      ))

      When("building the sort query string")
      val result = ClickHouseSortFactory.build(spec)

      Then("it should format a valid single-column ORDER BY clause")
      result shouldBe "ORDER BY quantity ASC"
    }

    Scenario("Generating a multi-column mixed direction sort") {
      Given("a SortSpec with multiple columns spanning mixed directions")
      val spec = SortSpec(List(
        SortDef("price", SortDirection.DESCENDING.external),
        SortDef("counterparty", SortDirection.ASCENDING.external)
      ))

      When("building the sort query string")
      val result = ClickHouseSortFactory.build(spec)

      Then("it should chain the columns separated by commas with matching keywords")
      result shouldBe "ORDER BY price DESC, counterparty ASC"
    }

    Scenario("Validating caching memoization behavior") {
      Given("a specific complex SortSpec configuration")
      val spec = SortSpec(List(
        SortDef("orderId", SortDirection.ASCENDING.external)
      ))

      When("building the sort query string for the first time")
      val resultFirstRun = ClickHouseSortFactory.build(spec)

      And("building the query string using the exact same spec reference again")
      val resultSecondRun = ClickHouseSortFactory.build(spec)

      Then("the outputs must match exactly")
      resultFirstRun shouldBe "ORDER BY orderId ASC"
      resultSecondRun shouldBe resultFirstRun
    }
  }
}