package org.finos.vuu.example.valkey.client

import com.typesafe.scalalogging.StrictLogging
import io.lettuce.core.cluster.RedisClusterClient
import io.lettuce.core.cluster.api.StatefulRedisClusterConnection
import org.finos.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import org.finos.vuu.example.valkey.client.options.ValkeyClientOptions

class ValkeyClient(val options: ValkeyClientOptions)
                  (implicit lifecycle: LifecycleContainer)
  extends LifecycleEnabled with StrictLogging {

  @volatile private var client: Option[RedisClusterClient] = None
  @volatile private var connection: Option[StatefulRedisClusterConnection[String, String]] = None

  lifecycle(this)

  def getConnection: Option[StatefulRedisClusterConnection[String, String]] =
    connection

  override def doStart(): Unit = synchronized {
    try {
      val initializer = new ValkeyClientInitializer(options)
      val (clusterClient, conn) = initializer.create()
      client = Some(clusterClient)
      connection = Some(conn)
    } catch {
      case e: Exception =>
        logger.error("Failed to start Valkey client", e)
        throw e
    }
  }

  override def doStop(): Unit = synchronized {
    try {
      connection.foreach(_.close())
      connection = None
      client.foreach(_.shutdown())
      client = None
    } catch {
      case e: Exception =>
        logger.error("Failed to stop Valkey client", e)
        throw e
    }
  }

  override def doInitialize(): Unit = {
    //Nothing to do
  }

  override def doDestroy(): Unit = {
    //Nothing to do
  }

  override val lifecycleId: String = "ValkeyClient"
}

