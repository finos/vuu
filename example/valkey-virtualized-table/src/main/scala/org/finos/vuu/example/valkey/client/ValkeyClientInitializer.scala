package org.finos.vuu.example.valkey.client

import io.lettuce.core.cluster.api.StatefulRedisClusterConnection
import io.lettuce.core.cluster.{ClusterClientOptions, ClusterTopologyRefreshOptions, RedisClusterClient}
import io.lettuce.core.internal.HostAndPort
import io.lettuce.core.protocol.ProtocolVersion
import io.lettuce.core.resource.{DefaultClientResources, MappingSocketAddressResolver}
import io.lettuce.core.{RedisURI, TimeoutOptions}
import org.finos.vuu.example.valkey.client.options.ValkeyClientOptions

import java.util.function.Function
import scala.jdk.CollectionConverters.*

class ValkeyClientInitializer(val options: ValkeyClientOptions) {

  def create(): (RedisClusterClient, StatefulRedisClusterConnection[String, String]) = {

    val mappingFn: Function[HostAndPort, HostAndPort] = {      
      hp => {
        options.hostAndPortMapper match {
          case Some(mapper) =>
            val (newHost, newPort) = mapper(hp.getHostText, hp.getPort)
            HostAndPort.of(newHost, newPort)
          case None =>
            hp
        }
      }
    }

    val resolver = MappingSocketAddressResolver.create(mappingFn)

    val clientResources = DefaultClientResources.builder()
      .socketAddressResolver(resolver)
      .build()

    val uris = options.nodes.map { case (host, port) =>
      RedisURI.Builder.redis(host, port)
        .withTimeout(options.timeout)
        .build()
    }.toList.asJava

    val topology = ClusterTopologyRefreshOptions.builder()
      .enablePeriodicRefresh(options.topologyRefreshPeriod)      
      .build()

    val clientOptions = ClusterClientOptions.builder()
      .topologyRefreshOptions(topology)
      .timeoutOptions(TimeoutOptions.enabled(options.timeout))
      .protocolVersion(ProtocolVersion.RESP3)
      .build()

    val client = RedisClusterClient.create(clientResources, uris)

    client.setOptions(clientOptions)

    val connection = client.connect()

    (client, connection)
  }
}

