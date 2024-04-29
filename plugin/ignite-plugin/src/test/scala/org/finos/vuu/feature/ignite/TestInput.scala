package org.finos.vuu.feature.ignite

import java.sql.Date
import java.math.BigDecimal
import java.time.LocalDate

object TestInput {
  def createTestOrderEntity(id: Int, ric: String, parentId: Int = 1, price: Double = 10.4, quantity: Int = 100,
                            rating: Char = 'A', createdAt: Date = Date.valueOf("2024-02-10"),
                            updatedAt: LocalDate = LocalDate.of(2024, 2, 15),
                            totalFill: BigDecimal = new BigDecimal(10_000.3333)): TestOrderEntity =
    TestOrderEntity(
      parentId = parentId,
      id = id,
      ric = ric,
      price = price,
      quantity = quantity,
      rating = rating,
      createdAt = createdAt,
      updatedAt = updatedAt,
      totalFill = totalFill
    )
}