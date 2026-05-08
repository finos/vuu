package org.finos.vuu.example.valkey.client.options

import io.lettuce.core.RedisURI
import io.lettuce.core.cluster.ClusterTopologyRefreshOptions

import java.time.Duration

trait ValkeyClientOptions {

  def nodes: Set[(String, Int)]
  def timeout: Duration
  def topologyRefreshPeriod: Duration
  def hostAndPortMapper: Option[(String, Int) => (String, Int)]

  def withNode(host: String, port: Int): ValkeyClientOptions
  def withNodes(nodes: Set[(String, Int)]): ValkeyClientOptions
  def withTimeout(timeout: Duration): ValkeyClientOptions
  def withTopologyRefreshPeriod(period: Duration): ValkeyClientOptions
  def withHostAndPortMapper(mapper: (String, Int) => (String, Int)): ValkeyClientOptions
}

object ValkeyClientOptions {

  def apply(): ValkeyClientOptions = {
    ValkeyClientOptionsImpl(
      nodes = Set.empty,
      timeout = RedisURI.DEFAULT_TIMEOUT_DURATION,
      topologyRefreshPeriod = ClusterTopologyRefreshOptions.DEFAULT_REFRESH_PERIOD_DURATION,
      None
    )
  }

}

private case class ValkeyClientOptionsImpl(nodes: Set[(String, Int)],
                                           timeout: Duration,
                                           topologyRefreshPeriod: Duration,
                                           hostAndPortMapper: Option[(String, Int) => (String, Int)]) extends ValkeyClientOptions {

  override def withNode(host: String, port: Int): ValkeyClientOptions = this.copy(nodes = Set((host, port)))

  override def withNodes(nodes: Set[(String, Int)]): ValkeyClientOptions = this.copy(nodes = nodes)

  override def withTimeout(timeout: Duration): ValkeyClientOptions = this.copy(timeout = timeout)

  override def withTopologyRefreshPeriod(topologyRefreshPeriod: Duration): ValkeyClientOptions = this.copy(topologyRefreshPeriod = topologyRefreshPeriod)

  override def withHostAndPortMapper(hostAndPortMapper: (String, Int) => (String, Int)): ValkeyClientOptions = this.copy(hostAndPortMapper = Option(hostAndPortMapper))
}