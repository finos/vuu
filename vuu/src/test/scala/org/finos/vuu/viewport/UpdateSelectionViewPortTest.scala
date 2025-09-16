package org.finos.vuu.viewport

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper.combineQs
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.net.{SortDef, SortSpec}
import org.finos.vuu.util.table.TableAsserts.assertVpEqWithMeta
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class UpdateSelectionViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  implicit val clock: Clock = new TestFriendlyClock(TestTimeStamp.EPOCH_DEFAULT)
  implicit val metrics: MetricsProvider = new MetricsProviderImpl

  Feature("Check our maintenance of selection on the server side") {

    Scenario("create viewport, update selection, see selection come back") {

      Given("we've created a viewport with orders in")
      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "tradeTime", "quantity", "ric"))

      createNOrderRows(ordersProvider, 10)(clock)

      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), vpcolumns)

      viewPortContainer.runOnce()

      val combinedUpdates = combineQs(viewPort)

      assertVpEqWithMeta(combinedUpdates) {
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

      And("we select some rows in the grid")
      viewPortContainer.changeSelection(session, outQueue, viewPort.id, ViewPortSelectedIndices(Array(0, 2)))

      Then("Check the selected rows is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel"     ,"orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          (1         ,"NYC-0000","chris"   ,"VOD.L"   ,1311544800000L,100       ),
          (1         ,"NYC-0002","chris"   ,"VOD.L"   ,1311544800020L,102       )
        )
      }

      viewPortContainer.changeSelection(session, outQueue, viewPort.id, ViewPortSelectedIndices(Array(2)))

      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel"     ,"orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          (0         ,"NYC-0000","chris"   ,"VOD.L"   ,1311544800000L,100       ),
          (1         ,"NYC-0002","chris"   ,"VOD.L"   ,1311544800020L,102       )
        )
        }

      And("when we apply a sort")
      val viewPortChanged = viewPortContainer.change(RequestId.oneNew(), session, viewPort.id, viewPort.getRange, vpcolumns, sort = SortSpec(List(SortDef("quantity", 'D'))))

      viewPortContainer.runOnce()

      Then("Check we still maintain the selection")
      assertVpEqWithMeta(combineQs(viewPortChanged)) {
        Table(
          ("sel"     ,"orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity"),
          (0         ,"NYC-0000","chris"   ,"VOD.L"   ,1311544800000L,100       ),
          (0         ,"NYC-0001","chris"   ,"VOD.L"   ,1311544800010L,101       ),
          (1         ,"NYC-0002","chris"   ,"VOD.L"   ,1311544800020L,102       ),
          (0         ,"NYC-0003","chris"   ,"VOD.L"   ,1311544800030L,103       ),
          (0         ,"NYC-0004","chris"   ,"VOD.L"   ,1311544800040L,104       ),
          (0         ,"NYC-0005","chris"   ,"VOD.L"   ,1311544800050L,105       ),
          (0         ,"NYC-0006","chris"   ,"VOD.L"   ,1311544800060L,106       ),
          (0         ,"NYC-0007","chris"   ,"VOD.L"   ,1311544800070L,107       ),
          (0         ,"NYC-0008","chris"   ,"VOD.L"   ,1311544800080L,108       ),
          (0         ,"NYC-0009","chris"   ,"VOD.L"   ,1311544800090L,109       )
        )
      }
    }

    Scenario("Select one row that exists") {
      Given("we've created a viewport with 10 orders in")
      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()
      createNOrderRows(ordersProvider, 10)(clock)

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "quantity", "ric"))
      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), vpcolumns)
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (0, "NYC-0001", "chris", "VOD.L", 101),
          (0, "NYC-0002", "chris", "VOD.L", 102),
          (0, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (0, "NYC-0005", "chris", "VOD.L", 105),
          (0, "NYC-0006", "chris", "VOD.L", 106),
          (0, "NYC-0007", "chris", "VOD.L", 107),
          (0, "NYC-0008", "chris", "VOD.L", 108),
          (0, "NYC-0009", "chris", "VOD.L", 109)
        )
      }

      And("Select a row")
      val rowToSelect1 = "NYC-0001"
      var vp = viewPortContainer.selectRow(viewPort.id, rowToSelect1, preserveExistingSelection = true)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (1, "NYC-0001", "chris", "VOD.L", 101),
        )
      }
      Then("Validate row is selected in view port")
      var selectedRows = vp.getSelection
      selectedRows.size shouldBe 1
      selectedRows.contains(rowToSelect1) shouldBe true

      Given("Select another row")
      val rowToSelect2 =  "NYC-0002"
      vp = viewPortContainer.selectRow(viewPort.id, rowToSelect2, preserveExistingSelection = true)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (1, "NYC-0001", "chris", "VOD.L", 101),
          (1, "NYC-0002", "chris", "VOD.L", 102),
        )
      }
      Then("Validate rows are selected in view port")
      selectedRows = vp.getSelection
      selectedRows.size shouldBe 2
      selectedRows.contains(rowToSelect1) shouldBe true
      selectedRows.contains(rowToSelect2) shouldBe true

      Given("Select a row without preserving existing selection")
      val rowToSelect3 =  "NYC-0003"
      vp = viewPortContainer.selectRow(viewPort.id, rowToSelect3, preserveExistingSelection = false)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0001", "chris", "VOD.L", 101),
          (0, "NYC-0002", "chris", "VOD.L", 102),
          (1, "NYC-0003", "chris", "VOD.L", 103),
        )
      }
      Then("Validate rows are selected in view port")
      selectedRows = vp.getSelection
      selectedRows.size shouldBe 1
      selectedRows.contains(rowToSelect3) shouldBe true

      When("when order of rows is changed by sorting")
      val viewPortChanged = viewPortContainer.change(RequestId.oneNew(), session, viewPort.id, viewPort.getRange, vpcolumns, sort = SortSpec(List(SortDef("quantity", 'D'))))
      viewPortContainer.runOnce()

      Then("Check selection remains")
      assertVpEqWithMeta(combineQs(viewPortChanged)) {
        Table(
          ("sel", "orderId", "trader", "ric", "tradeTime", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 1311544800000L, 100),
          (0, "NYC-0001", "chris", "VOD.L", 1311544800010L, 101),
          (0, "NYC-0002", "chris", "VOD.L", 1311544800020L, 102),
          (1, "NYC-0003", "chris", "VOD.L", 1311544800030L, 103),
          (0, "NYC-0004", "chris", "VOD.L", 1311544800040L, 104),
          (0, "NYC-0005", "chris", "VOD.L", 1311544800050L, 105),
          (0, "NYC-0006", "chris", "VOD.L", 1311544800060L, 106),
          (0, "NYC-0007", "chris", "VOD.L", 1311544800070L, 107),
          (0, "NYC-0008", "chris", "VOD.L", 1311544800080L, 108),
          (0, "NYC-0009", "chris", "VOD.L", 1311544800090L, 109)
        )
      }
    }
  }
}
