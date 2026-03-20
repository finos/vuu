package org.finos.vuu.net.http

import org.finos.toolbox.lifecycle.LifecycleEnabled

trait HttpServer extends LifecycleEnabled { }

object NoHttpServer extends HttpServer {

  override def doStart(): Unit = {
    //Nothing to do
  }

  override def doStop(): Unit = {
    //Nothing to do
  }

  override def doInitialize(): Unit = {
    //Nothing to do
  }

  override def doDestroy(): Unit = {
    //Nothing to do
  }

  override val lifecycleId: String = "NoHttpServer"

}