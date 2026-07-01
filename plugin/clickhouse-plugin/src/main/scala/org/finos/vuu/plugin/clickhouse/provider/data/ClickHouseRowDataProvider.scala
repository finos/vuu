package org.finos.vuu.plugin.clickhouse.provider.data

import org.finos.vuu.core.table.{Column, RowWithData}
import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.virtualized.api.{VirtualizedSessionTableColumn, VirtualizedSessionTableDef}

import scala.collection.mutable.ArrayBuffer

trait ClickHouseRowDataProvider {

  def queryForRowData(table: VirtualizedSessionTableDef,
                      columns: List[VirtualizedSessionTableColumn],
                      whereClause: String, orderBy: String,
                      limit: Int, startIndex: Int) : IndexedSeq[RowWithData]

}

object ClickHouseRowDataProvider {

  def apply(client: ClickHouseClient) : ClickHouseRowDataProvider = {
    ClickHouseRowDataProviderImpl(client, ClickHouseRowDataMapper())
  }

}

private case class ClickHouseRowDataProviderImpl(client: ClickHouseClient,
                                                 rowDataMapper: ClickHouseRowDataMapper) extends ClickHouseRowDataProvider {

  override def queryForRowData(tableDef: VirtualizedSessionTableDef,
                               columns: List[VirtualizedSessionTableColumn],
                               whereClause: String, orderBy: String,
                               limit: Int, startIndex: Int): IndexedSeq[RowWithData] = {

    val remoteNames = columns.map(_.remoteName)
    val queryColumns = if (remoteNames.contains(tableDef.getRemoteKeyField)) remoteNames else remoteNames :+ tableDef.getRemoteKeyField
    
    val query =
      s"""
         |SELECT ${queryColumns.mkString(", ")}
         |FROM ${tableDef.getRemoteTableName}
         |$whereClause
         |$orderBy
         |LIMIT $limit
         |OFFSET $startIndex
         |""".stripMargin.trim

    client.executeQuery(query) { records =>
      val buf = new ArrayBuffer[RowWithData](records.getResultRows.toInt)
      val it = records.iterator()
      while (it.hasNext) {
        val record = it.next()
        buf += rowDataMapper.mapRowData(record, tableDef.getRemoteKeyField, columns)
      }
      buf.toIndexedSeq
    }
  }

}
