package org.finos.vuu.wsapi

import org.finos.vuu.api.{JoinSpec, JoinTableDef, JoinTo, LeftOuterJoin, TableDef, VisualLinks}
import org.finos.vuu.core.AbstractVuuServer
import org.finos.vuu.core.module.{ModuleFactory, TableDefContainer, ViewServerModule}
import org.finos.vuu.core.sort.SortDirection
import org.finos.vuu.core.table.{Columns, DataTable}
import org.finos.vuu.net.{CreateViewPortRequest, CreateViewPortSuccess, FilterSpec, GetTableMetaRequest, GetTableMetaResponse, SortDef, SortSpec}
import org.finos.vuu.viewport.{ViewPortRange, ViewPortTable}
import org.finos.vuu.wsapi.helpers.TestExtension.ModuleFactoryExtension
import org.finos.vuu.wsapi.helpers.{FakeDataSource, TestProviderFactory}

import scala.collection.immutable.ListMap

class JoinTableWSApiTest extends WebSocketApiTestBase {

  private val moduleName = "JoinTableWSApiTest"
  private val testProviderFactory = new TestProviderFactory

  Feature("[Web Socket API] Join table tests") {

    Scenario("Get metadata") {

      val requestId = vuuClient.send(sessionId, GetTableMetaRequest(ViewPortTable("instrumentToCurrency", moduleName)))

      Then("return view port columns in response")
      val response = vuuClient.awaitForResponse(requestId)

      val responseBody = assertBodyIsInstanceOf[GetTableMetaResponse](response)
      responseBody.columns.length shouldEqual 6
      responseBody.columns shouldEqual Array("ric", "currency", "country", "capital", "vuuCreatedTimestamp", "vuuUpdatedTimestamp")
    }

    Scenario("Test a huge number of cascading join table updates with filter and sort") {

      val viewPortId = createViewPortBase(tableName = "instrumentToCurrency", filter = "ric = \"99999\"", expectedNumberOfRows = 0)

      //Create instruments, creating 100k left to right events
      val instrumentMap = (0 until 100_000).map { f =>
        val key = f.toString
        key -> Map("ric" -> key, "currency" -> "GBX")
      }.toMap
      testProviderFactory.getProvider("instruments").update(new FakeDataSource(ListMap.from(instrumentMap)))

      waitForData(1)

      //Update the linked currency, this will trigger 100k right to left updates
      val currencyDataSource = new FakeDataSource(ListMap(
        "GBX" -> Map("currency" -> "GBX", "country" -> "UK"),
        "USD" -> Map("currency" -> "USD", "country" -> "US")
      ))
      testProviderFactory.getProvider("currencies").update(currencyDataSource)

      waitForData(1)

      //Update the linked country, this will trigger 200k right to left updates
      val countryDataSource = new FakeDataSource(ListMap(
        "GB" -> Map("country" -> "GB", "capital" -> "York") //Shhh don't tell anyone
      ))
      testProviderFactory.getProvider("countries").update(countryDataSource)

      waitForData(1)
    }

    Scenario("Test adding and removing left keys") {

      var instrumentMap = (0 until 100).map { f =>
        val key = f.toString
        key -> Map("ric" -> key, "currency" -> "GBX")
      }.toMap
      var dataSource = new FakeDataSource(ListMap.from(instrumentMap))
      testProviderFactory.getProvider("instruments").update(dataSource)
      testProviderFactory.getProvider("instruments").delete(dataSource)

      val viewPortId = createViewPortBase(tableName = "instrumentToCurrency", filter = "ric = \"199\"", expectedNumberOfRows = 0)

      instrumentMap = (100 until 200).map { f =>
        val key = f.toString
        key -> Map("ric" -> key, "currency" -> "GBX")
      }.toMap
      dataSource = new FakeDataSource(ListMap.from(instrumentMap))
      testProviderFactory.getProvider("instruments").update(dataSource)

      waitForData(1)
    }

  }


  private def createViewPortBase(tableName: String,
                                 columns: Array[String] = Array("*"),
                                 filter: String = "",
                                 expectedNumberOfRows: Int) = {
    val createViewPortRequest = CreateViewPortRequest(
      table = ViewPortTable(tableName, moduleName),
      range = ViewPortRange(0, 100),
      columns = columns,
      filterSpec = FilterSpec(filter),
      sort = SortSpec(List(SortDef("vuuUpdatedTimestamp", SortDirection.DESCENDING.external))))
    vuuClient.send(sessionId, createViewPortRequest)
    val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
    val viewPortId = viewPortCreateResponse.get.viewPortId
    waitForData(expectedNumberOfRows)
    viewPortId
  }

  override protected def defineModuleWithTestTables(): ViewServerModule = {

    val instrumentDef = TableDef(
      name = "instruments",
      keyField = "ric",
      columns = Columns.fromNames("ric:String", "currency:String"),
      joinFields = "ric","currency")

    val instrumentDataSource = new FakeDataSource(ListMap.empty)
    val instrumentProvider = (table: DataTable, _: AbstractVuuServer) => testProviderFactory.create(table, instrumentDataSource)

    val currencyDef = TableDef(
      "currencies",
      "currency",
      Columns.fromNames("currency:String", "country:String"),
      "currency", "country")

    val currencyDataSource = new FakeDataSource(ListMap(
      "GBX" -> Map("currency" -> "GBX", "country" -> "GB")
    ))
    val currencyProvider = (table: DataTable, _: AbstractVuuServer) => testProviderFactory.create(table, currencyDataSource)

    val countryDef = TableDef(
      "countries",
      "country",
      Columns.fromNames("country:String", "capital:String"),
      "country")
    val countryDataSource = new FakeDataSource(ListMap(
      "GB" -> Map("country" -> "GB", "capital" -> "London")
    ))
    val countryProvider = (table: DataTable, _: AbstractVuuServer) => testProviderFactory.create(table, countryDataSource)

    val join1TableDef = JoinTableDef(
      name = "currencyToCountry",
      baseTable = currencyDef,
      joinColumns = Columns.allFrom(currencyDef) ++ Columns.allFromExceptDefaultAnd(countryDef, "country"),
      joins =
        JoinTo(
          table = countryDef,
          joinSpec = JoinSpec(left = "country", right = "country", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq("currency", "country")
    )

    val joinTableFunc1: TableDefContainer => JoinTableDef = _ => join1TableDef

    val joinTableFunc2: TableDefContainer => JoinTableDef = _ => JoinTableDef(
      name = "instrumentToCurrency",
      baseTable = instrumentDef,
      joinColumns = Columns.allFrom(instrumentDef) ++ Columns.allFromExceptDefaultAnd(join1TableDef, "currency"),
      joins =
        JoinTo(
          table = join1TableDef,
          joinSpec = JoinSpec(left = "currency", right = "currency", LeftOuterJoin)
        ),
      links = VisualLinks(),
      joinFields = Seq("ric","currency")
    )

    ModuleFactory.withNamespace(moduleName)
      .addTableForTest(instrumentDef, instrumentProvider)
      .addTableForTest(currencyDef, currencyProvider)
      .addTableForTest(countryDef, countryProvider)
      .addJoinTableForTest(joinTableFunc1)
      .addJoinTableForTest(joinTableFunc2)
      .asModule()

  }
}
