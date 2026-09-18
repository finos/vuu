package org.finos.vuu.example.rest.provider

import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.core.table.{Columns, DataTable, RowWithData}
import org.finos.vuu.example.rest.client.{HttpClient, InstrumentServiceClient}
import org.finos.vuu.example.rest.model.{Instrument, RandomInstrument}
import org.finos.vuu.net.json.JsonSerializer
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.{never, times, verify, when}
import org.scalatest.BeforeAndAfterEach
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatestplus.mockito.MockitoSugar
import sttp.client4.testing.{ResponseStub, SyncBackendStub}

class InstrumentsProviderTest extends AnyFeatureSpec with Matchers with BeforeAndAfterEach with MockitoSugar {
  private implicit val clock: Clock = new TestFriendlyClock(10001)
  private final val BASE_URL = "base-url.com"
  private final val KEY_FIELD = "id"
  val serializer = JsonSerializer[List[Instrument]]()

  Feature("doStart") {
    Scenario("can correctly make an external call, parse response and update the table WHEN server responds with 1 instrument") {
      val mockTable: DataTable = mock[DataTable]
      val instruments = RandomInstrument.create(size = 1)
      val expectedRow = instruments.map(rowFromInstrument).head
      val mockBackend = SyncBackendStub
        .whenRequestMatches(req => req.uri.path.endsWith(List("instruments")) && req.uri.params.get("limit").nonEmpty)
        .thenRespond(ResponseStub.adjust(serializer.serialize(instruments)))

      getInstrumentsProvider(mockTable, mockBackend).doStart()

      verify(mockTable, times(1)).processUpdate(expectedRow.get(KEY_FIELD).toString, expectedRow)
    }

    Scenario("can correctly make an external call, parse response and update the table WHEN server responds with multiple instruments") {
      val mockTable: DataTable = mock[DataTable]
      val instruments = RandomInstrument.create(size = 10)
      val expectedRows = instruments.map(rowFromInstrument)
      val mockBackend = SyncBackendStub
        .whenRequestMatches(req => req.uri.path.endsWith(List("instruments")) && req.uri.params.get("limit").nonEmpty)
        .thenRespond(ResponseStub.adjust(serializer.serialize(instruments)))

      getInstrumentsProvider(mockTable, mockBackend).doStart()

      expectedRows.foreach(row => verify(mockTable, times(1)).processUpdate(row.get(KEY_FIELD).toString, row))
    }

    Scenario("skips updating table when response is not parsable") {
      val mockTable: DataTable = mock[DataTable]
      val mockClientResponse = "Some body"
      val mockBackend = SyncBackendStub.whenAnyRequest.thenRespond(ResponseStub.exact(mockClientResponse))

      getInstrumentsProvider(mockTable, mockBackend).doStart()

      verify(mockTable, never()).processUpdate(any(), any())
    }

    Scenario("skips updating table when response errors") {
      val mockTable: DataTable = mock[DataTable]
      val mockBackend = SyncBackendStub.whenAnyRequest.thenRespond(throw new Exception("Some error"))

      getInstrumentsProvider(mockTable, mockBackend).doStart()

      verify(mockTable, never()).processUpdate(any(), any())
    }
  }

  def getInstrumentsProvider(mockTable: DataTable, backendStub: SyncBackendStub): InstrumentsProvider = {
    when(mockTable.getTableDef).thenReturn(testTableDef())
    val instrumentsClient = InstrumentServiceClient(HttpClient(backendStub), BASE_URL)
    new InstrumentsProvider(mockTable, instrumentsClient)
  }

  def testTableDef(): TableDef = {
    TableDef(
      name = "testTable",
      keyField = KEY_FIELD,
      customColumns = Columns.fromNames("id".int(), "ric".string(), "isin".string(), "currency".string()),
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
