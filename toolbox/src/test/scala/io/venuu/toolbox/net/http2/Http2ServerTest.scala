/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 19/06/2020.
 *
 */
package io.venuu.toolbox.net.http2

import io.venuu.toolbox.lifecycle.LifecycleContainer
import org.scalatest.{FeatureSpec, Matchers}

class HttpServerTest extends FeatureSpec with Matchers {

  feature("check we can start the http2 server") {

    scenario("start http2 server") {

      implicit val lifecycle = new LifecycleContainer

      val httpServer = new Http2Server(8080, 8443, Array(
        ("src/test/resources/www/murmur/deploy",  "/app/murmur/deploy"   ),
        ("src/test/resources/www/vuu/deploy",         "/app/vuu/deploy"   )
      ))

      lifecycle.start()
      httpServer.join()
    }

  }
}
