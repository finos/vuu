/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 06/01/2016.

  */
package io.venuu.vuu.client.swing

import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.DefaultClock
import io.venuu.vuu.client.messages.ClientMessage
import io.venuu.vuu.client.swing.client.Worker
import io.venuu.vuu.client.swing.gui.VSMainFrame
import io.venuu.vuu.net.WebSocketViewServerClient
import io.venuu.vuu.net.json.JsonVsSerializer
import io.venuu.vuu.net.ws.WebSocketClient

import scala.swing._

/*
  Editable table http://www.codejava.net/java-se/swing/editable-jtable-example


 */
object SwingClientMain extends SimpleSwingApplication {

  implicit val eventBus = new EventBus[ClientMessage]()
  implicit val timeProvider = new DefaultClock
  implicit val lifecycle = new LifecycleContainer

  val client = new WebSocketClient("ws://localhost:8090/websocket", 8090)

  implicit val vsClient = new WebSocketViewServerClient(client, JsonVsSerializer)

  val worker = new Worker()

  lifecycle.start()

  override def top: Frame = new VSMainFrame("")
}





