package org.finos.vuu.net.rpc

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.net.{ClientSessionId, RequestContext}
import org.finos.vuu.provider.JoinTableProviderImpl
import org.scalatest.BeforeAndAfterEach
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class DefaultRpcHandlerTest extends AnyFeatureSpec with Matchers with BeforeAndAfterEach {
  private var handler: DefaultRpcHandler = _
  private val ctx = RequestContext("requestId", ClientSessionId("sessionId", "user", "channel"), null, "token")

  override def beforeEach(): Unit = {
    implicit val clock: Clock = new DefaultClock
    implicit val lifecycleContainer: LifecycleContainer = new LifecycleContainer
    implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl
    implicit val tableContainer: TableContainer = new TableContainer(JoinTableProviderImpl())
    handler = new DefaultRpcHandler
  }

  Feature("Default Rpc Handler for Viewport Rpc") {
    Scenario("Can register and handle Rpc request that perform action") {
      handler.registerRpc("myMethod", _ => new RpcFunctionSuccess())

      val result = handler.processRpcRequest("myMethod", new RpcParams(Map("namedParam1" -> "value1"), null, ctx))

      result should be(RpcFunctionSuccess(None))
    }

    Scenario("Throw exception when registering a function under already registered name") {

      handler.registerRpc("myMethod", _ => new RpcFunctionSuccess("result1"))

      assertThrows[IllegalArgumentException] {
        handler.registerRpc("myMethod", _ => RpcFunctionSuccess(Some("result2")))
      }
    }

    Scenario("Rpc request with null params should return ViewPortRpcSuccess when the rpc method is successful") {
      handler.registerRpc("myMethod", _ => new RpcFunctionSuccess())

      val result = handler.processRpcRequest("myMethod", new RpcParams(null, null, ctx))

      result should be(RpcFunctionSuccess(None))
    }

    Scenario("Rpc request should return ViewPortRpcFailure when the rpc method fails") {
      handler.registerRpc("myMethod", _ => RpcFunctionFailure(1, "error", new Exception("exception")))

      val result = handler.processRpcRequest("myMethod", new RpcParams(null, null, ctx))

      result.isInstanceOf[RpcFunctionFailure] shouldBe true
      result.asInstanceOf[RpcFunctionFailure].code shouldBe 1
      result.asInstanceOf[RpcFunctionFailure].error shouldBe "error"
      result.asInstanceOf[RpcFunctionFailure].exception.getMessage shouldBe "exception"
    }
  }
}
