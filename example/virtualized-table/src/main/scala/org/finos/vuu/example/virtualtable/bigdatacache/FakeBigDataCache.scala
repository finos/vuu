package org.finos.vuu.example.virtualtable.bigdatacache

import scala.util.Random

case class BigDataOrder(orderId: Long, quantity: Int, price: Long, side: String, trader: String)

class FakeBigDataCache {

  private val random = new Random()

  def loadOrdersInRange(from: Int, to: Int): List[(Int, BigDataOrder)] = {

    //lets fake some processing time, 30 millis should do....
    Thread.sleep(30)

    (from until to).map( i => {
      random.setSeed(i)
      val quantity = random.nextInt()
      val price = random.nextLong()
      val side = random.nextBoolean() match {
        case true => "Buy"
        case false => "Sell"
      }
      val trader = "trader1"
      (i, BigDataOrder(i, quantity, price, side, trader))
    }).toList

  }

}
