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

      val (whereClause, params) = filterFactory.build(
        userSpec = FilterSpec(""),
        permissionSpec = FilterSpec("")
      )

      whereClause shouldEqual ""
      params.isEmpty shouldBe true
    }

    Scenario("Empty user filter, non empty permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val (whereClause, params) = filterFactory.build(
        userSpec = FilterSpec(""),
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      whereClause shouldEqual "WHERE side = 'Buy'"
      params.isEmpty shouldBe true
    }

    Scenario("Empty user filter, composite permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val (whereClause, params) = filterFactory.build(
        userSpec = FilterSpec(""),
        permissionSpec = FilterSpec("side = \"Buy\" and quantity > 0")
      )

      whereClause shouldEqual "WHERE (side = 'Buy' AND quantity > 0)"
      params.isEmpty shouldBe true
    }

    Scenario("Non empty user filter, empty permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val (whereClause, params) = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = FilterSpec("")
      )

      whereClause shouldEqual "WHERE side = 'Sell'"
      params.isEmpty shouldBe true
    }

    Scenario("Non empty user filter, non empty permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val (whereClause, params) = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      whereClause shouldEqual "WHERE (side = 'Buy' AND side = 'Sell')"
      params.isEmpty shouldBe true
    }

    Scenario("Non empty user filter, composite permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val (whereClause, params) = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = FilterSpec("side = \"Buy\" and quantity > 0")
      )

      whereClause shouldEqual "WHERE ((side = 'Buy' AND quantity > 0) AND side = 'Sell')"
      params.isEmpty shouldBe true
    }

    Scenario("Composite user filter, empty permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val (whereClause, params) = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\" and quantity > 100"),
        permissionSpec = FilterSpec("")
      )

      whereClause shouldEqual "WHERE (side = 'Sell' AND quantity > 100)"
      params.isEmpty shouldBe true
    }

    Scenario("Composite user filter, non empty permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val (whereClause, params) = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\" and quantity > 100"),
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      whereClause shouldEqual "WHERE (side = 'Buy' AND (side = 'Sell' AND quantity > 100))"
      params.isEmpty shouldBe true
    }

    Scenario("Composite user filter, composite permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val (whereClause, params) = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\" and quantity > 100"),
        permissionSpec = FilterSpec("side = \"Buy\" and quantity > 0")
      )

      whereClause shouldEqual "WHERE ((side = 'Buy' AND quantity > 0) AND (side = 'Sell' AND quantity > 100))"
      params.isEmpty shouldBe true
    }

  }

  Feature("ClickHouse WHERE clause error handling") {

    Scenario("Both filter specs are null or blank") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val (whereClause, params) = filterFactory.build(
        userSpec = null,
        permissionSpec = null
      )

      whereClause shouldEqual ""
      params.isEmpty shouldBe true

      val (whereClause2, params2) = filterFactory.build(
        userSpec = FilterSpec(null),
        permissionSpec = FilterSpec(null)
      )

      whereClause2 shouldEqual ""
      params2.isEmpty shouldBe true

      val (whereClause3, params3) = filterFactory.build(
        userSpec = FilterSpec("            "),
        permissionSpec = FilterSpec("            ")
      )

      whereClause3 shouldEqual ""
      params3.isEmpty shouldBe true
    }

    Scenario("Both filter specs cannot be parsed") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val (whereClause, params) = filterFactory.build(
        userSpec = FilterSpec("DROP TABLES;"),
        permissionSpec = FilterSpec("DROP COLUMN;")
      )

      whereClause shouldEqual "WHERE 1 = 0"
      params.isEmpty shouldBe true
    }

    Scenario("User filter spec is null or blank") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val (whereClause, params) = filterFactory.build(
        userSpec = null,
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      whereClause shouldEqual "WHERE side = 'Buy'"
      params.isEmpty shouldBe true

      val (whereClause2, params2) = filterFactory.build(
        userSpec = FilterSpec(null),
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      whereClause2 shouldEqual "WHERE side = 'Buy'"
      params2.isEmpty shouldBe true

      val (whereClause3, params3) = filterFactory.build(
        userSpec = FilterSpec("            "),
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      whereClause3 shouldEqual "WHERE side = 'Buy'"
      params3.isEmpty shouldBe true
    }

    Scenario("User filter cannot be parsed") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val (whereClause, params) = filterFactory.build(
        userSpec = FilterSpec("DROP TABLES;"),
        permissionSpec = FilterSpec("")
      )

      whereClause shouldEqual "WHERE 1 = 0"
      params.isEmpty shouldBe true
    }

    Scenario("Permission filter spec is null or blank") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val (whereClause, params) = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = null
      )

      whereClause shouldEqual "WHERE side = 'Sell'"
      params.isEmpty shouldBe true

      val (whereClause2, params2) = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = FilterSpec(null)
      )

      whereClause2 shouldEqual "WHERE side = 'Sell'"
      params2.isEmpty shouldBe true

      val (whereClause3, params3) = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = FilterSpec("            ")
      )

      whereClause3 shouldEqual "WHERE side = 'Sell'"
      params3.isEmpty shouldBe true
    }

    Scenario("Permission filter cannot be parsed") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val (whereClause, params) = filterFactory.build(
        userSpec = FilterSpec(""),
        permissionSpec = FilterSpec("DROP TABLES;")
      )

      whereClause shouldEqual "WHERE 1 = 0"
      params.isEmpty shouldBe true
    }

  }

}
