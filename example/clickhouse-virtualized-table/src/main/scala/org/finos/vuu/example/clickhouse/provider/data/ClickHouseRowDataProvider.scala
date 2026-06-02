package org.finos.vuu.example.clickhouse.provider.data

import com.clickhouse.client.api.query.GenericRecord
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.{Column, DataTable, RowWithData}
import org.finos.vuu.example.clickhouse.client.ClickHouseClient

import scala.collection.mutable.ArrayBuffer

trait ClickHouseRowDataProvider {

  def queryForRowData(table: TableDef, columns: List[Column],
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

  override def queryForRowData(tableDef: TableDef, columns: List[Column],
                               whereClause: String, orderBy: String,
                               limit: Int, startIndex: Int): IndexedSeq[RowWithData] = {
    val query =
      s"""
         |SELECT ${columns.map(_.name).mkString(", ")}
         |FROM ${tableDef.name}
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
        buf += rowDataMapper.mapRowData(record, tableDef.keyField, columns)
      }
      buf.toIndexedSeq
    }
  }

}
