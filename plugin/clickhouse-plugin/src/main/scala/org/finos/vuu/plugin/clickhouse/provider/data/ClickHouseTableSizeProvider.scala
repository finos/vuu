package org.finos.vuu.plugin.clickhouse.provider.data

import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient

class ClickHouseTableSizeProvider(client: ClickHouseClient, remoteTableName: String) {

  def getTableSize(whereClause: String): Int = {
    client.executeQuery(s"SELECT count() as cnt FROM $remoteTableName $whereClause") {
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
