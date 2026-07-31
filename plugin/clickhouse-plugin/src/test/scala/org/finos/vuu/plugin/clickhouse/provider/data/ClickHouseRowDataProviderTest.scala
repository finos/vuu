package org.finos.vuu.plugin.clickhouse.provider.data

import com.clickhouse.client.api.ServerException
import com.dimafeng.testcontainers.ForAllTestContainer
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.plugin.clickhouse.ClickHouseContainer
import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.clickhouse.client.options.ClickHouseClientOptions
import org.finos.vuu.plugin.virtualized.api.{AliasedVirtualizedSessionTableDef, VirtualizedSessionTableColumnBuilder, VirtualizedSessionTableDef}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class ClickHouseRowDataProviderTest extends AnyFeatureSpec with GivenWhenThen with Matchers with ForAllTestContainer {

  override val container: ClickHouseContainer = ClickHouseContainer()

  Feature("Test we can get row data from ClickHouse") {

    Scenario("Get data with no where clause or order by") {

      given metrics: MetricsProvider = MetricsProviderImpl()
      given timeProvider: Clock = DefaultClock()
      given lifecycle: LifecycleContainer = LifecycleContainer()
      val (client, tableDef) = createClientTableAndTableDef()
      val clickHouseRowDataProvider = ClickHouseRowDataProvider(client, tableDef)
      val vpColumns = ViewPortColumnCreator.create(tableDef)

      val data = clickHouseRowDataProvider.queryForRowData(vpColumns,
        whereClause = "",
        orderBy = "",
        offset = 0,
        limit = 100)

      data.size shouldEqual 5

      stopClient()
    }

    Scenario("Get data with no where clause but order by") {

      given metrics: MetricsProvider = MetricsProviderImpl()

      given timeProvider: Clock = DefaultClock()

      given lifecycle: LifecycleContainer = LifecycleContainer()

      val (client, tableDef) = createClientTableAndTableDef()
      val clickHouseRowDataProvider = ClickHouseRowDataProvider(client, tableDef)
      val vpColumns = ViewPortColumnCreator.create(tableDef)

      val data = clickHouseRowDataProvider.queryForRowData(vpColumns,
        whereClause = "",
        orderBy = "ORDER BY id DESC",
        offset = 0,
        limit = 100)

      data.size shouldEqual 5
      val first = data.head
      first.key shouldEqual "5"
      first.data("id") shouldEqual "5"
      first.data("val") shouldEqual "mikey"

      stopClient()
    }

    Scenario("Get data with where clause but no order by") {

      given metrics: MetricsProvider = MetricsProviderImpl()

      given timeProvider: Clock = DefaultClock()

      given lifecycle: LifecycleContainer = LifecycleContainer()

      val (client, tableDef) = createClientTableAndTableDef()
      val clickHouseRowDataProvider = ClickHouseRowDataProvider(client, tableDef)
      val vpColumns = ViewPortColumnCreator.create(tableDef)

      val data = clickHouseRowDataProvider.queryForRowData(vpColumns,
        whereClause =  "WHERE val = 'world'",
        orderBy = "",
        offset = 0,
        limit = 100)

      data.size shouldEqual 1
      val first = data.head
      first.key shouldEqual "2"
      first.data("id") shouldEqual "2"
      first.data("val") shouldEqual "world"

      stopClient()
    }

    Scenario("Get data with where clause and order by") {

      given metrics: MetricsProvider = MetricsProviderImpl()

      given timeProvider: Clock = DefaultClock()

      given lifecycle: LifecycleContainer = LifecycleContainer()

      val (client, tableDef) = createClientTableAndTableDef()
      val clickHouseRowDataProvider = ClickHouseRowDataProvider(client, tableDef)
      val vpColumns = ViewPortColumnCreator.create(tableDef)

      val data = clickHouseRowDataProvider.queryForRowData(vpColumns,
        whereClause = "WHERE val like '%o%'",
        orderBy = "ORDER BY id DESC",
        offset = 0,
        limit = 100)

      data.size shouldEqual 2
      val first = data.head
      first.key shouldEqual "2"
      first.data("id") shouldEqual "2"
      first.data("val") shouldEqual "world"

      stopClient()
    }

    Scenario("Get data with where clause and order by and offset") {

      given metrics: MetricsProvider = MetricsProviderImpl()

      given timeProvider: Clock = DefaultClock()

      given lifecycle: LifecycleContainer = LifecycleContainer()

      val (client, tableDef) = createClientTableAndTableDef()
      val clickHouseRowDataProvider = ClickHouseRowDataProvider(client, tableDef)
      val vpColumns = ViewPortColumnCreator.create(tableDef)

      val data = clickHouseRowDataProvider.queryForRowData(vpColumns,
        whereClause = "WHERE val like '%o%'",
        orderBy = "ORDER BY id DESC",
        offset = 1,
        limit = 100)

      data.size shouldEqual 1
      val first = data.head
      first.key shouldEqual "1"
      first.data("id") shouldEqual "1"
      first.data("val") shouldEqual "hello"

      stopClient()
    }

    Scenario("Get data with where clause and order by and limit lower than row count") {

      given metrics: MetricsProvider = MetricsProviderImpl()

      given timeProvider: Clock = DefaultClock()

      given lifecycle: LifecycleContainer = LifecycleContainer()

      val (client, tableDef) = createClientTableAndTableDef()
      val clickHouseRowDataProvider = ClickHouseRowDataProvider(client, tableDef)
      val vpColumns = ViewPortColumnCreator.create(tableDef)

      val data = clickHouseRowDataProvider.queryForRowData(vpColumns,
        whereClause = "WHERE val like '%o%'",
        orderBy = "ORDER BY id DESC",
        offset = 0,
        limit = 1)

      data.size shouldEqual 1
      val first = data.head
      first.key shouldEqual "2"
      first.data("id") shouldEqual "2"
      first.data("val") shouldEqual "world"

      stopClient()
    }

  }

  Feature("Test error handling") {

    Scenario("Get data with invalid where clause") {

      given metrics: MetricsProvider = MetricsProviderImpl()

      given timeProvider: Clock = DefaultClock()

      given lifecycle: LifecycleContainer = LifecycleContainer()

      val (client, tableDef) = createClientTableAndTableDef()
      val clickHouseRowDataProvider = ClickHouseRowDataProvider(client, tableDef)
      val vpColumns = ViewPortColumnCreator.create(tableDef)

      val ex = intercept[RuntimeException] {
        clickHouseRowDataProvider.queryForRowData(vpColumns,
          whereClause = "I am not valid SQL",
          orderBy = "",
          offset = 0,
          limit = 100)
      }

      ex.getMessage should startWith("Unexpected error fetching records for SQL")
      ex.getCause shouldBe a [ServerException]

      stopClient()
    }

    Scenario("Get data with invalid order by") {

      given metrics: MetricsProvider = MetricsProviderImpl()

      given timeProvider: Clock = DefaultClock()

      given lifecycle: LifecycleContainer = LifecycleContainer()

      val (client, tableDef) = createClientTableAndTableDef()
      val clickHouseRowDataProvider = ClickHouseRowDataProvider(client, tableDef)
      val vpColumns = ViewPortColumnCreator.create(tableDef)

      val ex = intercept[RuntimeException] {
        clickHouseRowDataProvider.queryForRowData(vpColumns,
          whereClause = "",
          orderBy = "I am not valid SQL",
          offset = 0,
          limit = 100)
      }

      ex.getMessage should startWith("Unexpected error fetching records for SQL")
      ex.getCause shouldBe a [ServerException]

      stopClient()
    }

  }

  private def createClientTableAndTableDef()(using lifecycle: LifecycleContainer): (ClickHouseClient, VirtualizedSessionTableDef) = {
    val client = ClickHouseClient(ClickHouseClientOptions()
      .withEndpoint(container.getEndpoint)
      .withUsername(container.getDefaultUsername)
      .withPassword(container.getDefaultPassword))

    lifecycle.start()

    //Drop table if exists
    client.executeUpdate("DROP TABLE IF EXISTS test_table")

    // Create table
    client.executeUpdate(
      """
        |CREATE TABLE IF NOT EXISTS test_table (
        |  id String,
        |  val String
        |) ENGINE = MergeTree() ORDER BY id
        |""".stripMargin
    )

    // Insert data
    client.executeUpdate("INSERT INTO test_table (id, val) VALUES" +
      "('1', 'hello'), " +
      "('2', 'world'), " +
      "('3', 'it''s'), " +
      "('4', 'me'), " +
      "('5', 'mikey')"
    )

    val tableDef = AliasedVirtualizedSessionTableDef(
      tableName = "testTable",
      remoteName = "test_table",
      remoteKeyField = "id",
      tableKeyField = "id",
      remoteColumns = VirtualizedSessionTableColumnBuilder()
        .addString("id")
        .addString("val")
        .build()
    )

    (client, tableDef)
  }

  private def stopClient()(using lifecycle: LifecycleContainer): Unit = {
    lifecycle.thread.stop()
    lifecycle.stop()
  }

}