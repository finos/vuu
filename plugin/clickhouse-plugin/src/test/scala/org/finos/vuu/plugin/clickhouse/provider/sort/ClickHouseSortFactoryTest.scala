package org.finos.vuu.plugin.clickhouse.provider.sort

import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.net.{SortDef, SortSpec}
import org.finos.vuu.plugin.virtualized.api.{AliasedVirtualizedSessionTableDef, VirtualizedSessionTableColumnBuilder}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class ClickHouseSortFactoryTest extends AnyFeatureSpec with GivenWhenThen with Matchers {

  private val tableDef = AliasedVirtualizedSessionTableDef(
    tableName = "orderHistory",
    tableKeyField = "orderId",
    remoteName = "order_history",
    remoteKeyField = "order_id",
    remoteColumns = VirtualizedSessionTableColumnBuilder()
      .addString("orderId", "order_id")
      .addInt("quantity")
      .addDouble("price")
      .addString("counterparty")
      .build()
  )

  private val columns = tableDef.remoteColumns.toList

  Feature("ClickHouse ORDER BY clause generation") {

    Scenario("Handling null or empty sort specifications") {
      Given("a null SortSpec object")
      val nullSpec: SortSpec = null

      When("building the sort query string")
      val nullResult = ClickHouseSortFactory.build(tableDef, columns, nullSpec)

      Then("it should return the keyField")
      nullResult shouldBe "ORDER BY order_id ASC"

      And("given an empty SortSpec object with no definitions")
      val emptySpec = SortSpec(List.empty)

      When("building the sort query string")
      val emptyResult = ClickHouseSortFactory.build(tableDef, columns, emptySpec)

      Then("it should return the keyField")
      emptyResult shouldBe "ORDER BY order_id ASC"
    }

    Scenario("Generating a single column ascending sort") {
      Given("a SortSpec for a single column with ASCENDING direction")
      val spec = SortSpec(List(
        SortDef("quantity", SortDirection.ASCENDING.external)
      ))

      When("building the sort query string")
      val result = ClickHouseSortFactory.build(tableDef, columns, spec)

      Then("it should format a valid single-column + key field ORDER BY clause")
      result shouldBe "ORDER BY quantity ASC, order_id ASC"
    }

    Scenario("Generating a single column sort with an alias") {
      Given("a SortSpec for a single column with DESCENDING direction")
      val spec = SortSpec(List(
        SortDef("orderId", SortDirection.DESCENDING.external)
      ))

      When("building the sort query string")
      val result = ClickHouseSortFactory.build(tableDef, columns, spec)

      Then("it should format a valid single-column ORDER BY clause using the remote name")
      result shouldBe "ORDER BY order_id DESC"
    }

    Scenario("Generating a single column sort with an invalid column") {
      Given("a SortSpec for a single column with an invalid name")
      val spec = SortSpec(List(
        SortDef("lolcats", SortDirection.ASCENDING.external)
      ))

      When("building the sort query string")
      val result = ClickHouseSortFactory.build(tableDef, columns, spec)

      Then("it should return primary key sort as the mapping is missing")
      result shouldBe "ORDER BY order_id ASC"
    }

    Scenario("Generating a multi-column mixed direction sort") {
      Given("a SortSpec with multiple columns spanning mixed directions")
      val spec = SortSpec(List(
        SortDef("price", SortDirection.DESCENDING.external),
        SortDef("counterparty", SortDirection.ASCENDING.external)
      ))

      When("building the sort query string")
      val result = ClickHouseSortFactory.build(tableDef, columns, spec)

      Then("it should chain the columns separated by commas with matching keywords")
      result shouldBe "ORDER BY price DESC, counterparty ASC, order_id ASC"
    }

  }
}