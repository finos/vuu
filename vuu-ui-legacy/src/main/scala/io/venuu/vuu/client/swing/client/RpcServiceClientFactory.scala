package io.venuu.vuu.client.swing.client

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.thread.Async
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.swing.EventBus
import io.venuu.vuu.client.swing.messages.{ClientMessage, ClientRpcCall, ClientRpcResponse, RequestId}

import java.lang.reflect.{InvocationHandler, Method}
import scala.reflect.ClassTag
import scala.util.{Failure, Success, Try}

object RpcServiceClientFactory extends StrictLogging {

  def createRpcService[INTERFACE](module: String)(implicit t: ClassTag[INTERFACE], eventBus: EventBus[ClientMessage], clock: Clock): INTERFACE = {

    val clazz = t.runtimeClass.asInstanceOf[Class[INTERFACE]]

    @volatile var response: ClientRpcResponse = null;

    assert(clazz.isInterface, "interfaceClass should be an interface class")

    eventBus.register({
      case msg: ClientRpcResponse =>
        logger.info("Client RPC Response: " + msg)
        response = msg
      case msg =>
        //do nothing for everything else
    })

    java.lang.reflect.Proxy.newProxyInstance(clazz.getClassLoader, Array(clazz), new InvocationHandler() {
      def invoke(proxy:Object, method:Method, args:scala.Array[Object]) = {

        val args2scala = args.dropRight(1).map(_.asInstanceOf[Any])

        logger.debug(s"[RPC] call (${clazz.getSimpleName}.${method.getName}(${args2scala.mkString(",")}")

        val requestId = RequestId.oneNew();

        eventBus.publish(ClientRpcCall(requestId,  clazz.getSimpleName, method.getName, args2scala, Map(), module))

        Try(Async.waitTill(() => response != null, 5, 1000)) match {
          case Success(result) =>
            logger.info("Success RPC" + result)
          case Failure(exception) =>
            logger.error("Failure RPC", exception)
            throw new Exception("Timeout while waiting for response of Rpc call")
        }

        logger.debug("[RPC] response:" + response)

        response.result.asInstanceOf[AnyRef]
      }

    }).asInstanceOf[INTERFACE]
  }

}
