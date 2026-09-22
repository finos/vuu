package org.finos.vuu.plugin.virtualized.api

import org.finos.vuu.core.table.DataType
import org.finos.vuu.net.FilterSpec
import org.finos.vuu.viewport.ViewPort
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.time.Duration

class VirtualizedSessionTableDefBuilderTest
  extends AnyFeatureSpec
    with Matchers
    with GivenWhenThen {

  private val col1 = VirtualizedSessionTableColumn("orderId", 0, DataType.StringDataType, "order_id")
  private val col2 = VirtualizedSessionTableColumn("price", 1, DataType.DoubleDataType, "price")

  Feature("Building VirtualizedSessionTableDef instances via Java Builder") {

    Scenario("Building a default SimpleVirtualizedSessionTableDef") {
      Given("a builder populated with basic table configuration")
      val builder = VirtualizedSessionTableDefBuilder.apply()
        .withTableName("orders")
        .withTableKeyField("orderId")
        .addColumn(col1)
        .addColumn(col2)
        .withRefreshRate(Duration.ofMillis(500))

      When("build() is invoked without explicit remote aliases")
      val result = builder.build()

      Then("it should infer and create a SimpleVirtualizedSessionTableDef")
      result shouldBe a[SimpleVirtualizedSessionTableDef]
      val simpleDef = result.asInstanceOf[SimpleVirtualizedSessionTableDef]

      And("the properties should match the provided values")
      simpleDef.tableName shouldBe "orders"
      simpleDef.tableKeyField shouldBe "orderId"
      simpleDef.getRemoteColumns should contain theSameElementsInOrderAs Array(col1, col2)
      simpleDef.getRefreshRateMillis shouldBe 500L
    }

    Scenario("Explicitly building a simple table definition via buildSimple()") {
      Given("a builder configured with only mandatory fields")
      val builder = VirtualizedSessionTableDefBuilder.apply()
        .withTableName("orders")
        .withTableKeyField("orderId")

      When("buildSimple() is invoked")
      val simpleDef = builder.buildSimple()

      Then("a SimpleVirtualizedSessionTableDef should be returned with empty columns")
      simpleDef.tableName shouldBe "orders"
      simpleDef.tableKeyField shouldBe "orderId"
      simpleDef.getRemoteColumns shouldBe empty
    }

    Scenario("Inferring AliasedVirtualizedSessionTableDef when remote fields differ") {
      Given("a builder with distinct remote table and key configurations")
      val builder = VirtualizedSessionTableDefBuilder.apply()
        .withTableName("localOrders")
        .withTableKeyField("localId")
        .withRemoteName("remote_orders_v2")
        .withRemoteKeyField("remote_id")

      When("build() is invoked")
      val result = builder.build()

      Then("it should infer and create an AliasedVirtualizedSessionTableDef")
      result shouldBe a[AliasedVirtualizedSessionTableDef]
      val aliasedDef = result.asInstanceOf[AliasedVirtualizedSessionTableDef]

      And("both local and remote identifiers should be properly set")
      aliasedDef.tableName shouldBe "localOrders"
      aliasedDef.tableKeyField shouldBe "localId"
      aliasedDef.getRemoteTableName shouldBe "remote_orders_v2"
      aliasedDef.getRemoteKeyField shouldBe "remote_id"
    }

    Scenario("Explicitly building via buildAliased() with partial fallback") {
      Given("a builder configured with a remote key field but no remote name")
      val builder = VirtualizedSessionTableDefBuilder.apply()
        .withTableName("orders")
        .withTableKeyField("id")
        .withRemoteKeyField("remote_id")

      When("buildAliased() is called")
      val aliasedDef = builder.buildAliased()

      Then("the remote table name should fall back to the local table name")
      aliasedDef.getRemoteTableName shouldBe "orders"
      aliasedDef.getRemoteKeyField shouldBe "remote_id"
      aliasedDef.tableName shouldBe "orders"
      aliasedDef.tableKeyField shouldBe "id"
    }

    Scenario("Setting custom permission filter spec function") {
      Given("a custom viewport filter function")
      val customFilterFunc: ViewPort => FilterSpec = _ => FilterSpec("user.role == 'TRADER'")

      When("the builder is supplied with the permission filter spec")
      val tableDef = VirtualizedSessionTableDefBuilder.apply()
        .withTableName("orders")
        .withTableKeyField("id")
        .withPermissionFilterSpec(customFilterFunc)
        .buildSimple()

      Then("the resulting instance should contain the function")
      tableDef.getRemotePermissionFilterSpecFunction shouldBe customFilterFunc
    }

    Scenario("Validating missing required fields") {
      Given("a builder missing the table name")
      val builderWithoutTable = VirtualizedSessionTableDefBuilder.apply().withTableKeyField("id")

      Then("building should throw a IllegalArgumentException")
      an[IllegalArgumentException] should be thrownBy builderWithoutTable.build()

      Given("a builder missing the table key field")
      val builderWithoutKey = VirtualizedSessionTableDefBuilder.apply().withTableName("orders")

      Then("building should throw a IllegalArgumentException")
      an[IllegalArgumentException] should be thrownBy builderWithoutKey.build()
    }
  }
}