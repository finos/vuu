package org.finos.vuu.plugin.clickhouse.provider.data

import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient

import java.util

class ClickHouseTableSizeProvider(client: ClickHouseClient, remoteTableName: String) {

  private val defaultQuery = s"SELECT count() as cnt FROM $remoteTableName"

  def getTableSize(whereClause: String, params: util.Map[String, Object]): Int = {
    val query = if (whereClause == null || whereClause.isEmpty) defaultQuery
    else s"$defaultQuery $whereClause"

    client.executeQuery(query, params) {
      records =>
        val it = records.iterator()
        if (it.hasNext) {
          it.next().getLong("cnt").toInt
        } else {
          0
        }
    }
  }

}
