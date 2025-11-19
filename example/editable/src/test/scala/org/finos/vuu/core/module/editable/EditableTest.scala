package org.finos.vuu.core.module.editable

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.table.TableTestHelper.combineQs
import org.finos.vuu.net.{ClientSessionId, RequestContext}
import org.finos.vuu.net.rpc.{RpcFunctionSuccess, RpcNames, RpcParams}
import org.finos.vuu.test.VuuServerTestCase
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.scalatest.prop.Tables.Table

class EditableTest extends VuuServerTestCase {

  Feature("Editable Test Case") {

    // TODO #1790 to be deleted
    Scenario("Check the editable functionality") {

      implicit val clock: Clock = new TestFriendlyClock(10001L)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())
      implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl

      withVuuServer(EditableTestModule()) {
        vuuServer =>

          vuuServer.login("testUser")

          val viewport = vuuServer.createViewPort(EditableTestModule.NAME, "editTestTable")

          val service = vuuServer.getViewPortRpcServiceProxy[TestEditableServiceIF](viewport)

          service.addRowAction().func("key1", Map("rowId" -> "key1", "A" -> "TEST", "B" -> 1001D, "C" -> 500, "D" -> true), viewport, vuuServer.session)

          vuuServer.runOnce()

          assertVpEq(combineQsForVp(viewport)) {
            Table(
              ("rowId", "A", "B", "C", "D"),
              ("key1", "TEST", 1001.0, 500, true)
            )
          }

          service.editCellAction().func("key1", "B", 200D.asInstanceOf[Object], viewport, vuuServer.session)

          vuuServer.runOnce()

          assertVpEq(combineQsForVp(viewport)) {
            Table(
              ("rowId", "A", "B", "C", "D"),
              ("key1", "TEST", 200.0, 500, true)
            )
          }

          service.addRowAction().func("key1", Map("rowId" -> "key2", "A" -> "TEST2", "B" -> 1001D, "C" -> 500, "D" -> true), viewport, vuuServer.session)

          vuuServer.runOnce()

          assertVpEq(combineQsForVp(viewport)) {
            Table(
              ("rowId", "A", "B", "C", "D"),
              ("key2", "TEST2", 1001.0, 500, true)
            )
          }

          service.deleteRowAction().func("key1", viewport, vuuServer.session)

          vuuServer.runOnce()

          assertVpEq(combineQsForVp(viewport)) {
            Table(
              ("rowId", "A", "B", "C", "D")
            )
          }

      }
    }

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
          val rpcResult = viewport.getStructure.viewPortDef.service.processRpcRequest(RpcNames.OnFormSubmitRpc, new RpcParams(Map("comment" -> "Some comment"), viewport, ctx))
          rpcResult.isInstanceOf[RpcFunctionSuccess] shouldBe true
          rpcResult.asInstanceOf[RpcFunctionSuccess].optionalResult.get shouldBe "Some comment"

        // TODO 1790 add tests for other rpc calls in EditableTestService

      }
    }
  }
}
