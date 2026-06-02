package org.finos.vuu.example.clickhouse.provider.data

import org.finos.vuu.api.TableDef
import org.finos.vuu.example.clickhouse.client.ClickHouseClient

trait ClickHouseTableSizeProvider {

  def getTableSize(tableDef: TableDef, query: String): Int

}

object ClickHouseTableSizeProvider {

  def apply(client: ClickHouseClient) =
    ClickHouseTableSizeProviderImpl(client)

}

private case class ClickHouseTableSizeProviderImpl(client: ClickHouseClient) extends ClickHouseTableSizeProvider {

  override def getTableSize(tableDef: TableDef, whereClause: String): Int = {
    client.executeQuery(s"SELECT count() as cnt FROM ${tableDef.name} $whereClause") {
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
