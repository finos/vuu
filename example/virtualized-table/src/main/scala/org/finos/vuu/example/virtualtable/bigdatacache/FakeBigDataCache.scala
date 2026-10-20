package org.finos.vuu.example.virtualtable.bigdatacache

import org.finos.vuu.example.virtualtable.bigdatacache.FakeBigDataCache.DATASET_SIZE

case class BigDataOrder(orderId: String, quantity: Int, price: Long, side: String, trader: String)

object FakeBigDataCache {
  final val DATASET_SIZE = 1_000_000_000 //this would be dynamically loaded from the data source in a real example
}

class FakeBigDataCache {
    
  def loadOrdersInRange(from: Int, to: Int): (Int, List[(Int, BigDataOrder)]) = {
    val bigOrdersWithIndex = (from until to).map { i =>
      (i, buildOrder(i))
    }.toList

    (DATASET_SIZE, bigOrdersWithIndex)
  }

  def loadOrdersForKeys(keys: Iterable[String]) : Iterator[BigDataOrder] = {
    keys.iterator.map(key => buildOrder(key.toInt))
  }

  private def buildOrder(orderId: Int): BigDataOrder = {
    val hash = scala.util.hashing.MurmurHash3.finalizeHash(orderId, 0).abs
    val quantity = hash
    val price = hash * 100L
    val side = if ((hash & 1) == 0) "Buy" else "Sell" // Check if last bit is even/odd
    val trader = "trader1"
    BigDataOrder(orderId.toString, quantity, price, side, trader)
  }

}
