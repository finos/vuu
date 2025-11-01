package org.finos.vuu.viewport.performance

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper.combineQs
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.util.table.TableAsserts.assertVpEqWithMeta
import org.finos.vuu.viewport.{AbstractViewPortTestCase, TestTimeStamp, ViewPortRange}
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class DontRecalculateUnchangedViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  implicit val clock: Clock = new TestFriendlyClock(TestTimeStamp.EPOCH_DEFAULT)
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  Feature("Dont recalculate viewport when hasnt changed") {

    Scenario("Create Viewport, run cycle count and check we recalc only when required") {

      Given("we've created a viewport with orders in")
      val (viewPortContainer, orders, ordersProvider, user, session, outQueue) = createDefaultViewPortInfra()

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric"))

      createNOrderRows(ordersProvider, 10)(clock)

      val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, outQueue, orders, ViewPortRange(0, 20), vpcolumns)

      val hashCode1 = viewPort.getStructuralHashCode()
      val updateCount1 = viewPort.getTableUpdateCount()

      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel"     ,"orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          (0         ,"NYC-0000","chris"   ,"VOD.L"   ,1311544800000L,100       ),
          (0         ,"NYC-0001","chris"   ,"VOD.L"   ,1311544800010L,101       ),
          (0         ,"NYC-0002","chris"   ,"VOD.L"   ,1311544800020L,102       ),
          (0         ,"NYC-0003","chris"   ,"VOD.L"   ,1311544800030L,103       ),
          (0         ,"NYC-0004","chris"   ,"VOD.L"   ,1311544800040L,104       ),
          (0         ,"NYC-0005","chris"   ,"VOD.L"   ,1311544800050L,105       ),
          (0         ,"NYC-0006","chris"   ,"VOD.L"   ,1311544800060L,106       ),
          (0         ,"NYC-0007","chris"   ,"VOD.L"   ,1311544800070L,107       ),
          (0         ,"NYC-0008","chris"   ,"VOD.L"   ,1311544800080L,108       ),
          (0         ,"NYC-0009","chris"   ,"VOD.L"   ,1311544800090L,109       )
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
      hashCode3 shouldEqual hashCode2
      hashCode1 shouldEqual hashCode2

      And("the updatecount should also be the same")
      updateCount1 shouldEqual updateCount2
      updateCount2 shouldEqual updateCount3
      viewPortContainer.shouldCalculateKeys(viewPort, viewPort.getStructuralHashCode(), viewPort.getTableUpdateCount()) should be(false)

      val vpcolumns2 = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "ric"))

      When("when we mutate the viewport.....")
      val viewPort2 = viewPortContainer.change(RequestId.oneNew(), session, viewPort.id, ViewPortRange(0, 20), vpcolumns2)

      val hashCode4 = viewPort2.getStructuralHashCode()
      val updateCount4 = viewPort2.getTableUpdateCount()
      viewPortContainer.shouldCalculateKeys(viewPort2, viewPort2.getStructuralHashCode(), viewPort2.getTableUpdateCount()) should be(true)

      viewPortContainer.runOnce()

      Then("I expect the hashcode to have changed")
      hashCode4 should not equal hashCode3

      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel"     ,"orderId" ,"trader"  ,"ric"     ,"tradeTime"),
          (0         ,"NYC-0000","chris"   ,"VOD.L"   ,1311544800000L),
          (0         ,"NYC-0001","chris"   ,"VOD.L"   ,1311544800010L),
          (0         ,"NYC-0002","chris"   ,"VOD.L"   ,1311544800020L),
          (0         ,"NYC-0003","chris"   ,"VOD.L"   ,1311544800030L),
          (0         ,"NYC-0004","chris"   ,"VOD.L"   ,1311544800040L),
          (0         ,"NYC-0005","chris"   ,"VOD.L"   ,1311544800050L),
          (0         ,"NYC-0006","chris"   ,"VOD.L"   ,1311544800060L),
          (0         ,"NYC-0007","chris"   ,"VOD.L"   ,1311544800070L),
          (0         ,"NYC-0008","chris"   ,"VOD.L"   ,1311544800080L),
          (0         ,"NYC-0009","chris"   ,"VOD.L"   ,1311544800090L)
        )
      }

      createNOrderRows(ordersProvider, 12)(clock)

      viewPortContainer.shouldCalculateKeys(viewPort2, viewPort2.getStructuralHashCode(), viewPort2.getTableUpdateCount()) should be(true)

      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel"     ,"orderId" ,"trader"  ,"ric"     ,"tradeTime"),
          (0         ,"NYC-0010","chris"   ,"VOD.L"   ,1311544800200L),
          (0         ,"NYC-0011","chris"   ,"VOD.L"   ,1311544800210L),
          (0         ,"NYC-0000","chris"   ,"VOD.L"   ,1311544800100L),
          (0         ,"NYC-0001","chris"   ,"VOD.L"   ,1311544800110L),
          (0         ,"NYC-0002","chris"   ,"VOD.L"   ,1311544800120L),
          (0         ,"NYC-0003","chris"   ,"VOD.L"   ,1311544800130L),
          (0         ,"NYC-0004","chris"   ,"VOD.L"   ,1311544800140L),
          (0         ,"NYC-0005","chris"   ,"VOD.L"   ,1311544800150L),
          (0         ,"NYC-0006","chris"   ,"VOD.L"   ,1311544800160L),
          (0         ,"NYC-0007","chris"   ,"VOD.L"   ,1311544800170L),
          (0         ,"NYC-0008","chris"   ,"VOD.L"   ,1311544800180L),
          (0         ,"NYC-0009","chris"   ,"VOD.L"   ,1311544800190L)
        )
      }
    }
  }
}
