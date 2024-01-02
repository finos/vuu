package org.finos.vuu.example.virtualtable.bigdatacache

import scala.util.Random

case class BigDataOrder(orderId: Long, quantity: Int, price: Long, side: String, trader: String)

class FakeBigDataCache {

  private val random = new Random()
  private final val DATASET_SIZE = 1_000_000 //this would be dynamically loaded from the data source in a real example

  def loadOrdersInRange(from: Int, to: Int): (Int, List[(Int, BigDataOrder)]) = {

    //lets fake some processing time, 30 millis should do....
    Thread.sleep(30)

    val bigOrdersWithIndex = (from until to).map( i => {
      random.setSeed(i)
      val quantity = random.nextInt()
      val price = random.nextLong()
      val side = if (random.nextBoolean()) {
        "Buy"
      } else {
        "Sell"
      }
      val trader = "trader1"
      (i, BigDataOrder(i, quantity, price, side, trader))
    }).toList

    //we return the total size of the dataset, as well as the records, with the index in the data set
    (DATASET_SIZE, bigOrdersWithIndex)
  }
}
