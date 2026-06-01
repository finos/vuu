package org.finos.vuu.example.clickhouse.provider.data

import com.clickhouse.client.api.query.GenericRecord
import org.finos.vuu.core.table.RowWithData

object DefaultRowDataFunction extends Function[GenericRecord, RowWithData] {

  override def apply(v1: GenericRecord): RowWithData = {
    RowWithData(
      v1.getString("orderId"),
      Map(
        "orderId" -> v1.getString("orderId"),
        "quantity" -> v1.getInteger("quantity"),
        "price" -> v1.getLong("price"),
        "side" -> v1.getString("side"),
        "trader" -> v1.getString("trader")
      )
    )
  }
}
