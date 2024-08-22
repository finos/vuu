package org.finos.vuu.net.rpc

import org.finos.vuu.net.{ClientSessionId, Error, JsonViewServerMessage, RequestContext, RpcCall, RpcResponse}
import org.finos.vuu.viewport.{DisplayResultAction, ViewPortRpcFailure, ViewPortRpcSuccess}
import org.scalatest.BeforeAndAfterEach
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class DefaultRpcHandlerTest extends AnyFeatureSpec with Matchers with BeforeAndAfterEach {
  private var handler: DefaultRpcHandler = _
  private val ctx = RequestContext("requestId", ClientSessionId("sessionId", "user"), null, "token")
  private val msg = JsonViewServerMessage("requestId", "sessionId", "token", "user", null, module = "TEST_MODULE")

  override def beforeEach(): Unit = {
    handler = new DefaultRpcHandler
  }

  Feature("Default Rpc Handler for Viewport Rpc") {
    Scenario("Can register and handle Rpc request that perform action") {
      handler.registerRpc("myMethod", _ => new RpcFunctionSuccess())

      val result = handler.processViewPortRpcCall("myMethod", new RpcParams(Array("param1"), Map("namedParam1" -> "value1"), null, None, ctx))

      result should be(ViewPortRpcSuccess())
    }

    Scenario("Can register and handle Rpc request that returns result") {
      handler.registerRpc("myMethod", _ => new RpcFunctionSuccess("result"))

      val result = handler.processViewPortRpcCall("myMethod", new RpcParams(Array("param1"), Map("namedParam1" -> "value1"), null, None, ctx))

      result should be(DisplayResultAction("result"))
    }

    Scenario("Throw exception when registering a function under already registered name") {

      handler.registerRpc("myMethod", _ => new RpcFunctionSuccess("result1"))

      assertThrows[IllegalArgumentException] {
        handler.registerRpc("myMethod", _ => RpcFunctionSuccess(Some("result2")))
      }
    }

    Scenario("Rpc request with null params should return ViewPortRpcSuccess when the rpc method is successful") {
      handler.registerRpc("myMethod", _ => new RpcFunctionSuccess())

      val result = handler.processViewPortRpcCall("myMethod", new RpcParams(null, null, null, None, ctx))

      result should be(ViewPortRpcSuccess())
    }

    Scenario("Rpc request should return ViewPortRpcFailure when the rpc method fails") {
      handler.registerRpc("myMethod", _ => RpcFunctionFailure(1, "error", new Exception("exception")))

      val result = handler.processViewPortRpcCall("myMethod", new RpcParams(null, null, null, None, ctx))

      result should be(ViewPortRpcFailure("Exception occurred calling rpc myMethod"))
    }
  }

  Feature("Default Rpc Handler for global Rpc") {
    Scenario("Rcp handler should return Some(ViewServerMessage) when the rpc method is successful") {
      handler.registerRpc("myMethod", _ => new RpcFunctionSuccess("result"))

      val rpcCall = RpcCall("myService", "myMethod", Array("param1"), Map("namedParam1" -> "value1"))

      val result = handler.processRpcCall(msg, rpcCall)(ctx)

      result should be(Some(JsonViewServerMessage("requestId", "sessionId", "token", "user", RpcResponse("myMethod", "result", null), module = "TEST_MODULE")))
    }

    Scenario("Rpc handler should return Some(ViewServerMessage) when the rpc method fails") {
      handler.registerRpc("myMethod", _ => RpcFunctionFailure(1, "error", new Exception("exception")))

      val rpcCall = RpcCall("myService", "myMethod", Array("param1"), Map("namedParam1" -> "value1"))


      val result = handler.processRpcCall(null, rpcCall)(ctx)

      result should be(Some(JsonViewServerMessage("requestId", "sessionId", "token", "user", RpcResponse("myMethod", null, Error("error", 1)), "")))
    }

    Scenario("Rpc handler should return Some(ViewServerMessage) when the rpc method is not found") {
      val rpcCall = RpcCall("myService", "myMethod", Array("param1"), Map("namedParam1" -> "value1"))
      handler.processRpcCall(msg, rpcCall)(ctx) should be(Some(JsonViewServerMessage("requestId", "sessionId", "token", "user", RpcResponse("myMethod", null, Error("Could not find rpcMethodHandler myMethod", 1)), "TEST_MODULE")))
    }
  }
}