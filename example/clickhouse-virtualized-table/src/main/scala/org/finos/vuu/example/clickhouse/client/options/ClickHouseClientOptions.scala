package org.finos.vuu.example.clickhouse.client.options

trait ClickHouseClientOptions {
  def host: String
  def port: Int
  def database: String
  def username: String
  def password: String
  def timeoutMs: Int

  def withHost(host: String): ClickHouseClientOptions
  def withPort(port: Int): ClickHouseClientOptions
  def withDatabase(database: String): ClickHouseClientOptions
  def withUsername(username: String): ClickHouseClientOptions
  def withPassword(password: String): ClickHouseClientOptions
  def withTimeoutMs(timeoutMs: Int): ClickHouseClientOptions
}

object ClickHouseClientOptions {
  def apply(): ClickHouseClientOptions = {
    ClickHouseClientOptionsImpl(
      host = "localhost",
      port = 8123,
      database = "default",
      username = "default",
      password = "",
      timeoutMs = 2_000
    )
  }
}

private case class ClickHouseClientOptionsImpl(
  host: String,
  port: Int,
  database: String,
  username: String,
  password: String,
  timeoutMs: Int
) extends ClickHouseClientOptions {

  override def withHost(host: String): ClickHouseClientOptions = this.copy(host = host)
  override def withPort(port: Int): ClickHouseClientOptions = this.copy(port = port)
  override def withDatabase(database: String): ClickHouseClientOptions = this.copy(database = database)
  override def withUsername(username: String): ClickHouseClientOptions = this.copy(username = username)
  override def withPassword(password: String): ClickHouseClientOptions = this.copy(password = password)
  override def withTimeoutMs(timeoutMs: Int): ClickHouseClientOptions = this.copy(timeoutMs = timeoutMs)
}
