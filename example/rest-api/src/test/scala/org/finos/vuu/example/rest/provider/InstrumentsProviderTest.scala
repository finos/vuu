package org.finos.vuu.example.rest.provider

import org.finos.toolbox.json.JsonUtil
import org.finos.toolbox.json.JsonUtil.toRawJson
import org.finos.vuu.core.table.{Columns, DataTable, RowData, RowWithData}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.example.rest.client.{HttpClient, InstrumentServiceClient}
import org.finos.vuu.example.rest.model.{Instrument, RandomInstrument}
import org.scalamock.scalatest.MockFactory
import org.scalatest.BeforeAndAfterEach
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import sttp.client4.testing.{ResponseStub, SyncBackendStub}

class InstrumentsProviderTest extends AnyFeatureSpec with Matchers with MockFactory with BeforeAndAfterEach {
  private implicit val clock: Clock = new TestFriendlyClock(10001)
  private final val BASE_URL = "base-url.com"
  private final val KEY_FIELD = "id"
  private val mockTable: DataTable = stub[DataTable]

  Feature("doStart") {
    Scenario("can correctly make an external call, parse response and update the table WHEN server responds with 1 instrument") {
      val instruments = RandomInstrument.create(size = 1)
      val expectedRow = instruments.map(rowFromInstrument).head
      val mockBackend = SyncBackendStub
        .whenRequestMatches(req => req.uri.path.endsWith(List("instruments")) && req.uri.params.get("limit").nonEmpty)
        .thenRespond(ResponseStub.adjust(toRawJson(instruments)))

      getInstrumentsProvider(mockBackend).doStart()

      ((rowKey: String, rowUpdate: RowData, timeStamp: Long) => mockTable.processUpdate(rowKey, rowUpdate)).verify(expectedRow.get(KEY_FIELD).toString, expectedRow, *).once
    }

    Scenario("can correctly make an external call, parse response and update the table WHEN server responds with multiple instruments") {
      val instruments = RandomInstrument.create(size = 10)
      val expectedRows = instruments.map(rowFromInstrument)
      val mockBackend = SyncBackendStub
        .whenRequestMatches(req => req.uri.path.endsWith(List("instruments")) && req.uri.params.get("limit").nonEmpty)
        .thenRespond(ResponseStub.adjust(toRawJson(instruments)))

      getInstrumentsProvider(mockBackend).doStart()

      expectedRows.foreach(row => ((rowKey: String, rowUpdate: RowData, timeStamp: Long) => mockTable.processUpdate(rowKey, rowUpdate)).verify(row.get(KEY_FIELD).toString, row, *).once)
    }


    Scenario("skips updating table when response is not parsable") {
      val mockClientResponse = "Some body"
      val mockBackend = SyncBackendStub.whenAnyRequest.thenRespond(ResponseStub.exact(mockClientResponse))

      getInstrumentsProvider(mockBackend).doStart()

      ((rowKey: String, rowUpdate: RowData) => mockTable.processUpdate(rowKey, rowUpdate)).verify(*, *).never
    }

    Scenario("skips updating table when response errors") {
      val mockBackend = SyncBackendStub.whenAnyRequest.thenRespond(throw new Exception("Some error"))

      getInstrumentsProvider(mockBackend).doStart()

      ((rowKey: String, rowUpdate: RowData) => mockTable.processUpdate(rowKey, rowUpdate)).verify(*, *).never
    }
  }

  def getInstrumentsProvider(backendStub: SyncBackendStub): InstrumentsProvider = {
    (mockTable.getTableDef _).when().returns(testTableDef())
    val instrumentsClient = InstrumentServiceClient(HttpClient(backendStub), BASE_URL)
    new InstrumentsProvider(mockTable, instrumentsClient)
  }

  def testTableDef(): TableDef = {
    TableDef(
      name = "testTable",
      keyField = KEY_FIELD,
      columns = Columns.fromNames("id".int(), "ric".string(), "isin".string(), "currency".string()),
    )
  }

  def rowFromInstrument(i: Instrument): RowWithData = {
    RowWithData(i.id.toString, Map(
      "id" -> i.id,
      "currency" -> i.ccy,
      "ric" -> i.ric,
      "isin" -> i.isin
    ))
  }
}
