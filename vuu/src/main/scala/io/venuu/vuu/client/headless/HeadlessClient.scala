/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.
  *
  * Created by chris on 21/09/2016.
  *
  */
package io.venuu.vuu.client.headless

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.lifecycle.{DefaultLifecycleEnabled, LifecycleContainer}
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.ClientHelperFns
import io.venuu.vuu.net._
import io.venuu.vuu.viewport.ViewPortRange

import java.lang.reflect.{InvocationHandler, Method}
import java.util.concurrent.CopyOnWriteArrayList
import scala.reflect.ClassTag

object TestContext extends RequestContext("TEST", ClientSessionId("TEST", "CLIENT-TEST"), null, null, "TTESTTESTETSTE")

case class HeadlessContext(token: String = "", user: String = "", sessionId: String = "")

case class HeadlessClient(vsClient: ViewServerClient,
                          private val ctx: HeadlessContext = new HeadlessContext(),
                          private val sinkData: ViewPortSinks = new ViewPortSinks)(implicit lifecycleContainer: LifecycleContainer, time: Clock) extends DefaultLifecycleEnabled with StrictLogging {

  import io.venuu.vuu.client.ClientHelperFns._

  lifecycleContainer(this).dependsOn(vsClient)

  implicit val client: ViewServerClient = vsClient

  override def doStart(): Unit = super.doStart()

  override def doStop(): Unit = super.doStop()

  def authenticate(user: String, password: String): HeadlessClient = {
    authAsync(user, password)
    awaitMsgBody[AuthenticateSuccess] match {
      case Some(success) =>
        this.copy(client, ctx = this.ctx.copy(token = success.token, user = user))
      case None =>
        this
    }

  }

  protected def awaitMsg = {
    vsClient.awaitMsg
  }

  import scala.reflect.runtime.universe.{TypeTag, typeTag}

  def await[TYPE: TypeTag](implicit client: ViewServerClient): ViewServerMessage = {

    val msg = awaitMsg

    val clazz = typeTag[TYPE].mirror.runtimeClass( typeTag[TYPE].tpe )

    val body = msg.body

    val classOfBody = body.getClass

    processControlMessages(msg)

    if(clazz == classOfBody)
      msg
    else{

      processUnsolicited(msg)

      await[TYPE]
    }
  }

  def awaitOr[TYPE: TypeTag, TYPE2: TypeTag](implicit client: ViewServerClient): ViewServerMessage = {

    val msg = awaitMsg

    val clazz = typeTag[TYPE].mirror.runtimeClass( typeTag[TYPE].tpe )
    val clazz2 = typeTag[TYPE2].mirror.runtimeClass( typeTag[TYPE2].tpe )

    processControlMessages(msg)

    val body = msg.body

    val classOfBody = body.getClass

    if(clazz == classOfBody || clazz2 == classOfBody)
      msg
    else{

      processUnsolicited(msg)

      awaitOr[TYPE, TYPE2]
    }

  }

  def await(count: Int) = {

    (1 to count).map( i => {

      val msg = awaitMsg

      processControlMessages(msg)

      processUnsolicited(msg)

    })

  }

  private def processControlMessages(msg: ViewServerMessage) = {

    msg.body match {
      case body: CreateViewPortSuccess => processCreateViewPortSuccess(body)
      case body: ChangeViewPortSuccess =>
      case body: ChangeViewPortRangeSuccess => processChangeViewPortRangeSuccess(body)
      case _ =>
    }

  }

  private def processChangeViewPortRangeSuccess(body: ChangeViewPortRangeSuccess) = {

    logger.info(s"ChangeViewPortRangeSuccess ${body.viewPortId}, ${body.from} ${body.to}")

    //val length = body.columns.length

    //val seedData = Array.fill[Array[Any]](2000)(Array.fill[Any](length)(null))

    sinkData.getSinkData(body.viewPortId).range = ViewPortRange(body.from, body.to)

    //sinkData.add(body.viewPortId, new ViewPortSink(body.viewPortId, body.table, body.columns, body.range, 1, -1, new SinkData(new CopyOnWriteArrayList[Array[Any]](seedData))))
  }


  private def processCreateViewPortSuccess(body: CreateViewPortSuccess) = {

    logger.info(s"CreateViewPortSuccess ${body.viewPortId}, ${body.columns.map(_.toString).mkString(",")}, ${body.range.from}, ${body.range.to}, 1, -1")

    val length = body.columns.length

    val seedData = Array.fill[Array[Any]](2000)(Array.fill[Any](length)(null))

    sinkData.add(body.viewPortId, new ViewPortSink(body.viewPortId, body.table, body.columns, body.range, 1, -1, new SinkData(new CopyOnWriteArrayList[Array[Any]](seedData))))
  }


  private def processRowUpdate(ru: RowUpdate) = {
    sinkData.getSinkData(ru.viewPortId) match {
      case null => logger.error("evil has happenned there is no sink for the update")
      case sink: ViewPortSink =>
        sink.size = ru.vpSize
        sink.data.updateRow(ru.rowIndex, ru.data)
        logger.info(s"UPDATE: ${sink.table} ${sink.vpId} [${ru.data.map(_.toString).mkString(",")}]")
    }
  }

  private def processRowSizeUpdate(ru: RowUpdate) = {
    sinkData.getSinkData(ru.viewPortId) match {
      case null => logger.error("evil has happenned there is no sink for the update")
      case sink: ViewPortSink =>
        sink.size = ru.vpSize
        logger.info(s"SIZE: ${sink.table} ${sink.vpId} ${sink.size}")
        //sink.data.updateRow(ru.rowIndex, ru.data)
    }
  }

  private def processUnsolicited(msg: ViewServerMessage) = {

    msg.body match {

      case body: HeartBeat =>
        logger.info("HB")
        heartbeatRespAsync(ctx.sessionId, ctx.token, ctx.user, body.ts)

      case body: TableRowUpdates =>

        //if(logReq.shouldLog())
        logger.info(s"Got updates ${body.rows.length} for ${body.rows(0).viewPortId} rowSize = ${body.rows(0).vpSize}")

        //logger.info("Got table row updates: " + body.rows.size)
        body.rows.foreach(ru => {

          if(ru.updateType == UpdateType.SizeOnly)
            processRowSizeUpdate(ru)
          else
            processRowUpdate(ru)

        })
      case body =>
        logger.info(s"Got unknown msg ${body}")
    }
  }


  def login(): HeadlessClient = {
    this.copy(client, ctx = this.ctx.copy(sessionId = ClientHelperFns.login(ctx.token, ctx.user)))
  }

  def createRpcService[INTERFACE](module: String)(implicit t: ClassTag[INTERFACE]): INTERFACE = {

    val clazz = t.runtimeClass.asInstanceOf[Class[INTERFACE]]

    assert(clazz.isInterface, "interfaceClass should be an interface class")

    val context = this.ctx

    java.lang.reflect.Proxy.newProxyInstance(clazz.getClassLoader, Array(clazz), new InvocationHandler() {
      def invoke(proxy:Object, method:Method, args:scala.Array[Object]) = {

        println("calling: " + method.getName + " on " + proxy.getClass.getSimpleName + "() args:" + args.map(_.toString).mkString(",") )

        val args2scala = args.dropRight(1).map(_.asInstanceOf[Any])

        val response = rpcCall(context.sessionId, context.token, context.user, proxy.getClass.getSimpleName, method.getName, args2scala, module)

        //val rClazz = method.getReturnType

        response.result.asInstanceOf[AnyRef]
      }

    }).asInstanceOf[INTERFACE]
  }


  def createViewPort(table: String): CreateViewPortRequestBlock = CreateViewPortRequestBlock(ctx, table, this)(client, time)

  def changeViewPort(viewportId: String): ChangeViewPortRequestBlock = ChangeViewPortRequestBlock(ctx, vpId = viewportId, this)

  def changeViewPortRange(viewportId: String): ChangeViewPortRangeRequestBlock = ChangeViewPortRangeRequestBlock(ctx, viewportId, this)

//  def createViewPort(table: String, columns: Array[String], range: ViewPortRange = DefaultRange, sort: SortSpec = SortSpec(List())): Option[CreateViewPortSuccess] = {
//    val result = createVp(ctx.sessionId, token, user, table, columns, range)
//
//    result.body match {
//      case success: CreateViewPortSuccess =>
//        logger.info("success")
//        Some(success)
//      case failure: CreateViewPortReject =>
//        logger.info("failure")
//        None
//    }
//  }

//  def awaitTillSinkReaches(count: Int) = ???
//
//  def awaitSink(vpId: String)(expectation:Any) = {
//
//  }
//
//  def printSink(vpId: String) = {
//
//  }
}
