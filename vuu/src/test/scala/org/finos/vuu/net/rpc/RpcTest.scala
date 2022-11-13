package org.finos.vuu.net.rpc

import org.finos.vuu.net._
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class RpcTest extends AnyFeatureSpec with Matchers {

  class MyCustomRpcHandler extends RpcHandler{
    def doSomething(param1: String, param2: Double)(ctx: RequestContext): Boolean = {
      println("did it!")
      true
    }

    def doSomething(param1: Boolean)(ctx: RequestContext): Boolean = {
      println("doing something false .")
      false
    }

    def doSomethingElse()(ctx: RequestContext): String = {
      "doing something else.."
    }

    def onClick(map: Map[String, Any])(ctx: RequestContext): String = {
      s"got map $map"
    }

    def onClickArray(array: Array[String])(ctx: RequestContext): String = {
      s"got map $array"
    }

    def customObject(custom: LoginRequest)(ctx: RequestContext): String = {
      s"got a custom object $custom"
    }

  }


  def toVsMsg(body: RpcCall): ViewServerMessage = {
    JsonViewServerMessage("REQ:123", "SESS:456", "AAA", "chris", body)
  }

  Feature("check rpc method handling"){

    Scenario("check we can process an rpc call via api"){

      val myRpcHandler = new MyCustomRpcHandler

      val ctx = new RequestContext("", ClientSessionId("",""), null, null, "")

      val vsMsg = toVsMsg(RpcCall("RpcHandler", "doSomething", Array("test", 1234.34), Map()))

      val ret = myRpcHandler.processRpcCall(vsMsg, vsMsg.body.asInstanceOf[RpcCall])(ctx)

      ret.isEmpty should be (false)
      ret.get.body.asInstanceOf[RpcResponse].result should equal(true)

      println(ret)

      val vsMsg2 = toVsMsg(RpcCall("RpcHandler", "doSomething", Array(true), Map()))

      val ret2 = myRpcHandler.processRpcCall(vsMsg2, vsMsg2.body.asInstanceOf[RpcCall])(ctx)

      println(ret2)
      ret2.isEmpty should be (false)
      ret2.get.body.asInstanceOf[RpcResponse].result should equal(false)


      val vsMsg3 = toVsMsg(RpcCall("RpcHandler", "doSomethingElse", Array(), Map()))

      val ret3 = myRpcHandler.processRpcCall(vsMsg3, vsMsg3.body.asInstanceOf[RpcCall])(ctx)
      println(ret3)
      ret3.isEmpty should be (false)
      //ret3.get.body.asInstanceOf[RpcResponse].result should be(null)

      println(ret3)

      val vsMsg4 = toVsMsg(RpcCall("RpcHandler", "onClick", Array(Map[String, Any]("field" -> "value", "field2" -> 123)), Map()))

      val ret4 = myRpcHandler.processRpcCall(vsMsg4, vsMsg4.body.asInstanceOf[RpcCall])(ctx)

      println(ret4)
      println(ret4)
      ret4.isEmpty should be (false)
      ret4.get.body.asInstanceOf[RpcResponse].result should be("got map Map(field -> value, field2 -> 123)")

      val vsMsg5 = toVsMsg(RpcCall("RpcHandler", "onClickArray", Array(Array("Foo", "Bar", "Ping")), Map()))

      val ret5 = myRpcHandler.processRpcCall(vsMsg5, vsMsg5.body.asInstanceOf[RpcCall])(ctx)

      println(ret5)
      println(ret5)
      ret5.isEmpty should be (false)
      //ret5.get.body.asInstanceOf[RpcResponse].result should be("got map Map(field -> value, field2 -> 123)")


//      val vsMsg5 = toVsMsg(RpcCall("customObject", Array(LoginSuccess("foo")), Map()))
//
//      val ret5 = myRpcHandler.processRpcCall(vsMsg5, vsMsg5.body.asInstanceOf[RpcCall])(ctx)
//
//      println(ret5)
//      println(ret5)
//      ret5.isEmpty should be (false)
//      ret5.get.body.asInstanceOf[RpcResponse].result should be("got map Map(field -> value, field2 -> 123)")

    }

  }

}
