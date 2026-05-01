package org.finos.vuu.example.valkey.client.options

trait ValkeyClientOptions {

  def nodes: Set[(String, Int)]
  def timeoutMs: Int
  def maxAttempts: Int
  def maxTotal: Int
  def maxIdle: Int
  def minIdle: Int
  def withNode(host: String, port: Int): ValkeyClientOptions
  def withNodes(nodes: Set[(String, Int)]): ValkeyClientOptions
  def withTimeoutMs(timeoutMs: Int): ValkeyClientOptions
  def withMaxAttempts(maxAttempts: Int): ValkeyClientOptions
  def withMaxTotal(maxTotal: Int): ValkeyClientOptions
  def withMaxIdle(maxIdle: Int): ValkeyClientOptions
  def withMinIdle(minIdle: Int): ValkeyClientOptions
}

object ValkeyClientOptions {

  def apply(): ValkeyClientOptions = {
    ValkeyClientOptionsImpl(
      nodes = Set.empty,
      timeoutMs = 2_000,
      maxAttempts = Int.MaxValue,
      maxTotal = 8,
      maxIdle = 8,
      minIdle = 4
    )
  }

}

private case class ValkeyClientOptionsImpl(nodes: Set[(String, Int)],
                                           timeoutMs: Int,
                                           maxAttempts: Int,
                                           maxTotal: Int,
                                           maxIdle: Int,
                                           minIdle: Int) extends ValkeyClientOptions {

  override def withNode(host: String, port: Int): ValkeyClientOptions = this.copy(nodes = Set((host, port)))

  override def withNodes(nodes: Set[(String, Int)]): ValkeyClientOptions = this.copy(nodes = nodes)

  override def withTimeoutMs(timeoutMs: Int): ValkeyClientOptions = this.copy(timeoutMs = timeoutMs)

  override def withMaxAttempts(maxAttempts: Int): ValkeyClientOptions = this.copy(maxAttempts = maxAttempts)

  override def withMaxTotal(maxTotal: Int): ValkeyClientOptions = this.copy(maxTotal = maxTotal)

  override def withMaxIdle(maxIdle: Int): ValkeyClientOptions = this.copy(maxIdle = maxIdle)

  override def withMinIdle(minIdle: Int): ValkeyClientOptions = this.copy(minIdle = minIdle)
}