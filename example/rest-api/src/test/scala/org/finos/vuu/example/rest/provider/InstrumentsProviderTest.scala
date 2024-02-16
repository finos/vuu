package org.finos.vuu.example.rest.provider

import com.fasterxml.jackson.module.scala.JavaTypeable
import org.finos.vuu.core.table.{Columns, DataTable, RowWithData}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.module.ModuleFactory.stringToString
import org.finos.vuu.example.rest.InstrumentServiceClient
import org.finos.vuu.example.rest.TestUtils.testInstrument
import org.finos.vuu.example.rest.client.HttpClient
import org.finos.vuu.example.rest.model.Instrument
import org.finos.vuu.example.rest.provider.InstrumentsProvider.INSTRUMENTS_COUNT
import org.scalamock.scalatest.MockFactory
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import scala.util.Success

class InstrumentsProviderTest extends AnyFeatureSpec with Matchers with MockFactory {
  private implicit val clock: Clock = new TestFriendlyClock(10001)
  private val mockHttpClient = mock[HttpClient]
  private val instrumentsClient = InstrumentServiceClient(mockHttpClient)

  private val mockTable = stub[DataTable]
  (mockTable.getTableDef _).when().returns(testTableDef())

  private val provider = new InstrumentsProvider(mockTable, instrumentsClient)

  Feature("doStart") {
    val instrument1 = testInstrument(id = 0, ric = "RIC1.L")
    val expectedRowForInstrument1 = RowWithData("0", Map(
      "id" -> instrument1.id,
      "currency" -> instrument1.ccy,
      "ric" -> instrument1.ric,
      "isin" -> instrument1.isin
    ))
    val mockResponse = Success(List(instrument1))

    Scenario("can make external call and update the table") {
      (mockHttpClient.get(_: String)(_: JavaTypeable[List[Instrument]]))
        .expects(s"/instruments?limit=$INSTRUMENTS_COUNT", *)
        .returns(_(mockResponse))

      provider.doStart()

      (mockTable.processUpdate _).verify("0", expectedRowForInstrument1, *).once()
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
