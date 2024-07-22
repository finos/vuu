package org.finos.vuu.net.rpc

import org.finos.vuu.net.{ClientSessionId, Error, JsonViewServerMessage, RequestContext, RpcCall, RpcResponse}
import org.finos.vuu.util.PublishQueue
import org.finos.vuu.viewport.{ViewPortRpcFailure, ViewPortRpcSuccess, ViewPortUpdate}
import org.scalatest.BeforeAndAfterEach
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

class DefaultRpcHandlerTest extends AnyFlatSpec with Matchers with BeforeAndAfterEach {
  var handler: DefaultRpcHandler = _
  val ctx = RequestContext("requestId", ClientSessionId("sessionId", "user"), null, "token")

  override def beforeEach(): Unit = {
    handler = new DefaultRpcHandler
  }

  "The registerRpcMethodHandler method" should "register a handler for a given rpc method" in {
    val rpcFunctionMethodHandler = new RpcFunctionMethodHandler(_ => RpcMethodSuccess("result"))

    handler.registerRpcMethodHandler("myMethod", rpcFunctionMethodHandler)

    handler.processViewPortRpcCall("myMethod", Array("param1"), Map("namedParam1" -> "value1"))(null) should be (ViewPortRpcSuccess())
  }

  "The registerRpcMethodHandler method" should "not register a function under already registered name" in {
    val rpcFunctionMethodHandler = new RpcFunctionMethodHandler(_ => RpcMethodSuccess("result"))

    handler.registerRpcMethodHandler("myMethod", rpcFunctionMethodHandler)

    assertThrows[IllegalArgumentException] {
      handler.registerRpcMethodHandler("myMethod", rpcFunctionMethodHandler)
    }
  }

  "The registerRpcMethodHandler method" should "register a java function and call it" in {
    val rpcJavaFunctionMethodHandler = new RpcJavaFunctionMethodHandler(params => RpcMethodSuccess(params.namedParams("namedParam1").toString))

    handler.registerRpcMethodHandler("myMethod", rpcJavaFunctionMethodHandler)

    handler.processViewPortRpcCall("myMethod", Array("param1"), Map("namedParam1" -> "value1"))(null) should be (ViewPortRpcSuccess())
  }

  "The processViewPortRpcCall method with null params" should "return ViewPortRpcSuccess when the rpc method is successful" in {
    handler.registerRpcMethodHandler("myMethod", _ => RpcMethodSuccess("result"))

    val result = handler.processViewPortRpcCall("myMethod", null, null)(null)

    result should be (ViewPortRpcSuccess())
  }

  "The processViewPortRpcCall method with null params" should "return ViewPortRpcFailure when the rpc method fails" in {
    handler.registerRpcMethodHandler("myMethod", _ => RpcMethodFailure(1, "error", new Exception("exception")))

    val result = handler.processViewPortRpcCall("myMethod", null, null)(null)

    result should be (ViewPortRpcFailure("Exception occurred calling rpc myMethod"))
  }

  "The processRpcCall method" should "return Some(ViewServerMessage) when the rpc method is successful" in {
    handler.registerRpcMethodHandler("myMethod", _ => RpcMethodSuccess("result"))

    val rpcCall = RpcCall("myService", "myMethod", Array("param1"), Map("namedParam1" -> "value1"))

    val result = handler.processRpcCall(null, rpcCall)(ctx)

    result should be (Some(JsonViewServerMessage("requestId", "sessionId", "token", "user", RpcResponse("myMethod", RpcMethodSuccess("result"), null))))
  }

  "The processRpcCall method" should "return Some(ViewServerMessage) when the rpc method fails" in {
    handler.registerRpcMethodHandler("myMethod", _ => RpcMethodFailure(1, "error", new Exception("exception")))

    val rpcCall = RpcCall("myService", "myMethod", Array("param1"), Map("namedParam1" -> "value1"))


    val result = handler.processRpcCall(null, rpcCall)(ctx)

    result should be (Some(JsonViewServerMessage("requestId", "sessionId", "token", "user", RpcResponse("myMethod", null, Error("error", 1)), "")))
  }

  "The processRpcCall method" should "return error when method not found " in {
    val rpcCall = RpcCall("myService", "myMethod", Array("param1"), Map("namedParam1" -> "value1"))
    handler.processRpcCall(null, rpcCall)(ctx) should be (Some(JsonViewServerMessage("requestId", "sessionId", "token", "user", RpcResponse("myMethod", null, Error("Could not find rpcMethodHandler myMethod", 1)), "")))
  }

}