package org.finos.vuu.plugin.clickhouse.provider.typeahead

import com.clickhouse.client.api.query.Records
import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.{ColumnValueProvider, DataType}
import org.finos.vuu.plugin.clickhouse.client.ClickHouseClient
import org.finos.vuu.plugin.clickhouse.provider.filter.ClickHouseFilterFactory
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef
import org.finos.vuu.viewport.ViewPort

import java.util.HashMap as JHashMap
import scala.collection.mutable.ArrayBuffer

class ClickHouseTypeAheadProvider(client: ClickHouseClient,
                                  tableDef: VirtualizedSessionTableDef,
                                  filterFactory: ClickHouseFilterFactory) extends ColumnValueProvider with StrictLogging {

  override def getUniqueValuesVPColumn(columnName: String, viewPort: ViewPort): Array[String] =
    withStringRemoteColumn(columnName) { remoteName =>
      fetchUniqueStringValues(remoteName, "", viewPort)
    }

  override def getUniqueValuesStartingWithVPColumn(columnName: String, starts: String, viewPort: ViewPort): Array[String] =
    withStringRemoteColumn(columnName) { remoteName =>
      fetchUniqueStringValues(remoteName, starts, viewPort)
    }

  private def withStringRemoteColumn(columnName: String)(f: String => Array[String]): Array[String] = {
    tableDef.getRemoteColumns.find(_.name == columnName) match {
      case Some(col) if col.dataType == DataType.StringDataType => f(col.remoteName)
      case Some(_) =>
        logger.warn(s"Column $columnName in table ${tableDef.name} is not of type String")
        Array.empty
      case None =>
        logger.warn(s"Column $columnName not found in table ${tableDef.name}")
        Array.empty
    }
  }

  private def fetchUniqueStringValues(remoteColumnName: String, starts: String, viewPort: ViewPort): Array[String] = {
    val (whereClause, params) = buildWhereClauseAndParams(remoteColumnName, starts, viewPort)
    val query =
      s"SELECT DISTINCT $remoteColumnName FROM ${tableDef.getRemoteTableName} $whereClause ORDER BY $remoteColumnName LIMIT 10"

    client.executeQuery(query, params) { records =>
     recordsToArray(records, remoteColumnName)
    }
  }

  private def buildWhereClauseAndParams(remoteColumnName: String, starts: String, viewPort: ViewPort): (String, java.util.Map[String, Object]) = {
    val (baseFilter, params) = filterFactory.build(null, tableDef.getRemotePermissionFilterSpecFunction.apply(viewPort))
    
    val filterClause =
      if (starts != null && !starts.isBlank) {
         params.put("p_starts", starts.toLowerCase)
         s"startsWith(lowerUTF8($remoteColumnName), {p_starts: String})"
      } else {
        ""
      }

    val whereClause = (baseFilter, filterClause) match {
      case ("", "")  => ""
      case (baseFilter, "")  => baseFilter
      case ("", filterClause)  => s"WHERE $filterClause"
      case (baseFilter, filterClause)  => s"$baseFilter AND ($filterClause)"
    }

    (whereClause, params)
  }

  private def recordsToArray(records: Records, column: String): Array[String] = {
    val buf = new ArrayBuffer[String](records.getResultRows.toInt)
    val it = records.iterator()
    while (it.hasNext) {
      val record = it.next()
      buf += record.getString(column)
    }
    buf.toArray
  }

}
