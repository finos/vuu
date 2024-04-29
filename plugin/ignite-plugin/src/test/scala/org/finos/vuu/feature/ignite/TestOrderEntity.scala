package org.finos.vuu.feature.ignite

import java.sql.Date
import java.math.BigDecimal
import java.time.LocalDate

case class TestOrderEntity(parentId: Int,
                           id: Int,
                           ric: String,
                           price: Double,
                           quantity: Int,
                           rating: Char,
                           createdAt: Date,
                           updatedAt: LocalDate,
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
      updatedAt = cols.get(7).asInstanceOf[LocalDate],
      totalFill = cols.get(8).asInstanceOf[BigDecimal]
    )
  }
}
