/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 06/01/2016.

  */
package io.venuu.vuu.client.swing

import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.DefaultTimeProvider
import io.venuu.vuu.client.swing.client.Worker
import io.venuu.vuu.client.swing.gui.VSMainFrame
import io.venuu.vuu.client.swing.messages.ClientMessage
import io.venuu.vuu.net.ws.WebSocketClient
import io.venuu.vuu.net.{JsonVsSerializer, WebSocketViewServerClient}

import scala.swing._

/*
  Editable table http://www.codejava.net/java-se/swing/editable-jtable-example


 */
object SwingClientMain extends SimpleSwingApplication {

  implicit val eventBus = new EventBus[ClientMessage]()
  implicit val timeProvider = new DefaultTimeProvider
  implicit val lifecycle = new LifecycleContainer

  val client = new WebSocketClient("ws://localhost:8090/websocket", 8090)

  implicit val vsClient = new WebSocketViewServerClient(client, JsonVsSerializer)

  val worker = new Worker()

  val columns = Array("ric", "description", "currency", "exchange", "bid", "ask", "scenario")

  lifecycle.start()

  override def top: Frame = new VSMainFrame(columns)
}





