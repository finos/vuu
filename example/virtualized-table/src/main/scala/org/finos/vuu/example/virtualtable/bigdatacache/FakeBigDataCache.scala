package org.finos.vuu.example.virtualtable.bigdatacache

case class BigDataOrder(orderId: Long, quantity: Int, price: Long, side: String, trader: String)

class FakeBigDataCache {
  
  private final val DATASET_SIZE = 1_000_000_000 //this would be dynamically loaded from the data source in a real example

  def loadOrdersInRange(from: Int, to: Int): (Int, List[(Int, BigDataOrder)]) = {
    val bigOrdersWithIndex = (from until to).map { i =>
      val hash = scala.util.hashing.MurmurHash3.finalizeHash(i, 0).abs

      val quantity = hash
      val price = hash * 100L
      val side = if ((hash & 1) == 0) "Buy" else "Sell"      // Check if last bit is even/odd
      val trader = "trader1"

      (i, BigDataOrder(i, quantity, price, side, trader))
    }.toList

    (DATASET_SIZE, bigOrdersWithIndex)
  }
}
