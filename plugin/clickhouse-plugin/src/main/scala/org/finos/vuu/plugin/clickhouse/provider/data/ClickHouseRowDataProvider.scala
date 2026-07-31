package org.finos.vuu.plugin.clickhouse.provider.data

import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.virtualized.api.{VirtualizedSessionTableColumn, VirtualizedSessionTableDef}
import org.finos.vuu.viewport.ViewPortColumns

import scala.collection.mutable.ArrayBuffer

class ClickHouseRowDataProvider(client: ClickHouseClient,
                                tableDef: VirtualizedSessionTableDef) {

  private val rowDataMapper = ClickHouseRowDataMapper(tableDef)
  
  def queryForRowData(viewPortColumns: ViewPortColumns,
                      whereClause: String,
                      orderBy: String,
                      limit: Int,
                      startIndex: Int): IndexedSeq[RowWithData] = {

    val queryColumns = getQueryColumns(viewPortColumns)

    val query =
      s"""SELECT ${queryColumns.mkString(", ")}
         |FROM ${tableDef.getRemoteTableName}
         |$whereClause
         |$orderBy
         |LIMIT $limit
         |OFFSET $startIndex""".stripMargin

    val remoteKeyField = tableDef.getRemoteKeyField
    val remoteColumns = tableDef.getRemoteColumns

    client.executeQuery(query) { records =>
      val buf = new ArrayBuffer[RowWithData](records.getResultRows.toInt)
      val it = records.iterator()
      while (it.hasNext) {
        val record = it.next()
        buf += rowDataMapper.mapRowData(record)
      }
      buf.toIndexedSeq
    }

  }

  private def getQueryColumns(viewPortColumns: ViewPortColumns): Seq[String] = {

    val remoteNames = viewPortColumns.getColumns.collect {
      case v: VirtualizedSessionTableColumn => v.remoteName
    }

    val keyField = tableDef.getRemoteKeyField

    if (remoteNames.contains(keyField)) remoteNames
    else keyField :: remoteNames
  }

}
