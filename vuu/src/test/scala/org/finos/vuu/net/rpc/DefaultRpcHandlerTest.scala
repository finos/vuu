package org.finos.vuu.net.rpc

import org.finos.vuu.net.JsonViewServerMessage
import org.finos.vuu.viewport.{ViewPortRpcFailure, ViewPortRpcSuccess}
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

class DefaultRpcHandlerTest extends AnyFlatSpec with Matchers {
  val handler = new DefaultRpcHandler

//  "The processViewPortRpcCall method" should "return ViewPortRpcSuccess when the rpc method is successful" in {
//    val result = handler.processViewPortRpcCall("myMethod", Array("param1"), Map("namedParam1" -> "value1"))(null)
//
//    result should be (ViewPortRpcSuccess())
//  }
//
//  it should "return ViewPortRpcFailure when the rpc method fails" in {
//    val result = handler.processViewPortRpcCall("myMethod", Array("param1"), Map("namedParam1" -> "value1"))(null)
//
//    result should be (ViewPortRpcFailure("Exception occurred calling rpc myMethod"))
//  }

//  "The processRpcCall method" should "return a VsMsg with RpcResponse when the rpc method is successful" in {
//
//
//    val result = handler.processRpcCall(msg, rpc)(null)
//
//    result should be (Some(VsMsg(msg.requestId, msg.session.sessionId, msg.token, msg.session.user, RpcResponse("myMethod", RpcSuccess(), null), "myModule")))
//  }

//  it should "return a VsMsg with RpcResponse and Error when the rpc method fails" in {
//    val msg = JsonViewServerMessage.parse("""{
//                                            |  "msgType": "RpcCall",
//                                            |  "module": "myModule",
//                                            |  "rpc": {
//                                            |    "method": "myMethod",
//                                            |    "params": ["param1"],
//                                            |    "namedParams": {
//                                            |      "namedParam1": "value1"
//                                            |    }
//                                            |  }
//                                            |}""")
//
//    val result = handler.processRpcCall(msg, msg.rpc)(null)
//
//    result should be (Some(VsMsg(msg.requestId, msg.session.sessionId, msg.token, msg.session.user, RpcResponse("myMethod", null, Error("Exception occurred calling rpc myMethod", 1)), "myModule")))
//  }
//
//  it should "return None when the method is not found" in {
//    val msg = JsonViewServerMessage.parse("""{
//                                            |  "msgType": "RpcCall",
//                                            |  "module": "myModule",
//                                            |  "rpc": {
//                                            |    "method": "myMethod",
//                                            |    "params": ["param1"],
//                                            |    "namedParams": {
//                                            |      "namedParam1": "value1"
//                                            |    }
//                                            |  }
//                                            |}""")
//
//    val result = handler.processRpcCall(msg, msg.rpc)(null)
//
//    result should be (None)
//  }
}