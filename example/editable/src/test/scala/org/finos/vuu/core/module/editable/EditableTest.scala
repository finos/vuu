package org.finos.vuu.core.module.editable

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.net.rpc.{RpcFunctionSuccess, RpcNames, RpcParams}
import org.finos.vuu.net.{ClientSessionId, RequestContext}
import org.finos.vuu.test.VuuServerTestCase
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.scalatest.prop.Tables.Table

class EditableTest extends VuuServerTestCase {

  Feature("Editable Test Case") {

    Scenario("Check the editable functionality with EditTableRpcHandler") {

      given clock: Clock = new TestFriendlyClock(10001L)

      given lifecycle: LifecycleContainer = new LifecycleContainer()

      given tableDefContainer: TableDefContainer = new TableDefContainer(Map())

      given metricsProvider: MetricsProvider = new MetricsProviderImpl

      withVuuServer(EditTableTestModule()) {
        vuuServer =>
          vuuServer.login("testUser")

          val viewport = vuuServer.createViewPort(EditTableTestModule.NAME, "editTestTable")
          val ctx = RequestContext("", VuuUser(""), ClientSessionId("", ""), null)

          val addRowResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.AddRowRpc, new RpcParams(Map("key" -> "key1", "data" -> Map("rowId" -> "key1", "A" -> "TEST", "B" -> 1001D, "C" -> 500, "D" -> true)), viewport, ctx))
          addRowResult.isInstanceOf[RpcFunctionSuccess] shouldBe true

          vuuServer.runOnce()

          assertVpEq(combineQsForVp(viewport)) {
            Table(
              ("rowId", "A", "B", "C", "D"),
              ("key1", "TEST", 1001.0, 500, true)
            )
          }

          val editRowResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.EditRowRpc, new RpcParams(Map("key" -> "key1", "data" -> Map("rowId" -> "key1", "A" -> "TEST2", "B" -> 2002D, "C" -> 600, "D" -> false)), viewport, ctx))
          editRowResult.isInstanceOf[RpcFunctionSuccess] shouldBe true

          vuuServer.runOnce()

          assertVpEq(combineQsForVp(viewport)) {
            Table(
              ("rowId", "A", "B", "C", "D"),
              ("key1", "TEST2", 2002.0, 600, false)
            )
          }

          val editCellResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.EditCellRpc, new RpcParams(Map("key" -> "key1", "column" -> "A", "data" -> "TEST3"), viewport, ctx))
          editCellResult.isInstanceOf[RpcFunctionSuccess] shouldBe true

          vuuServer.runOnce()

          assertVpEq(combineQsForVp(viewport)) {
            Table(
              ("rowId", "A", "B", "C", "D"),
              ("key1", "TEST3", 2002.0, 600, false)
            )
          }

          val deleteCellResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.DeleteCellRpc, new RpcParams(Map("key" -> "key1", "column" -> "A"), viewport, ctx))
          deleteCellResult.isInstanceOf[RpcFunctionSuccess] shouldBe true

          vuuServer.runOnce()

          assertVpEq(combineQsForVp(viewport)) {
            Table(
              ("rowId", "A", "B", "C", "D"),
              ("key1", null, 2002.0, 600, false)
            )
          }

          val deleteRowResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.DeleteRowRpc, new RpcParams(Map("key" -> "key1"), viewport, ctx))
          deleteRowResult.isInstanceOf[RpcFunctionSuccess] shouldBe true

          vuuServer.runOnce()

          assertVpEq(combineQsForVp(viewport)) {
            Table(
              ("rowId", "A", "B", "C", "D"),
            )
          }

          val submitFormResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.SubmitFormRpc, new RpcParams(Map("comment" -> "Some comment"), viewport, ctx))
          submitFormResult.isInstanceOf[RpcFunctionSuccess] shouldBe true
          submitFormResult.asInstanceOf[RpcFunctionSuccess].optionalResult.get shouldBe "Some comment"

          val closeFormResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.CloseFormRpc, new RpcParams(Map.empty, viewport, ctx))
          closeFormResult.isInstanceOf[RpcFunctionSuccess] shouldBe true
      }
    }
  }
}
