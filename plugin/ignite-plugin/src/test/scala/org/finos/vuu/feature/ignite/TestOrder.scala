package org.finos.vuu.feature.ignite

case class TestOrder(
                      parentId: Int,
                      id: Int,
                      ric: String,
                      price: Double,
                      quantity: Int,
                      filledQty: Int)
