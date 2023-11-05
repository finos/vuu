package org.finos.vuu.viewport.editable

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.table.TableTestHelper.{combineQs, emptyQueues}
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.finos.vuu.viewport.{CloseDialogViewPortAction, DefaultRange, OpenDialogViewPortAction, ViewPortSelectedIndices}

class EditableViewportWithRpcTest extends EditableViewPortTest {

  final implicit val clock: Clock = new TestFriendlyClock(TEST_TIME)
  final implicit val lifecycle: LifecycleContainer = new LifecycleContainer
  final implicit val metrics: MetricsProvider = new MetricsProviderImpl

  Feature("Test full flow through editable session table") {

    Scenario("Create a session table based on a user action and populate it with callbacks") {

      val (viewPortContainer, process, processProvider, session, outQueue, fixSequence, tableContainer) = setupEditableTableInfra()

      Given("We create a viewport on the process table (view only)")
      val vpcolumns = ViewPortColumnCreator.create(process, process.getTableDef.columns.map(_.name).toList)

//      Given("We define a viewport callback on process with an rpc service attached...")
//      viewPortContainer.addViewPortDefinition(process.getTableDef.name, createViewPortDefFunc(tableContainer, new ProcessRpcService(tableContainer, clock), clock))
//
//      viewPortContainer.addViewPortDefinition(fixSequence.getTableDef.name, createViewPortDefFunc(tableContainer, new FixSequenceNumberResetService(), clock))
//
//      And("we've ticked in some data")
//      processProvider.tick("proc-1", Map("id" -> "proc-1", "name" -> "My Process 1", "uptime" -> 5000L, "status" -> "running"))
//      processProvider.tick("proc-2", Map("id" -> "proc-2", "name" -> "My Process 2", "uptime" -> 5000L, "status" -> "running"))
//
//      Then("we create a viewport...")
//      val viewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, process, DefaultRange, vpcolumns)
//
//      viewPortContainer.runOnce()
//
//      And("change the selection, so we have first row selected")
//      viewPortContainer.changeSelection(session, outQueue, viewPort.id, ViewPortSelectedIndices(Array(0)))
//
//      Then("call rpc call to create session table, this should create an OpenDialogViewPortAction")
//      val action = viewPortContainer.callRpcSelection(viewPort.id, "OPEN_EDIT_RESET_FIX", session).asInstanceOf[OpenDialogViewPortAction]
//
//      action.renderComponent should equal("inline-form")
//      action.table.table should startWith("session:")
//      action.table.module should equal("TEST")
//
//      emptyQueues(viewPort)
//
//      Then("At this point the UI will create a viewport on the new table")
//      val sessionTable = tableContainer.getTable(action.table.table)
//      val sessionColumns = ViewPortColumnCreator.create(sessionTable, sessionTable.getTableDef.columns.map(_.name).toList)
//
//      val sessionViewPort = viewPortContainer.create(RequestId.oneNew(), session, outQueue, sessionTable, DefaultRange, sessionColumns)
//
//      viewPortContainer.runOnce()
//
//      Then("verify the table is populated")
//      assertVpEq(combineQs(sessionViewPort)) {
//        Table(
//          ("process-id", "sequenceNumber"),
//          ("proc-1", 0)
//        )
//      }
//
//      viewPortContainer.callRpcEditCell(sessionViewPort.id, "proc-1", "sequenceNumber", Long.box(100001L), session)
//
//      viewPortContainer.runOnce()
//
//      Then("verify the table is populated")
//      assertVpEq(combineQs(sessionViewPort)) {
//        Table(
//          ("process-id", "sequenceNumber"),
//          ("proc-1", 100001L)
//        )
//      }
//
//      val actionClose = viewPortContainer.callRpcFormSubmit(sessionViewPort.id, session)
//
//      actionClose.getClass should equal(classOf[CloseDialogViewPortAction])
    }
  }

}
