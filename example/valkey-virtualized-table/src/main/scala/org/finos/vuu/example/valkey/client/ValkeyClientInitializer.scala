package org.finos.vuu.example.valkey.client

import io.valkey.*
import org.finos.vuu.example.valkey.client.options.ValkeyClientOptions

class ValkeyClientInitializer(val options: ValkeyClientOptions) {

  def create() : UnifiedJedis = {
    options.nodes.size match {
      case 0 => throw new IllegalArgumentException("No nodes provided")
      case 1 => createConnectionPoolClient()
      case _ => createClusterClient()
    }
  }

  private def createConnectionPoolClient(): JedisPooled = {
    val poolCfg = createConnectionPoolConfig()

    val (host, port) = options.nodes.head
    new JedisPooled(poolCfg, host, port, options.timeoutMs)
  }

  private def createClusterClient(): JedisCluster = {
    val poolCfg = createConnectionPoolConfig()

    val hosts = new java.util.HashSet[HostAndPort]()
    options.nodes.foreach { case (host, port) =>
      hosts.add(new HostAndPort(host, port))
    }

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
