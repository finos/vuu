package org.finos.vuu.plugin.clickhouse.provider.data

import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef

class ClickHouseTableSizeProvider(client: ClickHouseClient, tableDef: VirtualizedSessionTableDef) {

  def getTableSize(whereClause: String): Int = {
    client.executeQuery(s"SELECT count() as cnt FROM ${tableDef.getRemoteTableName} $whereClause") {
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
