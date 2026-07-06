package org.finos.vuu.plugin.clickhouse.client.options

sealed trait ClickHouseClientAuthOptions

case class BasicAuthOptions(
                             username: String,
                             password: String
                           ) extends ClickHouseClientAuthOptions

case class MTLSOptions(
                        keyStorePath: String,
                        keyStorePassword: String,
                        trustStorePath: String,
                        trustStorePassword: String
                      ) extends ClickHouseClientAuthOptions