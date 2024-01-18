package org.finos.vuu.feature.ignite

object TestInput {
  def createTestOrder(id: Int, ric: String, parentId: Int = 1): TestOrder =
    TestOrder(parentId = parentId, id = id, ric = ric, price = 10.4, quantity = 100, filledQty = 0)
}
