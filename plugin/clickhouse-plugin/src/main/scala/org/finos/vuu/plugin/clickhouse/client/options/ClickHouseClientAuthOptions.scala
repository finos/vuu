package org.finos.vuu.plugin.clickhouse.client.options

sealed trait ClickHouseClientAuthOptions

case class BasicAuthOptions(password: String) extends ClickHouseClientAuthOptions

case class MTLSOptions(clientCertificatePath: String, clientKeyPath: String, rootCertificatePath: String) extends ClickHouseClientAuthOptions