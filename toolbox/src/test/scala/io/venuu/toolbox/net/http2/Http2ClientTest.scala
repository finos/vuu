/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 19/06/2020.
 *
 */
package io.venuu.toolbox.net.http2

import java.io.File
import java.nio.ByteBuffer

import org.eclipse.jetty.client.HttpClient
import org.eclipse.jetty.client.api.{Response, Result}
import org.eclipse.jetty.http.HttpMethod
import org.scalatest.{FeatureSpec, Matchers}

class Http2ClientTest extends FeatureSpec with Matchers {

  feature("check we can start the http2 server") {

    scenario("start http2 server") {

      //Http2ClientLib.httpGetToFile("https://www.google.com", new File("google.com.txt"))

      //https://localhost:8443/app/murmur/deploy/murmur-0.1.tar.gz
      //Http2ClientLib.httpGetToFile("https://localhost:8443/app/murmur/deploy/murmur-0.1.tar.gz", new File("murmur-0.1.tar.gz"))
      //Http2ClientLib.httpGetToFile("https://localhost:8443/app/murmur/deploy/ideaIC-2020.1.dmg", new File("ideaIC-2020.1.dmg"))

    }

  }
}
