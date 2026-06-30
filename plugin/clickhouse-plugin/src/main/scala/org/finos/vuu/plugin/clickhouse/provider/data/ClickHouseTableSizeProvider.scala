package org.finos.vuu.plugin.clickhouse.provider.data

import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef

trait ClickHouseTableSizeProvider {

  def getTableSize(tableDef: VirtualizedSessionTableDef, query: String): Int

}

object ClickHouseTableSizeProvider {

  def apply(client: ClickHouseClient) =
    ClickHouseTableSizeProviderImpl(client)

}

private case class ClickHouseTableSizeProviderImpl(client: ClickHouseClient) extends ClickHouseTableSizeProvider {

  override def getTableSize(tableDef: VirtualizedSessionTableDef, whereClause: String): Int = {
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
