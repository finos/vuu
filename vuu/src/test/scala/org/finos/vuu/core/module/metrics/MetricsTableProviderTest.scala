package org.finos.vuu.core.module.metrics

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.table.TableMockFactory.*
import org.finos.vuu.core.table.{DataTable, RowData, TableContainer}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.test.TestFriendlyJoinTableProvider
import org.mockito.ArgumentMatchers
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.{times, verify}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatestplus.mockito.MockitoSugar

class MetricsTableProviderTest extends AnyFeatureSpec with Matchers with MockitoSugar {

  Feature("runOnce") {

    given lifecycleContainer: LifecycleContainer = new LifecycleContainer()
    given metricsProvider: MetricsProvider = new MetricsProviderImpl()
    given clock: Clock = new TestFriendlyClock(10001)

    Scenario("can get and update expected list of tables") {
      val joinProvider = new TestFriendlyJoinTableProvider()
      val tableContainer = new TableContainer(joinProvider)
      val mockTable = mock[DataTable]
      val metricsTableProvider = new MetricsTableProvider(mockTable, tableContainer)

      tableContainer.addTable(createMockTable(tableName = "instruments", tableDefName = "instruments", sessionDef = true)) // session table blueprint
      tableContainer.addTable(createMockSessionTable(tableName = "instrumentsSessionTable_1", tableDefName = "instruments", sessionId = ClientSessionId("123", "456")))
      tableContainer.addTable(createMockSessionTable(tableName = "instrumentsSessionTable_2", tableDefName = "instruments", sessionId = ClientSessionId("123", "456")))
      tableContainer.addTable(createMockTable(tableName = "fills_table", tableDefName = "fills"))
      tableContainer.addTable(createMockTable(tableName = "other", tableDefName = "other"))

      metricsTableProvider.runOnce()

      verify(mockTable, times(1)).processUpdate(ArgumentMatchers.eq("instrumentsSessionTable_1"), any[RowData]())
      verify(mockTable, times(1)).processUpdate(ArgumentMatchers.eq("instrumentsSessionTable_2"), any[RowData]())
      verify(mockTable, times(1)).processUpdate(ArgumentMatchers.eq("fills_table"), any[RowData]())
      verify(mockTable, times(1)).processUpdate(ArgumentMatchers.eq("other"), any[RowData]())
    }
  }
}
