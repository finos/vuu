package org.finos.vuu.example.rest.provider

import org.finos.toolbox.json.JsonUtil
import org.finos.vuu.core.table.{Columns, DataTable, RowWithData}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.example.rest.InstrumentServiceClient
import org.finos.vuu.example.rest.TestUtils.testInstrument
import org.finos.vuu.example.rest.client.{ClientResponse, HttpClient}
import org.finos.vuu.example.rest.provider.InstrumentsProvider.INSTRUMENTS_COUNT
import org.scalamock.scalatest.MockFactory
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import scala.util.{Failure, Success}

class InstrumentsProviderTest extends AnyFeatureSpec with Matchers with MockFactory {
  private implicit val clock: Clock = new TestFriendlyClock(10001)
  private val mockHttpClient = mock[HttpClient]
  private val instrumentsClient = InstrumentServiceClient(mockHttpClient)

  private val mockTable = stub[DataTable]
  (mockTable.getTableDef _).when().returns(testTableDef())

  private val provider = new InstrumentsProvider(mockTable, instrumentsClient)

  Feature("doStart") {
    Scenario("can correctly make external call, parse response and update the table") {
      val instrument = testInstrument(id = 0, ric = "RIC1.L")
      val expectedRowForInstrument1 = RowWithData("0", Map(
        "id" -> instrument.id,
        "currency" -> instrument.ccy,
        "ric" -> instrument.ric,
        "isin" -> instrument.isin
      ))
      val mockClientResponse = Success(ClientResponse(JsonUtil.toRawJson(List(instrument)), 200))

      (mockHttpClient.get _)
        .expects(s"/instruments?limit=$INSTRUMENTS_COUNT")
        .returns(_(mockClientResponse))

      provider.doStart()

      (mockTable.processUpdate _).verify("0", expectedRowForInstrument1, *).once
    }

    Scenario("skips updating table when response is not parsable") {
      val mockClientResponse = Success(ClientResponse(body = "Some body", statusCode = 200))

      (mockHttpClient.get _)
        .expects(s"/instruments?limit=$INSTRUMENTS_COUNT")
        .returns(_(mockClientResponse))

      provider.doStart()

      (mockTable.processUpdate _).verify(*, *, *).never
    }

    Scenario("skips updating table when response errors") {
      val mockClientResponse = Failure(new Exception("Some error"))

      (mockHttpClient.get _)
        .expects(s"/instruments?limit=$INSTRUMENTS_COUNT")
        .returns(_(mockClientResponse))

      provider.doStart()

      (mockTable.processUpdate _).verify(*, *, *).never
    }
  }

  def testTableDef(): TableDef = {
    TableDef(
      name = "testTable",
      keyField = "id",
      columns = Columns.fromNames("id".int(), "ric".string(), "isin".string(), "currency".string()),
    )
  }
}
