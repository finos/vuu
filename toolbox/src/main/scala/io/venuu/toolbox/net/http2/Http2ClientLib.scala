/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 19/06/2020.
 *
 */
package io.venuu.toolbox.net.http2

import org.eclipse.jetty.client.HttpClient
import org.eclipse.jetty.client.api.{Response, Result}
import org.eclipse.jetty.http.HttpMethod

import java.io.{File, FileOutputStream}
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean

object Http2ClientLib {

  def httpGetToFile(uri: String, file: File) : Boolean = {

    import org.eclipse.jetty.util.ssl.SslContextFactory
    val sslContextFactory = new SslContextFactory.Client
    sslContextFactory.setTrustAll(true)
    // Instantiate HttpClient with the SslContextFactory
    val httpClient = new HttpClient(sslContextFactory)
    // Configure HttpClient, for example:
    httpClient.setFollowRedirects(false)
    // Start HttpClient
    httpClient.start()

    val append = true

    val done = new AtomicBoolean()

    val wChannel = new FileOutputStream(file, append).getChannel

    httpClient.newRequest(uri)
      .method(HttpMethod.GET)
      //.content(file)
      .onResponseContent(new Response.ContentListener{
        override def onContent(response: Response, content: ByteBuffer): Unit = {
          wChannel.write(content)
        }
      }).send(new Response.CompleteListener()
    {
      @Override
      def onComplete(result: Result)
      {
        // Your logic here
        wChannel.close()
        done.set(true)
      }
    })

    while(!done.get()){
      Thread.sleep(10)
    }

    true
  }
}
