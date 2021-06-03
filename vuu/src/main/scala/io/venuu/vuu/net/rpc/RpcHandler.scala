/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 15/02/2016.

  */
package io.venuu.vuu.net.rpc

import io.venuu.vuu.net._
import io.venuu.vuu.viewport.{EmptyViewPortMenu, ViewPortMenu}

import java.lang.reflect.Method

trait RpcHandler {

  def menuItems(): ViewPortMenu = EmptyViewPortMenu

  def implementsService(serviceIf:String):Boolean = {
    this.getClass.getInterfaces.exists(_.getSimpleName == serviceIf)
  }

  val methodsAndParams = this.getClass.getMethods.map(method => (method.getName, method.getGenericParameterTypes, method) ).groupBy(_._1).toMap

  def processRpcCall(msg: ViewServerMessage, rpc: RpcCall)(ctx: RequestContext): Option[ViewServerMessage] = {

    if(!methodsAndParams.contains(rpc.method)){
      onError(s"error could not find method ${rpc.method}", 1)
    }else{

      val overloadedMethods = methodsAndParams.get(rpc.method).get

      val method = findBestMatchingMethod(rpc, overloadedMethods)

      val r = if(rpc.params.size == 0)
        method.get.invoke(this, ctx)
      else if(rpc.params.size == 1)
        method.get.invoke(this, toO(rpc.params(0)), ctx)
      else if(rpc.params.size == 2)
        method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), ctx)
      else if(rpc.params.size == 3)
        method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), ctx)
      else if(rpc.params.size == 4)
        method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), toO(rpc.params(3)), ctx)
      else if(rpc.params.size == 5)
        method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), toO(rpc.params(3)), toO(rpc.params(4)), ctx)
      else if(rpc.params.size == 6)
        method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), toO(rpc.params(3)), toO(rpc.params(4)), toO(rpc.params(5)), ctx)
      else if(rpc.params.size == 7)
        method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), toO(rpc.params(3)), toO(rpc.params(4)), toO(rpc.params(5)), toO(rpc.params(6)), ctx)
      else if(rpc.params.size == 8)
        method.get.invoke(this, toO(rpc.params(0)), toO(rpc.params(1)), toO(rpc.params(2)), toO(rpc.params(3)), toO(rpc.params(4)), toO(rpc.params(5)), toO(rpc.params(6)), toO(rpc.params(7)), ctx)

      Some(VsMsg(ctx.requestId, ctx.session.sessionId, ctx.token, ctx.session.user, RpcResponse(rpc.method, r, null), module = msg.module))

    }
  }

  def toO(x: Any): AnyRef = x.asInstanceOf[AnyRef]

  def findBestMatchingMethod(rpc: RpcCall, methods: Array[(String, Array[java.lang.reflect.Type], Method)]): Option[Method] = {

    val size = rpc.params.size + 1

    val filteredBySize = methods.filter(_._2.size == size)

    filteredBySize.find(m => paramsEqualsRpcParams(m._3, rpc)) match {
      case Some(tuple) => Some(tuple._3)
      case None => None
    }
  }

  def paramsEqualsRpcParams(method: Method, rpcCall: RpcCall): Boolean = {

    val assignable = rpcCall.params.zip(method.getGenericParameterTypes).map({ case(value, classParam) =>
        classParam.getClass.isAssignableFrom(value.getClass)
    })

    assignable.size == rpcCall.params.size
  }

  def onError(message: String, code: Int): Option[ViewServerMessage] = {
    None
  }

}
