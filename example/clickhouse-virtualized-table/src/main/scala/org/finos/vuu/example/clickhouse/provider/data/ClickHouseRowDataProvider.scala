package org.finos.vuu.example.clickhouse.provider.data

import com.clickhouse.client.api.query.GenericRecord
import org.finos.vuu.core.table.{Column, RowWithData}
import org.finos.vuu.example.clickhouse.client.ClickHouseClient

import scala.collection.mutable.ArrayBuffer

trait ClickHouseRowDataProvider {

  def queryForRowData(table: String, columns: List[Column],
                      whereClause: String, orderBy: String,
                      limit: Int, startIndex: Int) : Vector[RowWithData]

}

object ClickHouseRowDataProvider {

  def apply(client: ClickHouseClient): ClickHouseRowDataProvider = {    
    ClickHouseRowDataProviderImpl(client, DefaultRowDataFunction)
  }

  def apply(client: ClickHouseClient, 
            rowDataFunction: Function[GenericRecord, RowWithData]) : ClickHouseRowDataProvider = {
    ClickHouseRowDataProviderImpl(client, rowDataFunction)
  }

}

private case class ClickHouseRowDataProviderImpl(client: ClickHouseClient,
                                                 rowDataFunction: Function[GenericRecord, RowWithData]) extends ClickHouseRowDataProvider {

  override def queryForRowData(table: String, columns: List[Column],
                               whereClause: String, orderBy: String,
                               limit: Int, startIndex: Int): Vector[RowWithData] = {
    val query = s"SELECT ${columns.map(_.name).mkString(", ")} FROM $table $whereClause $orderBy LIMIT $limit OFFSET $startIndex"

    client.executeQuery(query) { records =>
      val buf = new ArrayBuffer[RowWithData](records.getResultRows.toInt)
      val it = records.iterator()
      while (it.hasNext) {
        val record = it.next()
        buf += rowDataFunction(record)
      }
      buf.toVector
    }
  }

}
