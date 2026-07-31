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
                      offset: Int,
                      limit: Int): IndexedSeq[RowWithData] = {

    val query = buildQuery(viewPortColumns, whereClause, orderBy, offset, limit)
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

  private def buildQuery(viewPortColumns: ViewPortColumns,
                         whereClause: String,
                         orderBy: String,
                         offset: Int,
                         limit: Int): String = {

    val sb = new java.lang.StringBuilder(256)

    //Select
    sb.append("SELECT ")

    //Columns
    val queryColumns = getQueryColumns(viewPortColumns)
    val colIt = queryColumns.iterator
    if (colIt.hasNext)
      sb.append(colIt.next())
    while (colIt.hasNext) {
      sb.append(", ").append(colIt.next())
    }

    //From
    sb.append(" FROM ").append(tableDef.getRemoteTableName)

    //Where
    if (whereClause != null && whereClause.nonEmpty) {
      sb.append(" ").append(whereClause)
    }

    //Order By
    if (orderBy != null && orderBy.nonEmpty) {
      sb.append(" ").append(orderBy)
    }

    //Limit
    sb.append(" LIMIT ").append(limit)

    //Offset
    sb.append(" OFFSET ").append(offset)

    sb.toString
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
