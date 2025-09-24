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
import org.scalatest.prop.TableFor5
import org.scalatest.prop.Tables.Table

class UpdateSelectionViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  implicit val clock: Clock = new TestFriendlyClock(TestTimeStamp.EPOCH_DEFAULT)
  implicit val metrics: MetricsProvider = new MetricsProviderImpl
  val defaultViewPortUpdate: TableFor5[Int, String, String, String, Int] = Table(
    ("sel", "orderId", "trader", "ric", "quantity"),
    (0, "NYC-0000", "chris", "VOD.L", 100),
    (0, "NYC-0001", "chris", "VOD.L", 101),
    (0, "NYC-0002", "chris", "VOD.L", 102),
    (0, "NYC-0003", "chris", "VOD.L", 103),
    (0, "NYC-0004", "chris", "VOD.L", 104),
    (0, "NYC-0005", "chris", "VOD.L", 105),
  )

  Feature("Check our maintenance of selection on the server side") {
    Scenario("Select a row and preserve existing selection") {
      Given("A view port of 6 orders is created")
      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()
      createNOrderRows(ordersProvider, 6)(clock)

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "quantity", "ric"))
      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), vpcolumns)
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort))(defaultViewPortUpdate)

      And("Select a row")
      val rowToSelect1 = "NYC-0001"
      var vp = viewPortContainer.selectRow(viewPort.id, rowToSelect1, preserveExistingSelection = true)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (1, "NYC-0001", "chris", "VOD.L", 101),
          (0, "NYC-0002", "chris", "VOD.L", 102),
          (0, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (0, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      Then("Validate row is selected in view port")
      var selectedRows = vp.getSelection
      selectedRows.size shouldBe 1
      selectedRows.contains(rowToSelect1) shouldBe true

      Given("Select another row")
      val rowToSelect2 = "NYC-0002"
      vp = viewPortContainer.selectRow(viewPort.id, rowToSelect2, preserveExistingSelection = true)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (1, "NYC-0001", "chris", "VOD.L", 101),
          (1, "NYC-0002", "chris", "VOD.L", 102),
          (0, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (0, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      Then("Validate rows are selected in view port")
      selectedRows = vp.getSelection
      selectedRows.size shouldBe 2
      selectedRows.contains(rowToSelect1) shouldBe true
      selectedRows.contains(rowToSelect2) shouldBe true
    }

    Scenario("Select a row without preserving existing selection") {
      Given("A view port of 6 orders is created")
      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()
      createNOrderRows(ordersProvider, 6)(clock)

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "quantity", "ric"))
      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), vpcolumns)
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort))(defaultViewPortUpdate)

      And("Select a row")
      val rowToSelect1 = "NYC-0001"
      var vp = viewPortContainer.selectRow(viewPort.id, rowToSelect1, preserveExistingSelection = true)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (1, "NYC-0001", "chris", "VOD.L", 101),
          (0, "NYC-0002", "chris", "VOD.L", 102),
          (0, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (0, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      Then("Validate row is selected in view port")
      var selectedRows = vp.getSelection
      selectedRows.size shouldBe 1
      selectedRows.contains(rowToSelect1) shouldBe true

      Given("Select another row")
      val rowToSelect2 = "NYC-0002"
      vp = viewPortContainer.selectRow(viewPort.id, rowToSelect2, preserveExistingSelection = true)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (1, "NYC-0001", "chris", "VOD.L", 101),
          (1, "NYC-0002", "chris", "VOD.L", 102),
          (0, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (0, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      Then("Validate rows are selected in view port")
      selectedRows = vp.getSelection
      selectedRows.size shouldBe 2
      selectedRows.contains(rowToSelect1) shouldBe true
      selectedRows.contains(rowToSelect2) shouldBe true

      Given("Select a row without preserving existing selection")
      val rowToSelect3 = "NYC-0003"
      vp = viewPortContainer.selectRow(viewPort.id, rowToSelect3, preserveExistingSelection = false)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (0, "NYC-0001", "chris", "VOD.L", 101),
          (0, "NYC-0002", "chris", "VOD.L", 102),
          (1, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (0, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      Then("Validate rows are selected in view port")
      selectedRows = vp.getSelection
      selectedRows.size shouldBe 1
      selectedRows.contains(rowToSelect3) shouldBe true
    }

    Scenario("Deselect a row and preserve existing selection") {
      Given("A view port of 6 orders is created")
      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()
      createNOrderRows(ordersProvider, 6)(clock)

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "quantity", "ric"))
      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), vpcolumns)
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort))(defaultViewPortUpdate)

      And("Select a range of rows")
      var vp = viewPortContainer.selectRowRange(viewPort.id, "NYC-0001", "NYC-0003", preserveExistingSelection = true)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (1, "NYC-0001", "chris", "VOD.L", 101),
          (1, "NYC-0002", "chris", "VOD.L", 102),
          (1, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (0, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      Then("Validate row is selected in view port")
      var selectedRows = vp.getSelection
      selectedRows.size shouldBe 3

      Given("Deselect a row and preserve existing selection")
      val rowToDeselect = "NYC-0002"
      vp = viewPortContainer.deselectRow(viewPort.id, rowToDeselect, preserveExistingSelection = true)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (1, "NYC-0001", "chris", "VOD.L", 101),
          (0, "NYC-0002", "chris", "VOD.L", 102),
          (1, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (0, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      Then("Validate remaining rows are still selected in view port")
      selectedRows = vp.getSelection
      selectedRows.size shouldBe 2
      selectedRows.contains("NYC-0001") shouldBe true
      selectedRows.contains("NYC-0003") shouldBe true
    }

    Scenario("Deselect a row without preserving existing selection") {
      Given("A view port of 6 orders is created")
      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()
      createNOrderRows(ordersProvider, 6)(clock)

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "quantity", "ric"))
      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), vpcolumns)
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort))(defaultViewPortUpdate)

      And("Select a range of rows")
      var vp = viewPortContainer.selectRowRange(viewPort.id, "NYC-0001", "NYC-0003", preserveExistingSelection = true)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (1, "NYC-0001", "chris", "VOD.L", 101),
          (1, "NYC-0002", "chris", "VOD.L", 102),
          (1, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (0, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      Then("Validate row is selected in view port")
      var selectedRows = vp.getSelection
      selectedRows.size shouldBe 3

      Given("Deselect a row without preserving existing selection")
      val rowToDeselect = "NYC-0002"
      vp = viewPortContainer.deselectRow(viewPort.id, rowToDeselect, preserveExistingSelection = false)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        defaultViewPortUpdate
      }
      Then("Validate all rows are deselected")
      selectedRows = vp.getSelection
      selectedRows.size shouldBe 0
    }

    Scenario("Change row index after rows are selected") {
      Given("A view port of 6 orders is created")
      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()
      createNOrderRows(ordersProvider, 6)(clock)

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "quantity", "ric"))
      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), vpcolumns, sort = SortSpec(List(SortDef("quantity", 'A'))))
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort))(defaultViewPortUpdate)

      And("Select a row")
      val rowToSelect1 = "NYC-0001"
      val vp = viewPortContainer.selectRow(viewPort.id, rowToSelect1, preserveExistingSelection = true)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (1, "NYC-0001", "chris", "VOD.L", 101),
          (0, "NYC-0002", "chris", "VOD.L", 102),
          (0, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (0, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      Then("Validate row is selected in view port")
      val selectedRows = vp.getSelection
      selectedRows.size shouldBe 1
      selectedRows.contains(rowToSelect1) shouldBe true

      When("when order of rows is changed by sorting")
      val viewPortChanged = viewPortContainer.change(RequestId.oneNew(), session, viewPort.id, viewPort.getRange, vpcolumns, sort = SortSpec(List(SortDef("quantity", 'D'))))
      viewPortContainer.runOnce()

      Then("Check selection remains")
      assertVpEqWithMeta(combineQs(viewPortChanged)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (1, "NYC-0001", "chris", "VOD.L", 101),
          (0, "NYC-0002", "chris", "VOD.L", 102),
          (0, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (0, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
    }

    Scenario("Select a row that doesn't exist") {
      Given("A view port of 6 orders is created")
      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()
      createNOrderRows(ordersProvider, 6)(clock)

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "quantity", "ric"))
      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), vpcolumns)
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort))(defaultViewPortUpdate)

      And("Select a row")
      val rowToSelect = "RANDOM"
      assertThrows[Exception] {
        viewPortContainer.selectRow(viewPort.id, rowToSelect, preserveExistingSelection = true)
      }
    }

    Scenario("Select a range of rows and preserve existing selection") {
      Given("A view port of 6 orders is created")
      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()
      createNOrderRows(ordersProvider, 6)(clock)

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "quantity", "ric"))
      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), vpcolumns, sort = SortSpec(List(SortDef("quantity", 'A'))))
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort))(defaultViewPortUpdate)

      And("Select a row")
      val rowToSelect1 = "NYC-0005"
      var vp = viewPortContainer.selectRow(viewPort.id, rowToSelect1, preserveExistingSelection = true)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (0, "NYC-0001", "chris", "VOD.L", 101),
          (0, "NYC-0002", "chris", "VOD.L", 102),
          (0, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (1, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      Then("Validate row is selected in view port")
      var selectedRows = vp.getSelection
      selectedRows.size shouldBe 1
      selectedRows.contains(rowToSelect1) shouldBe true

      And("Select a range of rows")
      val fromRow = "NYC-0001"
      val toRow = "NYC-0003"
      vp = viewPortContainer.selectRowRange(viewPort.id, fromRow, toRow, preserveExistingSelection = true)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (1, "NYC-0001", "chris", "VOD.L", 101),
          (1, "NYC-0002", "chris", "VOD.L", 102),
          (1, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (1, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      Then("Validate row is selected in view port")
      selectedRows = vp.getSelection
      selectedRows.size shouldBe 4
      selectedRows.contains("NYC-0001") shouldBe true
      selectedRows.contains("NYC-0002") shouldBe true
      selectedRows.contains("NYC-0003") shouldBe true
      selectedRows.contains("NYC-0005") shouldBe true
    }

    Scenario("Select a range of rows without preserving existing selection") {
      Given("A view port of 6 orders is created")
      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()
      createNOrderRows(ordersProvider, 6)(clock)

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "quantity", "ric"))
      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), vpcolumns, sort = SortSpec(List(SortDef("quantity", 'A'))))
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort))(defaultViewPortUpdate)

      And("Select a row")
      val rowToSelect1 = "NYC-0005"
      var vp = viewPortContainer.selectRow(viewPort.id, rowToSelect1, preserveExistingSelection = true)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (0, "NYC-0001", "chris", "VOD.L", 101),
          (0, "NYC-0002", "chris", "VOD.L", 102),
          (0, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (1, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      Then("Validate row is selected in view port")
      var selectedRows = vp.getSelection
      selectedRows.size shouldBe 1
      selectedRows.contains(rowToSelect1) shouldBe true

      And("Select a range of rows")
      val fromRow = "NYC-0001"
      val toRow = "NYC-0003"
      vp = viewPortContainer.selectRowRange(viewPort.id, fromRow, toRow, preserveExistingSelection = false)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (1, "NYC-0001", "chris", "VOD.L", 101),
          (1, "NYC-0002", "chris", "VOD.L", 102),
          (1, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (0, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      Then("Validate row is selected in view port")
      selectedRows = vp.getSelection
      selectedRows.size shouldBe 3
      selectedRows.contains("NYC-0001") shouldBe true
      selectedRows.contains("NYC-0002") shouldBe true
      selectedRows.contains("NYC-0003") shouldBe true
    }

    Scenario("Select a range of rows with reverse order") {
      Given("A view port of 6 orders is created")
      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()
      createNOrderRows(ordersProvider, 6)(clock)

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "quantity", "ric"))
      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), vpcolumns, sort = SortSpec(List(SortDef("quantity", 'A'))))
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort))(defaultViewPortUpdate)

      And("Select a range of rows from bottom to top")
      val fromKey = "NYC-0005"
      val toKey = "NYC-0003"
      val vp = viewPortContainer.selectRowRange(viewPort.id, fromKey, toKey, preserveExistingSelection = true)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (0, "NYC-0001", "chris", "VOD.L", 101),
          (0, "NYC-0002", "chris", "VOD.L", 102),
          (1, "NYC-0003", "chris", "VOD.L", 103),
          (1, "NYC-0004", "chris", "VOD.L", 104),
          (1, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      Then("Validate row is selected in view port")
      val selectedRows = vp.getSelection
      selectedRows.size shouldBe 3
      selectedRows.contains("NYC-0005") shouldBe true
      selectedRows.contains("NYC-0004") shouldBe true
      selectedRows.contains("NYC-0003") shouldBe true
    }

    Scenario("Change row index after a range of rows are selected") {
      Given("A view port of 6 orders is created")
      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()
      createNOrderRows(ordersProvider, 6)(clock)

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "quantity", "ric"))
      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), vpcolumns, sort = SortSpec(List(SortDef("quantity", 'A'))))
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort))(defaultViewPortUpdate)

      And("Select a range of rows")
      val fromRow = "NYC-0001"
      val toRow = "NYC-0003"
      val vp = viewPortContainer.selectRowRange(viewPort.id, fromRow, toRow, preserveExistingSelection = true)

      Then("Check selection is updated")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (1, "NYC-0001", "chris", "VOD.L", 101),
          (1, "NYC-0002", "chris", "VOD.L", 102),
          (1, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (0, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      Then("Validate row is selected in view port")
      var selectedRows = vp.getSelection
      selectedRows.size shouldBe 3
      selectedRows.contains("NYC-0001") shouldBe true
      selectedRows.contains("NYC-0002") shouldBe true
      selectedRows.contains("NYC-0003") shouldBe true

      When("when order of rows is changed by sorting")
      val viewPortChanged = viewPortContainer.change(RequestId.oneNew(), session, viewPort.id, viewPort.getRange, vpcolumns, sort = SortSpec(List(SortDef("quantity", 'D'))))
      viewPortContainer.runOnce()

      Then("Check selection remains")
      assertVpEqWithMeta(combineQs(viewPortChanged)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (1, "NYC-0001", "chris", "VOD.L", 101),
          (1, "NYC-0002", "chris", "VOD.L", 102),
          (1, "NYC-0003", "chris", "VOD.L", 103),
          (0, "NYC-0004", "chris", "VOD.L", 104),
          (0, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      selectedRows = viewPortChanged.getSelection
      selectedRows.size shouldBe 3
    }

    Scenario("Select a range of rows that do not exist") {
      Given("A view port of 6 orders is created")
      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()
      createNOrderRows(ordersProvider, 6)(clock)

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "quantity", "ric"))
      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), vpcolumns)
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort))(defaultViewPortUpdate)

      And("Select a row")
      val rowExists = "NYC-0001"
      val rowDoesnNotExist = "RANDOM"
      assertThrows[Exception] {
        viewPortContainer.selectRowRange(viewPort.id, rowDoesnNotExist, rowExists, preserveExistingSelection = true)
      }

      assertThrows[Exception] {
        viewPortContainer.selectRowRange(viewPort.id, rowExists, rowDoesnNotExist, preserveExistingSelection = true)
      }
    }

    Scenario("Select all rows") {
      Given("A view port of 6 orders is created")
      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()
      createNOrderRows(ordersProvider, 6)(clock)

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "quantity", "ric"))
      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 3), vpcolumns, sort = SortSpec(List(SortDef("quantity", 'A'))))
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (0, "NYC-0000", "chris", "VOD.L", 100),
          (0, "NYC-0001", "chris", "VOD.L", 101),
          (0, "NYC-0002", "chris", "VOD.L", 102),
        )
      }

      And("Select all rows")
      val vp = viewPortContainer.selectAll(viewPort.id)

      Then("Check selection is updated for view port range")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (1, "NYC-0000", "chris", "VOD.L", 100),
          (1, "NYC-0001", "chris", "VOD.L", 101),
          (1, "NYC-0002", "chris", "VOD.L", 102),
        )
      }
      Then("Validate all rows are selected in view port")
      val selectedRows = vp.getSelection
      selectedRows.size shouldBe 6
      selectedRows.contains("NYC-0000") shouldBe true
      selectedRows.contains("NYC-0001") shouldBe true
      selectedRows.contains("NYC-0002") shouldBe true
      selectedRows.contains("NYC-0003") shouldBe true
      selectedRows.contains("NYC-0004") shouldBe true
      selectedRows.contains("NYC-0005") shouldBe true
    }

    Scenario("Deselect all rows") {
      Given("A view port of 6 orders is created")
      val (viewPortContainer, orders, ordersProvider, session, outQueue) = createDefaultViewPortInfra()
      createNOrderRows(ordersProvider, 6)(clock)

      val vpcolumns = ViewPortColumnCreator.create(orders, List("orderId", "trader", "quantity", "ric"))
      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, orders, ViewPortRange(0, 10), vpcolumns, sort = SortSpec(List(SortDef("quantity", 'A'))))
      viewPortContainer.runOnce()

      assertVpEqWithMeta(combineQs(viewPort))(defaultViewPortUpdate)

      And("Select all rows")
      var vp = viewPortContainer.selectAll(viewPort.id)

      Then("Check selection is updated for view port range")
      assertVpEqWithMeta(combineQs(viewPort)) {
        Table(
          ("sel", "orderId", "trader", "ric", "quantity"),
          (1, "NYC-0000", "chris", "VOD.L", 100),
          (1, "NYC-0001", "chris", "VOD.L", 101),
          (1, "NYC-0002", "chris", "VOD.L", 102),
          (1, "NYC-0003", "chris", "VOD.L", 103),
          (1, "NYC-0004", "chris", "VOD.L", 104),
          (1, "NYC-0005", "chris", "VOD.L", 105),
        )
      }
      Then("Validate all rows are selected in view port")
      vp.getSelection.size shouldBe 6

      And("Deselect all rows")
      vp = viewPortContainer.deselectAll(viewPort.id)

      Then("Check selection is updated for view port range")
      assertVpEqWithMeta(combineQs(viewPort))(defaultViewPortUpdate)
      Then("Validate all rows are selected in view port")
      vp.getSelection.size shouldBe 0
    }
  }
}
