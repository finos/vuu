package org.finos.vuu.example.clickhouse.provider.data

import org.finos.vuu.example.clickhouse.client.ClickHouseClient

trait ClickHouseTableSizeProvider {

  def getTableSize(tableDef: String, query: String): Int

}

object ClickHouseTableSizeProvider {

  def apply(client: ClickHouseClient) =
    ClickHouseTableSizeProviderImpl(client)

}

private case class ClickHouseTableSizeProviderImpl(client: ClickHouseClient) extends ClickHouseTableSizeProvider {

  override def getTableSize(tableName: String, whereClause: String): Int = {
    client.executeQuery(s"SELECT count() as cnt FROM $tableName $whereClause") {
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
