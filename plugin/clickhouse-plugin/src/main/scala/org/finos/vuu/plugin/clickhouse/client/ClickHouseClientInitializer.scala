package org.finos.vuu.plugin.clickhouse.client

import com.clickhouse.client.api.Client
import org.finos.vuu.plugin.clickhouse.client.options.{BasicAuthOptions, ClickHouseClientOptions, MTLSOptions}

class ClickHouseClientInitializer(val options: ClickHouseClientOptions) {

  def create(): Client = {
    
    val builder = new Client.Builder()
      .addEndpoint(options.endpoint)
      .setConnectTimeout(options.timeoutMs)
      .setDefaultDatabase(options.database)
      .setUsername(options.username)

    val client = options.auth match {
      case BasicAuthOptions(password) =>
        builder
          .setPassword(password)
          .build()
      case MTLSOptions(clientCertificatePath, clientKeyPath, rootCertificatePath) =>
        builder
          .useSSLAuthentication(true)
          .setClientCertificate(clientCertificatePath)
          .setClientKey(clientKeyPath)
          .setRootCertificate(rootCertificatePath)
          .build()
    }

    client
  }
}

object ClickHouseClientInitializer {
  def apply(options: ClickHouseClientOptions): ClickHouseClientInitializer = new ClickHouseClientInitializer(options)
}