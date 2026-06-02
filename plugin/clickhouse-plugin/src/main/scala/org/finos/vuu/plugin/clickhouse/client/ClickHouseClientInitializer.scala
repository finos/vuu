package org.finos.vuu.plugin.clickhouse.client

import com.clickhouse.client.api.Client
import org.finos.vuu.plugin.clickhouse.client.options.ClickHouseClientOptions

class ClickHouseClientInitializer(val options: ClickHouseClientOptions) {

  def create(): Client = {
    
    val builder = new Client.Builder()
      .addEndpoint(options.endpoint)
      .setUsername(options.username)
      .setPassword(options.password)
      .setConnectTimeout(options.timeoutMs)
      
    builder.build()
  }
}

object ClickHouseClientInitializer {
  def apply(options: ClickHouseClientOptions): ClickHouseClientInitializer = new ClickHouseClientInitializer(options)
}