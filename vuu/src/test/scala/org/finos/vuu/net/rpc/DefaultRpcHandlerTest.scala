package org.finos.vuu.net.rpc

import org.finos.vuu.net.{ClientSessionId, Error, JsonViewServerMessage, RequestContext, RpcCall, RpcResponse}
import org.finos.vuu.viewport.{ViewPortRpcFailure, ViewPortRpcSuccess}
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

  Feature("Default Rpc Handler") {
    Scenario("Register Rpc Method Handler for a method") {
      val rpcFunctionMethodHandler = new RpcFunctionMethodHandler(_ => RpcMethodSuccess("result"))

      handler.registerRpcMethodHandler("myMethod", rpcFunctionMethodHandler)

      handler.processViewPortRpcCall("myMethod", Array("param1"), Map("namedParam1" -> "value1"))(null) should be(ViewPortRpcSuccess())
    }

    Scenario("Throw exception when registering a function under already registered name") {
      val rpcFunctionMethodHandler = new RpcFunctionMethodHandler(_ => RpcMethodSuccess("result"))

      handler.registerRpcMethodHandler("myMethod", rpcFunctionMethodHandler)

      assertThrows[IllegalArgumentException] {
        handler.registerRpcMethodHandler("myMethod", rpcFunctionMethodHandler)
      }
    }

    Scenario("ProcessViewPortRpcCall method with null params should return ViewPortRpcSuccess when the rpc method is successful") {
      handler.registerRpcMethodHandler("myMethod", _ => RpcMethodSuccess("result"))

      val result = handler.processViewPortRpcCall("myMethod", null, null)(null)

      result should be(ViewPortRpcSuccess())
    }

    Scenario("The processViewPortRpcCall method with null params should return ViewPortRpcFailure when the rpc method fails") {
      handler.registerRpcMethodHandler("myMethod", _ => RpcMethodFailure(1, "error", new Exception("exception")))

      val result = handler.processViewPortRpcCall("myMethod", null, null)(null)

      result should be(ViewPortRpcFailure("Exception occurred calling rpc myMethod"))
    }

    Scenario("The processRpcCall method should return Some(ViewServerMessage) when the rpc method is successful") {
      handler.registerRpcMethodHandler("myMethod", _ => RpcMethodSuccess("result"))

      val rpcCall = RpcCall("myService", "myMethod", Array("param1"), Map("namedParam1" -> "value1"))

      val result = handler.processRpcCall(msg, rpcCall)(ctx)

      result should be(Some(JsonViewServerMessage("requestId", "sessionId", "token", "user", RpcResponse("myMethod", "result", null), module = "TEST_MODULE")))
    }

    Scenario("The processRpcCall method should return Some(ViewServerMessage) when the rpc method fails") {
      handler.registerRpcMethodHandler("myMethod", _ => RpcMethodFailure(1, "error", new Exception("exception")))

      val rpcCall = RpcCall("myService", "myMethod", Array("param1"), Map("namedParam1" -> "value1"))


      val result = handler.processRpcCall(null, rpcCall)(ctx)

      result should be(Some(JsonViewServerMessage("requestId", "sessionId", "token", "user", RpcResponse("myMethod", null, Error("error", 1)), "")))
    }

    Scenario("The processRpcCall method should return Some(ViewServerMessage) when the rpc method is not found") {
      val rpcCall = RpcCall("myService", "myMethod", Array("param1"), Map("namedParam1" -> "value1"))
      handler.processRpcCall(msg, rpcCall)(ctx) should be(Some(JsonViewServerMessage("requestId", "sessionId", "token", "user", RpcResponse("myMethod", null, Error("Could not find rpcMethodHandler myMethod", 1)), "TEST_MODULE")))
    }
  }
}