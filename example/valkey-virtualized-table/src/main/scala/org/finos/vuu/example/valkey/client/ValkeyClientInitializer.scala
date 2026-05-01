package org.finos.vuu.example.valkey.client

import io.valkey.{ConnectionPoolConfig, HostAndPort, JedisCluster, JedisPooled, Protocol, UnifiedJedis}
import org.finos.vuu.example.valkey.client.options.ValkeyClientOptions

import scala.jdk.CollectionConverters.*

class ValkeyClientInitializer(val options: ValkeyClientOptions) {

  def create(): UnifiedJedis = {
    options.nodes.toList match {
      case Nil =>
        createConnectionPoolClient(Protocol.DEFAULT_HOST, Protocol.DEFAULT_PORT)
      case (host, port) :: Nil =>
        createConnectionPoolClient(host, port)
      case _ =>
        createClusterClient()
    }
  }

  private def createConnectionPoolClient(host: String, port: Int): JedisPooled = {
    val poolCfg = createConnectionPoolConfig()
    new JedisPooled(poolCfg, host, port, options.timeoutMs)
  }

  private def createClusterClient(): JedisCluster = {
    val poolCfg = createConnectionPoolConfig()
    val hosts = options.nodes
      .map { case (host, port) => new HostAndPort(host, port) }
      .asJava

    new JedisCluster(hosts, options.timeoutMs, options.maxAttempts, poolCfg)
  }

  private def createConnectionPoolConfig(): ConnectionPoolConfig = {
    val poolCfg = new ConnectionPoolConfig()
    poolCfg.setMaxTotal(options.maxTotal)
    poolCfg.setMaxIdle(options.maxIdle)
    poolCfg.setMinIdle(options.minIdle)
    poolCfg
  }

}
