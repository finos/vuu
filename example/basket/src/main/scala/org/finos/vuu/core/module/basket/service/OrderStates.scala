package org.finos.vuu.core.module.basket.service

object OrderStates {
  final val PENDING = "PENDING"
  final val ACKED = "ACKED"
  final val CANCELLED = "CANCELLED"
  final val FILLED = "FILLED"
}

object BasketStates{
  final val OFF_MARKET = "OFF_MARKET"
  final val ON_MARKET = "ON_MARKET"
}
