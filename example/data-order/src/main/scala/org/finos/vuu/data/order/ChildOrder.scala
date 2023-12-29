package org.finos.vuu.data.order

case class ChildOrder(
                       parentId: Int,
                       id: Int,
                       ric: String,
                       price: Double,
                       quantity: Int,
                       side: String,
                       account: String,
                       strategy: String,
                       exchange: String,
                       ccy: String,
                       volLimit: Double,
                       filledQty: Int,
                       openQty: Int,
                       averagePrice: Double,
                       status: String
                     )
