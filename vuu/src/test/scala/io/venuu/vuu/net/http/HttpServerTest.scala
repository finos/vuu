package io.venuu.vuu.net.http

import io.venuu.toolbox.lifecycle.LifecycleContainer
import org.scalatest.{FeatureSpec, Matchers}

class HttpServerTest extends FeatureSpec with Matchers{

  feature("check we can start the http2 server"){

    ignore("start http2 server"){

      implicit val lifecycle = new LifecycleContainer

      val httpServer = new Http2Server(8080, 8443, "src/main/resources/www")

      httpServer.doInitialize()
      httpServer.doStart()

      httpServer.doStop()
      httpServer.doDestroy()

    }

  }

}
