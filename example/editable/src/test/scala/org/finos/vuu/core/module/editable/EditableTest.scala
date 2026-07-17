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
  given clock: Clock = new TestFriendlyClock(10001L)

  given lifecycle: LifecycleContainer = new LifecycleContainer()

  given tableDefContainer: TableDefContainer = new TableDefContainer(Map())

  given metricsProvider: MetricsProvider = new MetricsProviderImpl

  Feature("Check the editable functionality with EditTableRpcHandler") {

    Scenario("Add row") {
      withVuuServer(EditTableTestModule()) {
        vuuServer =>
          vuuServer.login("testUser")
          val viewport = vuuServer.createViewPort(EditTableTestModule.NAME, "editTestTable")
          val ctx = RequestContext("", VuuUser(""), ClientSessionId("", ""), null)

          val data: Map[Any, Any] = Map("rowId" -> "key1", "A" -> "TEST", "B" -> 1001D, "C" -> 500, "D" -> true)
          val addRowResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.AddRowRpc, new RpcParams(Map("key" -> "key1", "data" -> data), viewport, ctx))
          addRowResult.isInstanceOf[RpcFunctionSuccess] shouldBe true

          vuuServer.runOnce()
          assertVpEq(combineQsForVp(viewport), Array("rowId", "A", "B", "C", "D"), Array(data))
      }
    }

    Scenario("Edit row and edit cell") {
      withVuuServer(EditTableTestModule()) {
        vuuServer =>
          vuuServer.login("testUser")
          val viewport = vuuServer.createViewPort(EditTableTestModule.NAME, "editTestTable")
          val ctx = RequestContext("", VuuUser(""), ClientSessionId("", ""), null)
          val data: Map[Any, Any] = Map("rowId" -> "key1", "A" -> "TEST", "B" -> 1001D, "C" -> 500, "D" -> true)
          viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.AddRowRpc, new RpcParams(Map("key" -> "key1", "data" -> data), viewport, ctx))
          vuuServer.runOnce()
          assertVpEq(combineQsForVp(viewport), Array("rowId", "A", "B", "C", "D"), Array(data))

          val data2: Map[Any, Any] = Map("rowId" -> "key1", "A" -> "TEST2", "B" -> 2002D, "C" -> 600, "D" -> false)
          val editRowResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.EditRowRpc, new RpcParams(Map("key" -> "key1", "data" -> data2), viewport, ctx))
          editRowResult.isInstanceOf[RpcFunctionSuccess] shouldBe true

          vuuServer.runOnce()
          assertVpEq(combineQsForVp(viewport), Array("rowId", "A", "B", "C", "D"), Array(data2))
      }
    }

    Scenario("Edit cell") {
      withVuuServer(EditTableTestModule()) {
        vuuServer =>
          vuuServer.login("testUser")
          val viewport = vuuServer.createViewPort(EditTableTestModule.NAME, "editTestTable")
          val ctx = RequestContext("", VuuUser(""), ClientSessionId("", ""), null)
          val data: Map[Any, Any] = Map("rowId" -> "key1", "A" -> "TEST", "B" -> 1001D, "C" -> 500, "D" -> true)
          viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.AddRowRpc, new RpcParams(Map("key" -> "key1", "data" -> data), viewport, ctx))
          vuuServer.runOnce()
          assertVpEq(combineQsForVp(viewport), Array("rowId", "A", "B", "C", "D"), Array(data))

          val editCellResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.EditCellRpc, new RpcParams(Map("key" -> "key1", "column" -> "A", "data" -> "TEST3"), viewport, ctx))
          editCellResult.isInstanceOf[RpcFunctionSuccess] shouldBe true

          vuuServer.runOnce()
          assertVpEq(combineQsForVp(viewport), Array("rowId", "A", "B", "C", "D"),
            Array(Map("rowId" -> "key1", "A" -> "TEST3", "B" -> 1001D, "C" -> 500, "D" -> true)))
      }
    }

    Scenario("Delete row") {
      withVuuServer(EditTableTestModule()) {
        vuuServer =>
          vuuServer.login("testUser")
          val viewport = vuuServer.createViewPort(EditTableTestModule.NAME, "editTestTable")
          val ctx = RequestContext("", VuuUser(""), ClientSessionId("", ""), null)
          val data: Map[Any, Any] = Map("rowId" -> "key1", "A" -> "TEST", "B" -> 1001D, "C" -> 500, "D" -> true)
          viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.AddRowRpc, new RpcParams(Map("key" -> "key1", "data" -> data), viewport, ctx))
          vuuServer.runOnce()
          assertVpEq(combineQsForVp(viewport), Array("rowId", "A", "B", "C", "D"), Array(data))

          val deleteRowResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.DeleteRowRpc, new RpcParams(Map("key" -> "key1"), viewport, ctx))
          deleteRowResult.isInstanceOf[RpcFunctionSuccess] shouldBe true

          vuuServer.runOnce()
          assertVpEq(combineQsForVp(viewport), Array("rowId", "A", "B", "C", "D"), Array())
      }
    }

    Scenario("Delete selected rows") {
      withVuuServer(EditTableTestModule()) {
        vuuServer =>
          vuuServer.login("testUser")
          val viewport = vuuServer.createViewPort(EditTableTestModule.NAME, "editTestTable")
          val ctx = RequestContext("", VuuUser(""), ClientSessionId("", ""), null)
          val data: Map[Any, Any] = Map("rowId" -> "key1", "A" -> "TEST", "B" -> 1001D, "C" -> 500, "D" -> true)
          val data2: Map[Any, Any] = Map("rowId" -> "key2", "A" -> "TEST", "B" -> 1001D, "C" -> 500, "D" -> true)
          viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.AddRowRpc, new RpcParams(Map("key" -> "key1", "data" -> data), viewport, ctx))
          viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.AddRowRpc, new RpcParams(Map("key" -> "key2", "data" -> data2), viewport, ctx))
          vuuServer.runOnce()
          assertVpEq(combineQsForVp(viewport), Array("rowId", "A", "B", "C", "D"), Array(data, data2))

          viewport.selectRow("key1", false)

          val deleteSelectedRowsResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.DeleteSelectedRowsRpc, new RpcParams(Map("key" -> "key1"), viewport, ctx))
          deleteSelectedRowsResult.isInstanceOf[RpcFunctionSuccess] shouldBe true

          vuuServer.runOnce()
          assertVpEq(combineQsForVp(viewport), Array("rowId", "A", "B", "C", "D"), Array(data2))
      }
    }

    Scenario("Delete cell") {
      withVuuServer(EditTableTestModule()) {
        vuuServer =>
          vuuServer.login("testUser")
          val viewport = vuuServer.createViewPort(EditTableTestModule.NAME, "editTestTable")
          val ctx = RequestContext("", VuuUser(""), ClientSessionId("", ""), null)
          val data: Map[Any, Any] = Map("rowId" -> "key1", "A" -> "TEST", "B" -> 1001D, "C" -> 500, "D" -> true)
          viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.AddRowRpc, new RpcParams(Map("key" -> "key1", "data" -> data), viewport, ctx))
          vuuServer.runOnce()
          assertVpEq(combineQsForVp(viewport), Array("rowId", "A", "B", "C", "D"), Array(data))

          val deleteCellResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.DeleteCellRpc, new RpcParams(Map("key" -> "key1", "column" -> "A"), viewport, ctx))
          deleteCellResult.isInstanceOf[RpcFunctionSuccess] shouldBe true

          vuuServer.runOnce()
          assertVpEq(combineQsForVp(viewport), Array("rowId", "A", "B", "C", "D"),
            Array(Map("rowId" -> "key1", "A" -> null, "B" -> 1001D, "C" -> 500, "D" -> true)))
      }
    }

    Scenario("Submit form") {
      withVuuServer(EditTableTestModule()) {
        vuuServer =>
          vuuServer.login("testUser")
          val viewport = vuuServer.createViewPort(EditTableTestModule.NAME, "editTestTable")
          val ctx = RequestContext("", VuuUser(""), ClientSessionId("", ""), null)

          val submitFormResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.SubmitFormRpc, new RpcParams(Map("comment" -> "Some comment"), viewport, ctx))
          submitFormResult.isInstanceOf[RpcFunctionSuccess] shouldBe true
          submitFormResult.asInstanceOf[RpcFunctionSuccess].optionalResult.get shouldBe "Some comment"
      }
    }

    Scenario("Close form") {
      withVuuServer(EditTableTestModule()) {
        vuuServer =>
          vuuServer.login("testUser")
          val viewport = vuuServer.createViewPort(EditTableTestModule.NAME, "editTestTable")
          val ctx = RequestContext("", VuuUser(""), ClientSessionId("", ""), null)

          val closeFormResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.CloseFormRpc, new RpcParams(Map.empty, viewport, ctx))
          closeFormResult.isInstanceOf[RpcFunctionSuccess] shouldBe true
      }
    }

    Scenario("Undo row change") {
      withVuuServer(EditTableTestModule()) {
        vuuServer =>
          vuuServer.login("testUser")
          val viewport = vuuServer.createViewPort(EditTableTestModule.NAME, "editTestTable")
          val ctx = RequestContext("", VuuUser(""), ClientSessionId("", ""), null)
          val data: Map[Any, Any] = Map("rowId" -> "key1", "A" -> "TEST", "B" -> 1001D, "C" -> 500, "D" -> true)
          viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.AddRowRpc, new RpcParams(Map("key" -> "key1", "data" -> data), viewport, ctx))
          vuuServer.runOnce()
          assertVpEq(combineQsForVp(viewport), Array("rowId", "A", "B", "C", "D"), Array(data))

          viewport.selectRow("key1", false)

          val undoRowChangeResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.UndoRowChangeRpc, new RpcParams(Map("key" -> "key1"), viewport, ctx))
          undoRowChangeResult.isInstanceOf[RpcFunctionSuccess] shouldBe true

          vuuServer.runOnce()
          assertVpEq(combineQsForVp(viewport), Array("rowId", "A", "B", "C", "D"), Array(Map("rowId" -> "key1", "A" -> null, "B" -> null, "C" -> null, "D" -> null)))
      }
    }
  }
}
