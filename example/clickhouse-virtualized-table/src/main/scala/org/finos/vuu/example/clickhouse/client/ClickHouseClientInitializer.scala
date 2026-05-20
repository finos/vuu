package org.finos.vuu.example.clickhouse.client

import com.clickhouse.jdbc.ClickHouseDataSource
import org.finos.vuu.example.clickhouse.client.options.ClickHouseClientOptions
import java.util.Properties

class ClickHouseClientInitializer(val options: ClickHouseClientOptions) {

  def create(): ClickHouseDataSource = {
    val properties = new Properties()
    properties.setProperty("user", options.username)
    properties.setProperty("password", options.password)
    properties.setProperty("connection_timeout", options.timeoutMs.toString)
    properties.setProperty("compress", "0")
    
    val url = s"jdbc:ch://${options.host}:${options.port}/${options.database}"
    new ClickHouseDataSource(url, properties)
  }
}

object ClickHouseClientInitializer {
  def apply(options: ClickHouseClientOptions): ClickHouseClientInitializer = new ClickHouseClientInitializer(options)
}
