package org.finos.vuu.plugin.clickhouse.provider.data

import com.dimafeng.testcontainers.ForAllTestContainer
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.plugin.clickhouse.ClickHouseContainer
import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.clickhouse.client.options.ClickHouseClientOptions
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util

class ClickHouseTableSizeProviderTest extends AnyFeatureSpec with GivenWhenThen with Matchers with ForAllTestContainer {

  override val container: ClickHouseContainer = ClickHouseContainer()

  Feature("Test we can get a table size from ClickHouse") {

    Scenario("Get size of a table with no where clause") {

      given metrics: MetricsProvider = MetricsProviderImpl()
      given timeProvider: Clock = DefaultClock()
      given lifecycle: LifecycleContainer = LifecycleContainer()
      val client = createClientAndTable()
      val clickHouseTableSizeProvider = ClickHouseTableSizeProvider(client, "test_table")

      val size = clickHouseTableSizeProvider.getTableSize("", util.Map.of())
      size shouldEqual 2

      stopClient()
    }

    Scenario("Get size of a table with a where clause") {

      given metrics: MetricsProvider = MetricsProviderImpl()
      given timeProvider: Clock = DefaultClock()
      given lifecycle: LifecycleContainer = LifecycleContainer()
      val client = createClientAndTable()
      val clickHouseTableSizeProvider = ClickHouseTableSizeProvider(client, "test_table")

      val size = clickHouseTableSizeProvider.getTableSize(
        whereClause = "WHERE val = {p_1:String}",
        params = util.Map.of("p_1", "world"),
      )
      size shouldEqual 1

      stopClient()
    }

    Scenario("Get size of a table that doesn't exist") {

      given metrics: MetricsProvider = MetricsProviderImpl()
      given timeProvider: Clock = DefaultClock()
      given lifecycle: LifecycleContainer = LifecycleContainer()
      val client = createClientAndTable()
      val clickHouseTableSizeProvider = ClickHouseTableSizeProvider(client, "lolcats")

      a[RuntimeException] should be thrownBy {
        clickHouseTableSizeProvider.getTableSize("", util.Map.of())
      }

      stopClient()
    }

  }

  private def createClientAndTable()(using lifecycle: LifecycleContainer): ClickHouseClient = {
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
    client.executeUpdate("INSERT INTO test_table (id, val) VALUES ('1', 'hello'), ('2', 'world')")

    client
  }

  private def stopClient()(using lifecycle: LifecycleContainer): Unit = {
    lifecycle.thread.stop()
    lifecycle.stop()
  }

}