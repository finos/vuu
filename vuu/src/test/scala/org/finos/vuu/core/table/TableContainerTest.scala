package org.finos.vuu.core.table

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.{Indices, SessionTableDef, TableDef, VisualLinks}
import org.finos.vuu.core.module.ViewServerModule
import org.finos.vuu.core.table.TableMockFactory.{createMockSessionTable, createMockTable}
import org.finos.vuu.test.TestFriendlyJoinTableProvider
import org.finos.vuu.viewport.ViewPortTable
import org.scalamock.scalatest.MockFactory
import org.scalatest.BeforeAndAfterEach
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

class TableContainerTest extends AnyFeatureSpec with Matchers with BeforeAndAfterEach {
  implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl()
  implicit val clock: Clock = new TestFriendlyClock(10001)
  private var tableContainer: TableContainer = _

  private final val sessionTableBlueprint = createMockTable(tableName = "blueprint", tableDefName = "blueprint-def", sessionDef = true)
  private final val sessionTable = createMockSessionTable(tableName = "session", tableDefName = "session-def")
  private final val dataTable = createMockTable(tableName = "datatable", tableDefName = "datatable-def", moduleName = Option("z-module"))
  private final val dataTable2 = createMockTable(tableName = "datatable-2", tableDefName = "datatable-2-def", moduleName = Option("a-module"))

  override def beforeEach(): Unit = {
    tableContainer = new TableContainer(new TestFriendlyJoinTableProvider())
  }

  Feature("getTables") {
    Scenario("filters out table blueprints") {
      tableContainer.addTable(sessionTableBlueprint)
      tableContainer.getTables shouldBe empty
    }

    Scenario("handles missing module by returning `null` as its name") {
      tableContainer.addTable(sessionTable)
      tableContainer.getTables shouldEqual Array(ViewPortTable(sessionTable.name, "null"))
    }

    Scenario("returns sorted result by table names including session tables and excluding blueprints") {
      tableContainer.addTable(dataTable)
      tableContainer.addTable(dataTable2)
      tableContainer.addTable(sessionTable)
      tableContainer.addTable(sessionTableBlueprint)

      tableContainer.getTables shouldEqual Array(
        ViewPortTable(dataTable.name, "z-module"),
        ViewPortTable(dataTable2.name, "a-module"),
        ViewPortTable(sessionTable.name, "null"),
      )
    }
  }

  Feature("getDefinedTables") {
    Scenario("filters out session tables") {
      tableContainer.addTable(sessionTable)
      tableContainer.getDefinedTables shouldBe empty
    }

    Scenario("handles missing module by returning `null` as its name") {
      tableContainer.addTable(sessionTableBlueprint)
      tableContainer.getDefinedTables shouldEqual Array(ViewPortTable(table = sessionTableBlueprint.getTableDef.name, module = "null"))
    }

    Scenario("returns sorted result by tableDef names including blueprints excluding session tables") {
      tableContainer.addTable(dataTable)
      tableContainer.addTable(dataTable2)
      tableContainer.addTable(sessionTable)
      tableContainer.addTable(sessionTableBlueprint)

      tableContainer.getDefinedTables shouldEqual Array(
        ViewPortTable(sessionTableBlueprint.getTableDef.name, "null"),
        ViewPortTable(dataTable2.getTableDef.name, "a-module"),
        ViewPortTable(dataTable.getTableDef.name, "z-module"),
      )
    }
  }

}

object TableMockFactory extends AnyFlatSpec with MockFactory {
  private def createTestTableDef(name: String, moduleName: Option[String] = None, isSessionDef: Boolean = false): TableDef = {
    val tableDef = if (isSessionDef) new SessionTableDef(name, "id", Array.empty, joinFields = Seq.empty, indices = Indices())
                   else new TableDef(name, "id", Array.empty, Seq.empty, false, VisualLinks(), Indices())

    if (moduleName.nonEmpty) {
      val module = stub[ViewServerModule]
      (() => module.name).when().returns(moduleName.get)
      tableDef.setModule(module)
    }

    tableDef
  }

  def createMockSessionTable(tableName: String, tableDefName: String): SessionTable = {
    val table = stub[SessionTable]
    (() => table.name).when().returns(tableName)
    (() => table.getTableDef).when().returns(createTestTableDef(tableDefName, isSessionDef = true))
    table
  }

  def createMockTable(tableName: String, tableDefName: String, moduleName: Option[String] = None, sessionDef: Boolean = false): DataTable = {
    val table = stub[DataTable]
    (() => table.name).when().returns(tableName)
    (() => table.getTableDef).when().returns(createTestTableDef(tableDefName, moduleName, isSessionDef = sessionDef))
    table
  }
}
