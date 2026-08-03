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

      val whereClause = filterFactory.build(
        userSpec = FilterSpec(""),
        permissionSpec = FilterSpec("")
      )

      whereClause shouldEqual ""
    }

    Scenario("Empty user filter, non empty permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val whereClause = filterFactory.build(
        userSpec = FilterSpec(""),
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      whereClause shouldEqual "WHERE side = 'Buy'"
    }

    Scenario("Empty user filter, composite permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val whereClause = filterFactory.build(
        userSpec = FilterSpec(""),
        permissionSpec = FilterSpec("side = \"Buy\" and quantity > 0")
      )

      whereClause shouldEqual "WHERE (side = 'Buy' AND quantity > 0)"
    }

    Scenario("Non empty user filter, empty permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val whereClause = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = FilterSpec("")
      )

      whereClause shouldEqual "WHERE side = 'Sell'"
    }

    Scenario("Non empty user filter, non empty permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val whereClause = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      whereClause shouldEqual "WHERE (side = 'Buy' AND side = 'Sell')"
    }

    Scenario("Non empty user filter, composite permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val whereClause = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = FilterSpec("side = \"Buy\" and quantity > 0")
      )

      whereClause shouldEqual "WHERE ((side = 'Buy' AND quantity > 0) AND side = 'Sell')"
    }

    Scenario("Composite user filter, empty permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val whereClause = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\" and quantity > 100"),
        permissionSpec = FilterSpec("")
      )

      whereClause shouldEqual "WHERE (side = 'Sell' AND quantity > 100)"
    }

    Scenario("Composite user filter, non empty permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val whereClause = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\" and quantity > 100"),
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      whereClause shouldEqual "WHERE (side = 'Buy' AND (side = 'Sell' AND quantity > 100))"
    }

    Scenario("Composite user filter, composite permission filter") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val whereClause = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\" and quantity > 100"),
        permissionSpec = FilterSpec("side = \"Buy\" and quantity > 0")
      )

      whereClause shouldEqual "WHERE ((side = 'Buy' AND quantity > 0) AND (side = 'Sell' AND quantity > 100))"
    }

  }

  Feature("ClickHouse WHERE clause error handling") {

    Scenario("Both filter specs are null or blank") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val whereClause = filterFactory.build(
        userSpec = null,
        permissionSpec = null
      )

      whereClause shouldEqual ""

      val whereClause2 = filterFactory.build(
        userSpec = FilterSpec(null),
        permissionSpec = FilterSpec(null)
      )

      whereClause2 shouldEqual ""

      val whereClause3 = filterFactory.build(
        userSpec = FilterSpec("            "),
        permissionSpec = FilterSpec("            ")
      )

      whereClause3 shouldEqual ""
    }

    Scenario("Both filter specs cannot be parsed") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val whereClause = filterFactory.build(
        userSpec = FilterSpec("DROP TABLES;"),
        permissionSpec = FilterSpec("DROP COLUMN;")
      )

      whereClause shouldEqual "WHERE 1 = 0"
    }

    Scenario("User filter spec is null or blank") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val whereClause = filterFactory.build(
        userSpec = null,
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      whereClause shouldEqual "WHERE side = 'Buy'"

      val whereClause2 = filterFactory.build(
        userSpec = FilterSpec(null),
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      whereClause2 shouldEqual "WHERE side = 'Buy'"

      val whereClause3 = filterFactory.build(
        userSpec = FilterSpec("            "),
        permissionSpec = FilterSpec("side = \"Buy\"")
      )

      whereClause3 shouldEqual "WHERE side = 'Buy'"
    }

    Scenario("User filter cannot be parsed") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val whereClause = filterFactory.build(
        userSpec = FilterSpec("DROP TABLES;"),
        permissionSpec = FilterSpec("")
      )

      whereClause shouldEqual "WHERE 1 = 0"
    }

    Scenario("Permission filter spec is null or blank") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val whereClause = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = null
      )

      whereClause shouldEqual "WHERE side = 'Sell'"

      val whereClause2 = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = FilterSpec(null)
      )

      whereClause2 shouldEqual "WHERE side = 'Sell'"

      val whereClause3 = filterFactory.build(
        userSpec = FilterSpec("side = \"Sell\""),
        permissionSpec = FilterSpec("            ")
      )

      whereClause3 shouldEqual "WHERE side = 'Sell'"

    }

    Scenario("Permission filter cannot be parsed") {

      val filterFactory = ClickHouseFilterFactory(tableDef)

      val whereClause = filterFactory.build(
        userSpec = FilterSpec(""),
        permissionSpec = FilterSpec("DROP TABLES;")
      )

      whereClause shouldEqual "WHERE 1 = 0"
    }

  }

}
