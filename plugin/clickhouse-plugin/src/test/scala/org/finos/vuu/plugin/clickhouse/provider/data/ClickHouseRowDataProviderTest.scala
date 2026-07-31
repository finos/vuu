package org.finos.vuu.plugin.clickhouse.provider.data

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

      val data = clickHouseRowDataProvider.queryForRowData(vpColumns, "", "", 100, 0)
      data.size shouldEqual 2

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
    client.executeUpdate("INSERT INTO test_table (id, val) VALUES ('1', 'hello'), ('2', 'world')")

    val tableDef = AliasedVirtualizedSessionTableDef(
      tableName = "testTable",
      remoteName = "test_table",
      remoteKeyField = "id",
      tableKeyField = "id",
      remoteColumns = VirtualizedSessionTableColumnBuilder().addString("id").addString("val").build()
    )

    (client, tableDef)
  }

  private def stopClient()(using lifecycle: LifecycleContainer): Unit = {
    lifecycle.thread.stop()
    lifecycle.stop()
  }

}