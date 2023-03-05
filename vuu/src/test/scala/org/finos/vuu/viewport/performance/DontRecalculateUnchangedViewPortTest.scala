package org.finos.vuu.viewport.performance

import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper.combineQs
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.util.table.TableAsserts.assertVpEqWithMeta
import org.finos.vuu.viewport.{AbstractViewPortTestCase, ViewPortRange}
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class DontRecalculateUnchangedViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  Feature("Dont recalculate viewport when hasnt changed") {

    Scenario("Create Viewport, run cycle count and check we recalc only when required") {

      Given("we've created a viewport with orders in")
      val (viewPortContainer, orders, ordersProvider, session, outQueue, highPriorityQueue) = createDefaultViewPortInfra()

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric"))

      createNOrderRows(ordersProvider, 10)(timeProvider)

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, highPriorityQueue, orders, ViewPortRange(0, 20), vpcolumns)

      val hashCode1 = viewPort.getStructuralHashCode()
      val updateCount1 = viewPort.getTableUpdateCount()

      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 1311544800L, 100),
          (0, "NYC-0001", "chris", "VOD.L", 1311544810L, 101),
          (0, "NYC-0002", "chris", "VOD.L", 1311544820L, 102),
          (0, "NYC-0003", "chris", "VOD.L", 1311544830L, 103),
          (0, "NYC-0004", "chris", "VOD.L", 1311544840L, 104),
          (0, "NYC-0005", "chris", "VOD.L", 1311544850L, 105),
          (0, "NYC-0006", "chris", "VOD.L", 1311544860L, 106),
          (0, "NYC-0007", "chris", "VOD.L", 1311544870L, 107),
          (0, "NYC-0008", "chris", "VOD.L", 1311544880L, 108),
          (0, "NYC-0009", "chris", "VOD.L", 1311544890L, 109)
        )
      }

      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime", "quantity")
        )
      }

      val hashCode2 = viewPort.getStructuralHashCode()
      val updateCount2 = viewPort.getTableUpdateCount()

      viewPortContainer.shouldCalculateKeys(viewPort, viewPort.getStructuralHashCode(), viewPort.getTableUpdateCount()) should be(false)

      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime", "quantity")
        )
      }

      val hashCode3 = viewPort.getStructuralHashCode()
      val updateCount3 = viewPort.getTableUpdateCount()

      Then("when we compare the hashcodes they should be all equal (i.e. the structure hasn't changed")
      hashCode3 shouldEqual (hashCode2)
      hashCode1 shouldEqual (hashCode2)

      And("the updatecount should also be the same")
      updateCount1 shouldEqual (updateCount2)
      updateCount2 shouldEqual (updateCount3)
      viewPortContainer.shouldCalculateKeys(viewPort, viewPort.getStructuralHashCode(), viewPort.getTableUpdateCount()) should be(false)

      val vpcolumns2 = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "ric"))

      When("when we mutate the viewport.....")
      val viewPort2 = viewPortContainer.change(RequestId.oneNew(), session, viewPort.id, ViewPortRange(0, 20), vpcolumns2)

      val hashCode4 = viewPort2.getStructuralHashCode()
      val updateCount4 = viewPort2.getTableUpdateCount()
      viewPortContainer.shouldCalculateKeys(viewPort2, viewPort2.getStructuralHashCode(), viewPort2.getTableUpdateCount()) should be(true)

      viewPortContainer.runOnce()

      Then("I expect the hashcode to have changed")
      hashCode4 should not equal (hashCode3)

      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime"),
          (0, "NYC-0000", "chris", "VOD.L", 1311544800L),
          (0, "NYC-0001", "chris", "VOD.L", 1311544810L),
          (0, "NYC-0002", "chris", "VOD.L", 1311544820L),
          (0, "NYC-0003", "chris", "VOD.L", 1311544830L),
          (0, "NYC-0004", "chris", "VOD.L", 1311544840L),
          (0, "NYC-0005", "chris", "VOD.L", 1311544850L),
          (0, "NYC-0006", "chris", "VOD.L", 1311544860L),
          (0, "NYC-0007", "chris", "VOD.L", 1311544870L),
          (0, "NYC-0008", "chris", "VOD.L", 1311544880L),
          (0, "NYC-0009", "chris", "VOD.L", 1311544890L)
        )
      }

      createNOrderRows(ordersProvider, 12)(timeProvider)

      viewPortContainer.shouldCalculateKeys(viewPort2, viewPort2.getStructuralHashCode(), viewPort2.getTableUpdateCount()) should be(true)

      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel"     ,"orderId" ,"trader"  ,"ric"     ,"tradeTime"),
          (0         ,"NYC-0010","chris"   ,"VOD.L"   ,1311545000L),
          (0         ,"NYC-0011","chris"   ,"VOD.L"   ,1311545010L),
          (0         ,"NYC-0000","chris"   ,"VOD.L"   ,1311544900L),
          (0         ,"NYC-0001","chris"   ,"VOD.L"   ,1311544910L),
          (0         ,"NYC-0002","chris"   ,"VOD.L"   ,1311544920L),
          (0         ,"NYC-0003","chris"   ,"VOD.L"   ,1311544930L),
          (0         ,"NYC-0004","chris"   ,"VOD.L"   ,1311544940L),
          (0         ,"NYC-0005","chris"   ,"VOD.L"   ,1311544950L),
          (0         ,"NYC-0006","chris"   ,"VOD.L"   ,1311544960L),
          (0         ,"NYC-0007","chris"   ,"VOD.L"   ,1311544970L),
          (0         ,"NYC-0008","chris"   ,"VOD.L"   ,1311544980L),
          (0         ,"NYC-0009","chris"   ,"VOD.L"   ,1311544990L)
        )
      }

    }
  }
}
