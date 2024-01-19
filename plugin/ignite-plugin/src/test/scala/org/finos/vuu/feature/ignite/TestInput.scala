package org.finos.vuu.feature.ignite

object TestInput {
  def createTestOrderEntity(id: Int, ric: String, parentId: Int = 1, quantity: Int = 100): TestOrderEntity =
    TestOrderEntity(parentId = parentId, id = id, ric = ric, price = 10.4, quantity = quantity)
}
