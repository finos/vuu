package org.finos.vuu.core.module.metrics

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.{LifeCycleComponentContext, LifecycleContainer, LifecycleEnabled}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.table.TableMockFactory.*
import org.finos.vuu.core.table.{DataTable, RowData, TableContainer}
import org.finos.vuu.test.TestFriendlyJoinTableProvider
import org.scalamock.scalatest.MockFactory
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class MetricsTableProviderTest extends AnyFeatureSpec with Matchers with MockFactory {
  private implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl()
  private implicit val clock: Clock = new TestFriendlyClock(10001)
  private implicit val lifecycleContainer: LifecycleContainer = stub[LifecycleContainer]
  private val lifeCycleComponentContext = stub[LifeCycleComponentContext]
  (lifecycleContainer.apply _).when(*).returns(lifeCycleComponentContext)
  (lifeCycleComponentContext.dependsOn: LifecycleEnabled => Unit).when(*).returns((): Unit)

  private val joinProvider = new TestFriendlyJoinTableProvider()
  private val mockTable = stub[DataTable]
  private val tableContainer = new TableContainer(joinProvider)

  private val metricsTableProvider = new MetricsTableProvider(mockTable, tableContainer)

  Feature("runOnce") {
    Scenario("can get and update expected list of tables") {
      tableContainer.addTable(createMockTable(tableName = "instruments", tableDefName = "instruments", sessionDef = true)) // session table blueprint
      tableContainer.addTable(createMockSessionTable(tableName = "instrumentsSessionTable_1", tableDefName = "instruments"))
      tableContainer.addTable(createMockSessionTable(tableName = "instrumentsSessionTable_2", tableDefName = "instruments"))
      tableContainer.addTable(createMockTable(tableName = "fills_table", tableDefName = "fills"))
      tableContainer.addTable(createMockTable(tableName = "other", tableDefName = "other"))

      metricsTableProvider.runOnce()

      ((rowKey: String, rowUpdate: RowData) => mockTable.processUpdate(rowKey, rowUpdate)).verify("instrumentsSessionTable_1", *).once()
      ((rowKey: String, rowUpdate: RowData) => mockTable.processUpdate(rowKey, rowUpdate)).verify("instrumentsSessionTable_2", *).once()
      ((rowKey: String, rowUpdate: RowData) => mockTable.processUpdate(rowKey, rowUpdate)).verify("fills_table", *).once()
      ((rowKey: String, rowUpdate: RowData) => mockTable.processUpdate(rowKey, rowUpdate)).verify("other", *).once()
    }
  }
}
