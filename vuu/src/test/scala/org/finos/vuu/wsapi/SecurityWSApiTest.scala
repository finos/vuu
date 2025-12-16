package org.finos.vuu.wsapi

import org.finos.vuu.api.{ColumnBuilder, TableDef, ViewPortDef}
import org.finos.vuu.client.messages.SessionId
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.module.{ModuleFactory, ViewServerModule}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.net.json.JsonVsSerializer
import org.finos.vuu.net.{ViewServerClient, WebSocketViewServerClient}
import org.finos.vuu.net.rpc.DefaultRpcHandler
import org.finos.vuu.net.ws.WebSocketClient
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{FakeDataSource, TestProvider, TestVuuClient}

import scala.collection.immutable.ListMap

class SecurityWSApiTest extends WebSocketApiTestBase {

  private val tableName = "accounts"
  private val moduleName = "SecurityWSApiTest"
  
  Feature("Assorted security tests") {

    Scenario("Test sending messages with no session") {

//      val client = new WebSocketClient(s"ws://localhost:$ws/websocket", ws) //todo review params - port specified twice
//      val viewServerClient: ViewServerClient = new WebSocketViewServerClient(client, JsonVsSerializer())
//      
//      val anonymousClient = new TestVuuClient(viewServerClient, null)
//      val result = client.send(SessionId.oneNew(), )
//      

    }


  }


  protected def defineModuleWithTestTables(): ViewServerModule = {
    val tableDef = TableDef(
      name = tableName,
      keyField = "Id",
      columns =
        new ColumnBuilder()
          .addString("Id")
          .addString("Name")
          .addInt("Account")
          .addInt("HiddenColumn")
          .build()
    )

    val viewPortDefFactory = (_: DataTable, _: Provider, _: ProviderContainer, tableContainer: TableContainer) =>
      ViewPortDef(
        columns =
          new ColumnBuilder()
            .addString("Id")
            .addString("Name")
            .addInt("Account")
            .build(),
        service = new DefaultRpcHandler()(tableContainer)
      )

    val dataSource = new FakeDataSource(ListMap(
      "row1" -> Map("Id" -> "row1", "Name" -> "Becky Thatcher", "Account" -> 12355, "HiddenColumn" -> 10),
      "row2" -> Map("Id" -> "row2", "Name" -> "Tom Sawyer", "Account" -> 45321, "HiddenColumn" -> 10),
      "row3" -> Map("Id" -> "row3", "Name" -> "Huckleberry Finn", "Account" -> 89564, "HiddenColumn" -> 11),
      "row4" -> Map("Id" -> "row4", "Name" -> "Tom Thatcher", "Account" -> 12355, "HiddenColumn" -> 10),
      "row5" -> Map("Id" -> "row5", "Name" -> "Sid Sawyer", "Account" -> 42262, "HiddenColumn" -> 10),
      "row6" -> Map("Id" -> "row6", "Name" -> "Joe Harper", "Account" -> 65879, "HiddenColumn" -> 10),
      "row7" -> Map("Id" -> "row7", "Name" -> "Jim Baker", "Account" -> 88875, "HiddenColumn" -> 10),
      "row8" -> Map("Id" -> "row8", "Name" -> "Amy Lawrence", "Account" -> 45897, "HiddenColumn" -> 15),
      "row9" -> Map("Id" -> "row9", "Name" -> "Ben Rodgers", "Account" -> 23564, "HiddenColumn" -> 10),
      "row10" -> Map("Id" -> "row10", "Name" -> "John Murrell", "Account" -> 33657, "HiddenColumn" -> 10),
      "row11" -> Map("Id" -> "row11", "Name" -> "Sally Phelps", "Account" -> 99854, "HiddenColumn" -> 10),
      "row12" -> Map("Id" -> "row12", "Name" -> "Polly Phelps", "Account" -> 78458, "HiddenColumn" -> 10),
      "row13" -> Map("Id" -> "row13", "Name" -> "Polly Phelps", "Account" -> 54874, "HiddenColumn" -> 10),
      "row14" -> Map("Id" -> "row14", "Name" -> "Johnny Cash", "Account" -> 54875, "HiddenColumn" -> 10),
      "row15" -> Map("Id" -> "row15", "Name" -> "Tom DeLay", "Account" -> 54876, "HiddenColumn" -> 10),
    ))
    
    val providerFactory = (table: DataTable, _: AbstractVuuServer) => new TestProvider(table, dataSource)

    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(tableDef, viewPortDefFactory, providerFactory)
      .asModule()
  }

}
