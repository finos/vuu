package org.finos.vuu.core.module.simul.model

case class ParentOrder(
                        id: Int,
                        ric: String,
                        price: Double,
                        quantity: Int,
                        side: String,
                        account: String,
                        exchange: String,
                        ccy: String,
                        algo: String,
                        volLimit: Double,
                        filledQty: Int,
                        openQty: Int,
                        averagePrice: Double,
                        status: String,
                        remainingQty: Int,
                        activeChildren: Int,
                        owner: String = "",
                        permissionMask: Int = 0
                      )
