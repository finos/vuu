package org.finos.vuu.viewport.sessiontable

import org.finos.toolbox.time.Clock
import org.finos.vuu.api._
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper.{combineQs, emptyQueues}
import org.finos.vuu.core.table.{DataTable, TableContainer, ViewPortColumnCreator}
import org.finos.vuu.provider.{MockProvider, Provider, ProviderContainer}
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.{DefaultRange, OpenDialogViewPortAction, ViewPortSelectedIndices}
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table


class SessionTableViewportTest extends AbstractSessionTableTestCase with Matchers with GivenWhenThen {

  def createViewPortDefFunc(tableContainer: TableContainer, clock: Clock): (DataTable, Provider, ProviderContainer) => ViewPortDef = {
    val func = (t: DataTable, provider: Provider, pc: ProviderContainer) => ViewPortDef(t.getTableDef.columns, createRpcHandlerInstruments(provider.asInstanceOf[MockProvider], tableContainer, clock))
    func
  }

  Feature("Viewports on session tables") {

    Scenario("Create a viewport on a session table"){

      val (viewPortContainer, instruments, instrumentsProvider, prices, pricesProvider, session, outQueue, highPriorityQueue, basketOrders, tableContainer, _) = createDefaultSessionTableInfra()

      val vpcolumns = ViewPortColumnCreator.create(instruments, instruments.getTableDef.columns.map(_.name).toList)

      Given("We have a viewport on instruments with an rpc service attached...")
      viewPortContainer.addViewPortDefinition(instruments.getTableDef.name, createViewPortDefFunc(tableContainer, clock))

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, instruments, DefaultRange, vpcolumns)

      viewPortContainer.runOnce()

      And("we've ticked in some data")
      instrumentsProvider.tick("VOD.L", Map("ric" -> "VOD.L", "description" -> "Vodafone", "bbg" -> "VOD LN", "currency" -> "GBp", "exchange" -> "XLON/SETS"))
      instrumentsProvider.tick("BT.L", Map("ric" -> "BT.L", "description" -> "British Telecom", "bbg" -> "BT LN", "currency" -> "GBp", "exchange" -> "XLON/SETS"))

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      Then("verify the table is populated")
      assertVpEq(combinedUpdates) {
        Table(
          ("ric", "description", "bbg", "currency", "exchange", "lotSize", "isin"),
          ("VOD.L", "Vodafone", "VOD LN", "GBp", "XLON/SETS", null, null),
          ("BT.L", "British Telecom", "BT LN", "GBp", "XLON/SETS", null, null)
        )
      }

      val vpColumns2 = ViewPortColumnCreator.create(basketOrders, basketOrders.getTableDef.columns.map(_.name).toList)
      val viewPort2 = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, basketOrders, DefaultRange, vpColumns2)

      viewPortContainer.runOnce()

      val combinedUpdates2 = combineQs(viewPort2)

      Then("verify the table is empty (we have nt inserted data yet)")
      assertVpEq(combinedUpdates2) {
        Table(
          ("ric", "clientOrderId", "currency", "lastModifiedTime", "quantity", "price", "priceType", "exchange", "orderId", "effectivePrice"),
        )
      }
    }


    Scenario("Create a session table from an rpc call and edit it") {

      val (viewPortContainer, instruments, instrumentsProvider, prices, pricesProvider, session, outQueue, highPriorityQueue, basketOrders, tableContainer, _) = createDefaultSessionTableInfra()

      val vpcolumns = ViewPortColumnCreator.create(instruments, instruments.getTableDef.columns.map(_.name).toList)

      Given("We have a viewport on instruments with an rpc service attached...")
      viewPortContainer.addViewPortDefinition(instruments.getTableDef.name, createViewPortDefFunc(tableContainer, clock))

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, instruments, DefaultRange, vpcolumns)

      viewPortContainer.runOnce()

      And("we've ticked in some data")
      instrumentsProvider.tick("VOD.L", Map("ric" -> "VOD.L", "description" -> "Vodafone", "bbg" -> "VOD LN", "currency" -> "GBp", "exchange" -> "XLON/SETS"))
      instrumentsProvider.tick("BT.L", Map("ric" -> "BT.L", "description" -> "British Telecom", "bbg" -> "BT LN", "currency" -> "GBp", "exchange" -> "XLON/SETS"))

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      Then("verify the table is populated")
      assertVpEq(combinedUpdates) {
        Table(
          ("ric", "description", "bbg", "currency", "exchange", "lotSize", "isin"),
          ("VOD.L", "Vodafone", "VOD LN", "GBp", "XLON/SETS", null, null),
          ("BT.L", "British Telecom", "BT LN", "GBp", "XLON/SETS", null, null)
        )
      }

      Then("update selection to VOD.L row....")
      viewPortContainer.changeSelection(session, outQueue, viewPort.id, ViewPortSelectedIndices(Array(0)))

      emptyQueues(viewPort)

      And("call rpc service to create new session table")
      val result = viewPortContainer.callRpcSession(viewPort.id, "CREATE_BASKET", session)

      result.getClass shouldBe (classOf[OpenDialogViewPortAction])

      result match {
        case x: OpenDialogViewPortAction =>
          val basketTable = tableContainer.getTable(x.table.table)
          val vpColumns2 = ViewPortColumnCreator.create(basketTable, basketTable.getTableDef.columns.map(_.name).toList)
          val viewPort2 = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, basketTable, DefaultRange, vpColumns2)

          viewPortContainer.runOnce()

          val combinedUpdates2 = combineQs(viewPort2)

          Then("verify the table is populated")
          assertVpEq(combinedUpdates2) {
            Table(
              ("ric", "clientOrderId", "currency", "lastModifiedTime", "quantity", "price", "priceType", "exchange", "orderId", "effectivePrice"),
              ("VOD.L", "clOrderId-1450770869442-1", "GBp", 1450770869442L, null, null, null, "XLON/SETS", null, null)
            )
          }
      }
    }

    Scenario("Create a join session table for data entry") {

      val (viewPortContainer, instruments, instrumentsProvider, prices, pricesProvider, session, outQueue, highPriorityQueue, basketOrders, tableContainer, basketOrderPrices) = createDefaultSessionTableInfra()

      val vpcolumns = ViewPortColumnCreator.create(basketOrderPrices, basketOrderPrices.getTableDef.columns.map(_.name).toList)

      Given("We create a viewport on a session join table")
      //viewPortContainer.addViewPortDefinition(instruments.getTableDef.name, createViewPortDefFunc(tableContainer, clock))

      And("we've ticked in some data")
      pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220.0, "ask" -> 222.0))
      pricesProvider.tick("BT.L", Map("ric" -> "BT.L", "bid" -> 500.0, "ask" -> 501.0))

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, basketOrderPrices, DefaultRange, vpcolumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      Then("verify the table is populated")
      assertVpEq(combinedUpdates) {
        Table(
          ("ric", "description", "bbg", "currency", "exchange", "lotSize", "isin"),
          ("VOD.L", "Vodafone", "VOD LN", "GBp", "XLON/SETS", null, null),
          ("BT.L", "British Telecom", "BT LN", "GBp", "XLON/SETS", null, null)
        )
      }


    }
  }
}
