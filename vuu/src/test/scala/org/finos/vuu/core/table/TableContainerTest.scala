package org.finos.vuu.core.table

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.{Indices, SessionTableDef, TableDef, VisualLinks}
import org.finos.vuu.core.module.ViewServerModule
import org.finos.vuu.core.table.TableMockFactory.{createMockSessionTable, createMockTable}
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.test.TestFriendlyJoinTableProvider
import org.finos.vuu.viewport.ViewPortTable
import org.mockito.Mockito
import org.mockito.Mockito.{lenient, when}
import org.scalatest.BeforeAndAfterEach
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers
import org.scalatestplus.mockito.MockitoSugar.mock

class TableContainerTest extends AnyFeatureSpec with Matchers with BeforeAndAfterEach {
  implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl()
  implicit val clock: Clock = new TestFriendlyClock(10001)
  private var tableContainer: TableContainer = _

  private final val sessionTableBlueprint = createMockTable(tableName = "blueprint", tableDefName = "blueprint-def", sessionDef = true)
  private final val sessionId = ClientSessionId("123", "456")
  private final val sessionTable = createMockSessionTable(tableName = "session", tableDefName = "session-def", sessionId = sessionId)
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

  Feature("removeSessionTable") {
    Scenario("Remove session table") {
      tableContainer.addTable(dataTable)
      tableContainer.addTable(sessionTable)
      tableContainer.addTable(sessionTableBlueprint)

      tableContainer.removeSessionTable(sessionId, sessionTable.name)
      tableContainer.getDefinedTables shouldEqual Array(
        ViewPortTable(sessionTableBlueprint.getTableDef.name, "null"),
        ViewPortTable(dataTable.getTableDef.name, "z-module"),
      )
    }

    Scenario("Remove session table does not remove non-session table") {
      tableContainer.addTable(dataTable)
      tableContainer.addTable(sessionTableBlueprint)

      tableContainer.removeSessionTable(sessionId, dataTable.name)
      tableContainer.getDefinedTables shouldEqual Array(
        ViewPortTable(sessionTableBlueprint.getTableDef.name, "null"),
        ViewPortTable(dataTable.getTableDef.name, "z-module"),
      )
    }
  }

}

object TableMockFactory extends AnyFlatSpec {
  private def createTestTableDef(name: String, moduleName: Option[String] = None, isSessionDef: Boolean = false): TableDef = {
    val tableDef = if (isSessionDef) {
      new SessionTableDef(name, "id", Array.empty)
    } else {
      new TableDef(name, "id", Array.empty)
    }

    if (moduleName.nonEmpty) {
      val module = mock[ViewServerModule]
      lenient().when(module.name).thenReturn(moduleName)
      tableDef.setModule(module)
    }

    tableDef
  }

  def createMockSessionTable(tableName: String, tableDefName: String, sessionId: ClientSessionId): SessionTable = {
    val table = mock[SessionTable]
    lenient().when(table.name).thenReturn(tableName)
    lenient().when(table.getTableDef).thenReturn(createTestTableDef(tableDefName, isSessionDef = true))
    lenient().when(table.sessionId).thenReturn(sessionId)
    table
  }

  def createMockTable(tableName: String, tableDefName: String, moduleName: Option[String] = None, sessionDef: Boolean = false): DataTable = {
    val table = mock[DataTable]
    lenient().when(table.name).thenReturn(tableName)
    lenient().when(table.getTableDef).thenReturn(createTestTableDef(tableDefName, moduleName, isSessionDef = sessionDef))
    table
  }
}
