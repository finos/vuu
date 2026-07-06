package org.finos.vuu.plugin.clickhouse.client.options

trait ClickHouseClientOptions {
  def endpoint: String
  def database: String
  def auth: ClickHouseClientAuthOptions
  def timeoutMs: Int

  def withEndpoint(endpoint: String): ClickHouseClientOptions
  def withDatabase(database: String): ClickHouseClientOptions
  def withTimeoutMs(timeoutMs: Int): ClickHouseClientOptions
  
  def withAuth(authOptions: ClickHouseClientAuthOptions): ClickHouseClientOptions
  def withUsername(username: String): ClickHouseClientOptions
  def withPassword(password: String): ClickHouseClientOptions
  def withMutualTLS(keyStorePath: String, keyStorePassword: String, trustStorePath: String, trustStorePassword: String): ClickHouseClientOptions  
}

object ClickHouseClientOptions {
  def apply(): ClickHouseClientOptions = {
    ClickHouseClientOptionsImpl(
      endpoint = "http://localhost:8123",
      database = "default",
      auth = BasicAuthOptions(username = "default", password = ""),
      timeoutMs = 2_000
    )
  }
}

private case class ClickHouseClientOptionsImpl(
                                                endpoint: String,
                                                database: String,
                                                timeoutMs: Int,
                                                auth: ClickHouseClientAuthOptions
                                                ) extends ClickHouseClientOptions {

  override def withEndpoint(endpoint: String): ClickHouseClientOptions = this.copy(endpoint = endpoint)
  override def withDatabase(database: String): ClickHouseClientOptions = this.copy(database = database)
  override def withUsername(username: String): ClickHouseClientOptions = this.copy(username = username)
  override def withPassword(password: String): ClickHouseClientOptions = this.copy(password = password)
  override def withTimeoutMs(timeoutMs: Int): ClickHouseClientOptions = this.copy(timeoutMs = timeoutMs)
}
