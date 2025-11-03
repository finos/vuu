package org.finos.vuu.core.table

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.api.{Indices, SessionTableDef}
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.test.TestFriendlyJoinTableProvider
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class InMemSessionDataTableTest extends AnyFeatureSpec with Matchers {
  private implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl()
  private implicit val clock: Clock = new DefaultClock()
  private val clientSessionId = ClientSessionId(sessionId = "sessionId", channelId = "channel")
  private val joinProvider = new TestFriendlyJoinTableProvider()

  private val sessionTableDef: SessionTableDef = new SessionTableDef(
    name = "test-table",
    keyField = "id",
    columns = Columns.fromNames("id".long(), "field".string()),
    indices = Indices(),
    joinFields = Seq.empty
  )

  private val inMemSessionDataTable = new InMemSessionDataTable(clientSessionId, sessionTableDef, joinProvider)

  Feature("Metrics update") {
    Scenario("Should correctly update metrics WHEN processUpdate called") {
      inMemSessionDataTable.processUpdate("1", RowWithData("1", Map("id" -> 1, "field" -> "value1")))
      inMemSessionDataTable.processUpdate("2", RowWithData("2", Map("id" -> 2, "field" -> "value2")))

      val counter = metricsProvider.counter(inMemSessionDataTable.name + ".processUpdates.Counter")
      val meter = metricsProvider.meter(inMemSessionDataTable.name + ".processUpdates.Meter")

      counter.getCount shouldEqual 2
      meter.getCount shouldEqual 2
    }
  }

}
