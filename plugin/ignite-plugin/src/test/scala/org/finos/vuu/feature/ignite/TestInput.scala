package org.finos.vuu.feature.ignite

object TestInput {
  def createTestOrderEntity(id: Int, ric: String, parentId: Int = 1, price: Double = 10.4, quantity: Int = 100): TestOrderEntity =
    TestOrderEntity(parentId = parentId, id = id, ric = ric, price = price, quantity = quantity)
}
