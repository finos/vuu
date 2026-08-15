package org.finos.vuu.plugin.clickhouse.provider.filter

import org.finos.vuu.net.FilterSpec
import org.finos.vuu.plugin.virtualized.api.{AliasedVirtualizedSessionTableDef, VirtualizedSessionTableColumnBuilder}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class ClickHouseFilterFactoryTest extends AnyFeatureSpec with Matchers {

  private val tableDef = AliasedVirtualizedSessionTableDef(
    tableName = "orderHistory",
    tableKeyField = "orderId",
    remoteName = "order_history",
    remoteKeyField = "order_id",
    remoteColumns = VirtualizedSessionTableColumnBuilder()
      .addString("orderId", "order_id")
      .addInt("quantity")
      .addString("side")
      .build()
  )

  Feature("ClickHouse WHERE clause generation") {

    Scenario("Empty user filter, empty permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val clauseWithParams = filterFactory.build(
        userSpec = FilterSpec(""),
        permissionSpec = FilterSpec("")
      )

      clauseWithParams.clause shouldEqual ""
      clauseWithParams.params.isEmpty shouldBe true
    }

    Scenario("Empty user filter, non empty permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val clauseWithParams = filterFactory.build(
        userSpec = FilterSpec(""),
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      clauseWithParams.clause shouldEqual "WHERE side = 'Buy'"
      clauseWithParams.params.isEmpty shouldBe true
    }

    Scenario("Empty user filter, composite permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val clauseWithParams = filterFactory.build(
        userSpec = FilterSpec(""),
        permissionSpec = FilterSpec("side = \"Buy\" and quantity > 0")
      )

      clauseWithParams.clause shouldEqual "WHERE (side = 'Buy' AND quantity > 0)"
      clauseWithParams.params.isEmpty shouldBe true
    }

    Scenario("Non empty user filter, empty permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val clauseWithParams = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = FilterSpec("")
      )

      clauseWithParams.clause shouldEqual "WHERE side = 'Sell'"
      clauseWithParams.params.isEmpty shouldBe true
    }

    Scenario("Non empty user filter, non empty permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val clauseWithParams = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      clauseWithParams.clause shouldEqual "WHERE (side = 'Buy' AND side = 'Sell')"
      clauseWithParams.params.isEmpty shouldBe true
    }

    Scenario("Non empty user filter, composite permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val clauseWithParams = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = FilterSpec("side = \"Buy\" and quantity > 0")
      )

      clauseWithParams.clause shouldEqual "WHERE ((side = 'Buy' AND quantity > 0) AND side = 'Sell')"
      clauseWithParams.params.isEmpty shouldBe true
    }

    Scenario("Composite user filter, empty permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val clauseWithParams = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\" and quantity > 100"),
        permissionSpec = FilterSpec("")
      )

      clauseWithParams.clause shouldEqual "WHERE (side = 'Sell' AND quantity > 100)"
      clauseWithParams.params.isEmpty shouldBe true
    }

    Scenario("Composite user filter, non empty permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val clauseWithParams = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\" and quantity > 100"),
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      clauseWithParams.clause shouldEqual "WHERE (side = 'Buy' AND (side = 'Sell' AND quantity > 100))"
      clauseWithParams.params.isEmpty shouldBe true
    }

    Scenario("Composite user filter, composite permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val clauseWithParams = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\" and quantity > 100"),
        permissionSpec = FilterSpec("side = \"Buy\" and quantity > 0")
      )

      clauseWithParams.clause shouldEqual "WHERE ((side = 'Buy' AND quantity > 0) AND (side = 'Sell' AND quantity > 100))"
      clauseWithParams.params.isEmpty shouldBe true
    }

  }

  Feature("ClickHouse WHERE clause error handling") {

    Scenario("Both filter specs are null or blank") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val clauseWithParams = filterFactory.build(
        userSpec = null,
        permissionSpec = null
      )

      clauseWithParams.clause shouldEqual ""
      clauseWithParams.params.isEmpty shouldBe true

      val clauseWithParams2 = filterFactory.build(
        userSpec = FilterSpec(null),
        permissionSpec = FilterSpec(null)
      )

      clauseWithParams2.clause shouldEqual ""
      clauseWithParams2.params.isEmpty shouldBe true

      val clauseWithParams3 = filterFactory.build(
        userSpec = FilterSpec("            "),
        permissionSpec = FilterSpec("            ")
      )

      clauseWithParams3.clause shouldEqual ""
      clauseWithParams3.params.isEmpty shouldBe true
    }

    Scenario("Both filter specs cannot be parsed") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val clauseWithParams = filterFactory.build(
        userSpec = FilterSpec("DROP TABLES;"),
        permissionSpec = FilterSpec("DROP COLUMN;")
      )

      clauseWithParams.clause shouldEqual "WHERE 1 = 0"
      clauseWithParams.params.isEmpty shouldBe true
    }

    Scenario("User filter spec is null or blank") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val clauseWithParams = filterFactory.build(
        userSpec = null,
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      clauseWithParams.clause shouldEqual "WHERE side = 'Buy'"
      clauseWithParams.params.isEmpty shouldBe true

      val clauseWithParams2 = filterFactory.build(
        userSpec = FilterSpec(null),
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      clauseWithParams2.clause shouldEqual "WHERE side = 'Buy'"
      clauseWithParams2.params.isEmpty shouldBe true

      val clauseWithParams3 = filterFactory.build(
        userSpec = FilterSpec("            "),
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      clauseWithParams3.clause shouldEqual "WHERE side = 'Buy'"
      clauseWithParams3.params.isEmpty shouldBe true
    }

    Scenario("User filter cannot be parsed") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val clauseWithParams = filterFactory.build(
        userSpec = FilterSpec("DROP TABLES;"),
        permissionSpec = FilterSpec("")
      )

      clauseWithParams.clause shouldEqual "WHERE 1 = 0"
      clauseWithParams.params.isEmpty shouldBe true
    }

    Scenario("Permission filter spec is null or blank") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val clauseWithParams = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = null
      )

      clauseWithParams.clause shouldEqual "WHERE side = 'Sell'"
      clauseWithParams.params.isEmpty shouldBe true

      val clauseWithParams2 = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = FilterSpec(null)
      )

      clauseWithParams2.clause shouldEqual "WHERE side = 'Sell'"
      clauseWithParams2.params.isEmpty shouldBe true

      val clauseWithParams3 = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = FilterSpec("            ")
      )

      clauseWithParams3.clause shouldEqual "WHERE side = 'Sell'"
      clauseWithParams3.params.isEmpty shouldBe true
    }

    Scenario("Permission filter cannot be parsed") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val clauseWithParams = filterFactory.build(
        userSpec = FilterSpec(""),
        permissionSpec = FilterSpec("DROP TABLES;")
      )

      clauseWithParams.clause shouldEqual "WHERE 1 = 0"
      clauseWithParams.params.isEmpty shouldBe true
    }

  }

}
