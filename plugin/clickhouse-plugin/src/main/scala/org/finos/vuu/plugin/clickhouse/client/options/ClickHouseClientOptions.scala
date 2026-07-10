package org.finos.vuu.plugin.clickhouse.client.options

trait ClickHouseClientOptions {
  def endpoint: String
  def database: String
  def timeoutMs: Int
  def username: String
  def auth: ClickHouseClientAuthOptions

  def withEndpoint(endpoint: String): ClickHouseClientOptions
  def withDatabase(database: String): ClickHouseClientOptions
  def withTimeoutMs(timeoutMs: Int): ClickHouseClientOptions
  def withUsername(username: String): ClickHouseClientOptions
  def withAuth(auth: ClickHouseClientAuthOptions): ClickHouseClientOptions
  def withPassword(password: String): ClickHouseClientOptions
  def withMutualTLS(clientCertificatePath: String, clientKeyPath: String, rootCertificatePath: String): ClickHouseClientOptions
}

object ClickHouseClientOptions {
  def apply(): ClickHouseClientOptions = {
    ClickHouseClientOptionsImpl(
      endpoint = "http://localhost:8123",
      database = "default",
      timeoutMs = 2_000,
      username= "default",
      auth = BasicAuthOptions(""),
    )
  }
}

private case class ClickHouseClientOptionsImpl(
                                                endpoint: String,
                                                database: String,
                                                timeoutMs: Int,
                                                username: String,
                                                auth: ClickHouseClientAuthOptions
                                                ) extends ClickHouseClientOptions {

  override def withEndpoint(endpoint: String): ClickHouseClientOptions = this.copy(endpoint = endpoint)
  override def withDatabase(database: String): ClickHouseClientOptions = this.copy(database = database)
  override def withTimeoutMs(timeoutMs: Int): ClickHouseClientOptions = this.copy(timeoutMs = timeoutMs)
  override def withUsername(username: String): ClickHouseClientOptions = this.copy(username = username)
  override def withAuth(auth: ClickHouseClientAuthOptions): ClickHouseClientOptions = this.copy(auth = auth)
  override def withPassword(password: String): ClickHouseClientOptions =
    this.withAuth(BasicAuthOptions(password))
  override def withMutualTLS(clientCertificatePath: String, clientKeyPath: String, rootCertificatePath: String): ClickHouseClientOptions =
    this.withAuth(MTLSOptions(clientCertificatePath, clientKeyPath, rootCertificatePath))
}
