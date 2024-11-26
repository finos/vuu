/*package org.finos.vuu.example.valkey.populate

import glide.api.GlideClient
import glide.api.logging.Logger
import glide.api.models.configuration.GlideClientConfiguration
import glide.api.models.configuration.NodeAddress
import glide.api.models.exceptions.{ClosingException, ConnectionException, ExecAbortException, TimeoutException}

import java.util.concurrent.TimeUnit
import scala.concurrent.{Await, CancellationException, ExecutionContext, Future}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.Duration
import scala.jdk.CollectionConverters._
import scala.jdk.FutureConverters._
import scala.util.{Failure, Try}

object Populate {

  private def createClient(nodesList: List[(String, Int)] = List(("localhost", 6379))): Future[GlideClient] = {
    // Check `GlideClientConfiguration` for additional options.
    val config = GlideClientConfiguration.builder()
        .addresses(nodesList.map({case(host, port) => NodeAddress.builder().host(host).port(port).build()}).asJava)
      // Enable this field if the servers are configured with TLS.
      //.useTLS(true)
      //.build()
      // This cast is required in order to pass the config to createClient because the Scala type system
      // is unable to resolve the Lombok builder result type.
        .asInstanceOf[GlideClientConfiguration]

    GlideClient.createClient(config).asScala
  }

//  def main(args: Array[String]): Unit = {
//
//    val host = "localhost"
//    val port = 6379
//    val useSsl = false
//
//    val address: NodeAddress =  NodeAddress.builder().host(host).port(port).build()
//
//    val config = GlideClientConfiguration.builder()
//      .addresses(nodesList.map((host, port) => NodeAddress.builder().host(host).port(port).build()).asJava)
//      // Enable this field if the servers are configured with TLS.
//      //.useTLS(true)
//      .build()
//      // This cast is required in order to pass the config to createClient because the Scala type system
//      // is unable to resolve the Lombok builder result type.
//      .asInstanceOf[GlideClientConfiguration]
//
//    GlideClient.createClient(config).asScala
//
//    try {
//      val client = GlideClient.createClient(config).get
//      try {
//        System.out.println("PING: " + client.ping(gs("PING")).get)
//        System.out.println("PING(found you): " + client.ping(gs("found you")).get)
//        System.out.println("SET(apples, oranges): " + client.set(gs("apples"), gs("oranges")).get)
//        System.out.println("GET(apples): " + client.get(gs("apples")).get)
//      } catch {
//        case e: InterruptedException =>
//          System.out.println("Glide example failed with an exception: ")
//          e.printStackTrace
//      } finally if (client != null) client.close()
//    }
//
//  }



}
*/