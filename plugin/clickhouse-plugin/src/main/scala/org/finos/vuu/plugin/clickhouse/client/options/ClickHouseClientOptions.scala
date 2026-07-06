package org.finos.vuu.plugin.clickhouse.client.options

trait ClickHouseClientOptions {
  def endpoint: String
  def database: String
  def auth: ClickHouseClientAuthOptions
  def timeoutMs: Int

  def withEndpoint(endpoint: String): ClickHouseClientOptions
  def withDatabase(database: String): ClickHouseClientOptions
  def withTimeoutMs(timeoutMs: Int): ClickHouseClientOptions
  
  def withAuth(auth: ClickHouseClientAuthOptions): ClickHouseClientOptions
  def withBasicAuth(username: String, password: String): ClickHouseClientOptions  
  def withMutualTLS(keyStorePath: String, keyStorePassword: String, trustStorePath: String, trustStorePassword: String): ClickHouseClientOptions  
}

object ClickHouseClientOptions {
  def apply(): ClickHouseClientOptions = {
    ClickHouseClientOptionsImpl(
      endpoint = "http://localhost:8123",
      database = "default",
      timeoutMs = 2_000,
      auth = BasicAuthOptions(username = "default", password = ""),      
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
  override def withTimeoutMs(timeoutMs: Int): ClickHouseClientOptions = this.copy(timeoutMs = timeoutMs)
  override def withAuth(auth: ClickHouseClientAuthOptions): ClickHouseClientOptions = this.copy(auth = auth)  
  override def withBasicAuth(username: String, password: String): ClickHouseClientOptions = this.copy(auth = BasicAuthOptions(username, password))
  override def withMutualTLS(keyStorePath: String,
                             keyStorePassword: String,
                             trustStorePath: String,
                             trustStorePassword: String): ClickHouseClientOptions = {
    this.copy(auth = MTLSOptions(keyStorePath, keyStorePassword, trustStorePath, trustStorePassword))
  }
    
}
