package org.finos.vuu.core.module.metrics

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.{LifeCycleComponentContext, LifecycleContainer, LifecycleEnabled}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.{Indices, TableDef, VisualLinks}
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.module.metrics.MetricsTableProviderTest.{createMockTable, createTestTableDef}
import org.finos.vuu.core.table.{Column, Columns, DataTable, TableContainer}
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
  (lifeCycleComponentContext.dependsOn: LifecycleEnabled => Unit).when(*).returns()

  private val joinProvider = new TestFriendlyJoinTableProvider()
  private val mockTable = stub[DataTable]
  private val tableContainer = new TableContainer(joinProvider)

  private val metricsTableProvider = new MetricsTableProvider(mockTable, tableContainer)

  Feature("runOnce") {
    Scenario("can get and update expected list of tables") {
      tableContainer.createTable(createTestTableDef(name = "instruments"))
      tableContainer.addTable(createMockTable(tableName = "instrumentsSessionTable_1", tableDefName = "instruments"))
      tableContainer.addTable(createMockTable(tableName = "instrumentsSessionTable_2", tableDefName = "instruments"))
      tableContainer.createTable(createTestTableDef(name = "other"))

      metricsTableProvider.runOnce()

      (mockTable.processUpdate _).verify("instruments", *, *).once
      (mockTable.processUpdate _).verify("instrumentsSessionTable_1", *, *).once
      (mockTable.processUpdate _).verify("instrumentsSessionTable_2", *, *).once
      (mockTable.processUpdate _).verify("other", *, *).once
    }
  }
}

object MetricsTableProviderTest extends MockFactory {
  private def createTestTableDef(name: String,
                                 keyField: String = "id",
                                 columns: Array[Column] = Columns.fromNames("id".long(), "field".string())): TableDef = {
    new TableDef(name, keyField, columns, Seq.empty, false, VisualLinks(), Indices())
  }

  private def createMockTable(tableName: String, tableDefName: String): DataTable = {
    val table = stub[DataTable]
    (table.name _).when().returns(tableName)
    (table.getTableDef _).when().returns(createTestTableDef(tableDefName))
    table
  }
}
