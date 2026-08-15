package org.finos.vuu.plugin.clickhouse.provider.data

import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.clickhouse.provider.filter.ClauseWithParams

import java.util

class ClickHouseTableSizeProvider(client: ClickHouseClient, remoteTableName: String) {

  private val defaultQuery = s"SELECT count() as cnt FROM $remoteTableName"

  def getTableSize(clauseWithParams: ClauseWithParams): Int =
    clauseWithParams.clause match {
      case null | "" => executeQuery(defaultQuery, Map.empty)
      case clause => executeQuery(s"$defaultQuery WHERE $clause", clauseWithParams.params)
    }

  private def executeQuery(query: String, params: Map[String, Any]): Int =
    client.executeQuery(query, params) { records =>
      val it = records.iterator()
      if (it.hasNext) it.next().getLong("cnt").toInt else 0
    }
}
