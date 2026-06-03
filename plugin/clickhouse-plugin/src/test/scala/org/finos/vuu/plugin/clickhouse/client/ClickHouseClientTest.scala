package org.finos.vuu.plugin.clickhouse.client

import com.dimafeng.testcontainers.ForAllTestContainer
import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.plugin.clickhouse.ClickHouseContainer
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.finos.vuu.plugin.clickhouse.client.options.ClickHouseClientOptions

class ClickHouseClientTest
  extends AnyFeatureSpec with GivenWhenThen with Matchers with ForAllTestContainer {

  override val container: ClickHouseContainer = ClickHouseContainer()

  Feature("Test we can connect to a remote ClickHouse") {

    Scenario("Can execute queries and insert data") {

      given metrics: MetricsProvider = MetricsProviderImpl()
      given timeProvider: Clock = DefaultClock()
      given lifecycle: LifecycleContainer = LifecycleContainer()

      val client = ClickHouseClient(ClickHouseClientOptions()
        .withEndpoint(container.getEndpoint)
        .withUsername(container.getUsername)
        .withPassword(container.getPassword))
      
      lifecycle.start()

      // Create table
      client.executeUpdate(
        """
          |CREATE TABLE IF NOT EXISTS test_table (
          |  id Int32,
          |  val String
          |) ENGINE = MergeTree() ORDER BY id
          |""".stripMargin
      )

      // Insert data
      client.executeUpdate("INSERT INTO test_table (id, val) VALUES (1, 'hello'), (2, 'world')")

      // Query data
      val results = client.executeQuery("SELECT val FROM test_table ORDER BY id") { records =>
        val list = scala.collection.mutable.ListBuffer[String]()
        val it = records.iterator()
        while (it.hasNext) {
          list.append(it.next().getString("val"))
        }
        list.toList
      }

      results shouldEqual List("hello", "world")

      lifecycle.thread.stop()
      lifecycle.stop()
    }
  }
}
