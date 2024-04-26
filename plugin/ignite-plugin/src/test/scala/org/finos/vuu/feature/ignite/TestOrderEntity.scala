package org.finos.vuu.feature.ignite

import java.sql.Date
import java.math.BigDecimal

case class TestOrderEntity(parentId: Int,
                           id: Int,
                           ric: String,
                           price: Double,
                           quantity: Int,
                           rating: Char,
                           createdAt: Date,
                           totalFill: BigDecimal) {}

object TestOrderEntity{
  def createFrom(cols: java.util.List[_]): TestOrderEntity = {
    TestOrderEntity(
      parentId = cols.get(0).asInstanceOf[Int],
      id = cols.get(1).asInstanceOf[Int],
      ric = cols.get(2).asInstanceOf[String],
      price = cols.get(3).asInstanceOf[Double],
      quantity = cols.get(4).asInstanceOf[Int],
      rating = cols.get(5).asInstanceOf[Char],
      createdAt = cols.get(6).asInstanceOf[Date],
      totalFill = cols.get(7).asInstanceOf[BigDecimal]
    )
  }
}

object ColumnMap {

  private type TableToIgniteColumns = Map[String, String]

  private val orderMap : TableToIgniteColumns =  Map(
    "orderId" -> "id",
    "ric" -> "ric",
    "price" -> "price",
    "quantity" -> "quantity",
    "parentOrderId" -> "parentId",
    "rating" -> "rating",
    "createdAt" -> "createdAt",
    "totalFill" -> "totalFill",
  )
  def toIgniteColumn(tableColumn: String): Option[String] =
    orderMap.get(tableColumn)

}