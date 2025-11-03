package org.finos.vuu.net.rpc

import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.table.TableContainer
import org.finos.vuu.net.*
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class RpcTest extends AnyFeatureSpec with Matchers {

  class CustomObject(val value: String) {}

  class MyCustomRpcHandler()(implicit val tableContainer: TableContainer) extends DefaultRpcHandler {
    registerRpc("doSomething", params => doSomething(params))
    registerRpc("doSomething2", params => doSomething2(params))
    registerRpc("doSomethingElse", params => doSomethingElse(params))
    registerRpc("onClick", params => onClick(params))
    registerRpc("onClickArray", params => onClickArray(params))
    registerRpc("customObject", params => customObject(params))

    def doSomething(params: RpcParams): RpcFunctionResult = {
      val param1: String = params.namedParams("param1").asInstanceOf[String]
      val param2: Double = params.namedParams("param2").asInstanceOf[Double]
      println("did it!")
      RpcFunctionSuccess(Some(true))
    }

    def doSomething2(params: RpcParams): RpcFunctionResult = {
      val param1: Boolean = params.namedParams("param1").asInstanceOf[Boolean]
      println("doing something false .")
      RpcFunctionSuccess(Some(false))
    }

    def doSomethingElse(params: RpcParams): RpcFunctionResult = {      
      RpcFunctionSuccess(None)
    }

    def onClick(params: RpcParams): RpcFunctionResult = {
      val map: Map[String, Any] = params.namedParams("map").asInstanceOf[Map[String, Any]]
      RpcFunctionSuccess(Some(s"got map $map"))
    }

    def onClickArray(params: RpcParams): RpcFunctionResult = {
      val array: Array[String] = params.namedParams("array").asInstanceOf[Array[String]]
      val arrayStr = array.mkString(", ")
      RpcFunctionSuccess(Some(s"got array $arrayStr"))
    }

    def customObject(params: RpcParams): RpcFunctionResult = {
      val custom: CustomObject = params.namedParams("custom").asInstanceOf[CustomObject]
      RpcFunctionSuccess(Some(s"got a custom object $custom"))
    }

  }

  Feature("check rpc method handling") {

    Scenario("check we can process an rpc call via api") {

      val myRpcHandler = new MyCustomRpcHandler()(null)
      val customObject = new CustomObject("test")

      val ctx = RequestContext("", VuuUser(""), ClientSessionId("", ""), null)

      val ret = myRpcHandler.processRpcRequest("doSomething", new RpcParams(Map("param1" -> "test", "param2" -> 1234.34), null, ctx))
      ret.isInstanceOf[RpcFunctionSuccess] shouldBe true
      ret.asInstanceOf[RpcFunctionSuccess].optionalResult.get shouldBe true

      val ret2 = myRpcHandler.processRpcRequest("doSomething2", new RpcParams(Map("param1" -> true), null, ctx))
      ret2.isInstanceOf[RpcFunctionSuccess] shouldBe true
      ret2.asInstanceOf[RpcFunctionSuccess].optionalResult.get shouldBe false

      val ret3 = myRpcHandler.processRpcRequest("doSomethingElse", new RpcParams(Map(), null, ctx))
      ret3.isInstanceOf[RpcFunctionSuccess] shouldBe true
      ret3.asInstanceOf[RpcFunctionSuccess].optionalResult.isEmpty shouldBe true

      val ret4 = myRpcHandler.processRpcRequest("onClick", new RpcParams(Map("map" -> Map[String, Any]("field" -> "value", "field2" -> 123)), null, ctx))
      ret4.isInstanceOf[RpcFunctionSuccess] shouldBe true
      ret4.asInstanceOf[RpcFunctionSuccess].optionalResult.get should be("got map Map(field -> value, field2 -> 123)")

      val ret5 = myRpcHandler.processRpcRequest("onClickArray", new RpcParams(Map("array" -> Array("Foo", "Bar", "Ping")), null, ctx))
      ret5.isInstanceOf[RpcFunctionSuccess] shouldBe true
      ret5.asInstanceOf[RpcFunctionSuccess].optionalResult.get should be("got array Foo, Bar, Ping")

      val ret6 = myRpcHandler.processRpcRequest("customObject", new RpcParams(Map("custom" -> customObject), null, ctx))
      ret6.isInstanceOf[RpcFunctionSuccess] shouldBe true
      ret6.asInstanceOf[RpcFunctionSuccess].optionalResult.get.asInstanceOf[String].startsWith("got a custom object org.finos.vuu.net.rpc.RpcTest$CustomObject") shouldBe true
    }
  }
}