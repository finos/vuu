package org.finos.vuu

import org.finos.vuu.data.order.ignite.IgniteOrderStore

import java.time.{Duration, Instant}

/**
 * An App that belongs to the suite of the following : <br>
 * 1. [[CacheNodeApplication]] - an app that starts Ignite cluster storage node <br>
 * 2. [[IgniteOrderLoader]] - an app that loads random orders and child orders into ignite cache <br>
 * 3. [[IgniteCacheQueryApplication]] - a showcase class that queries Ignite for slices of ChildOrders <br>
 */
object IgniteCacheQueryApplication extends App {
  val orderStore = IgniteOrderStore()

  private val windowSize = 100
  private var offset = 500
  //private var remaining = orderStore.childOrderCount()

  //while (remaining > 0) {
   // val nextWindow = Math.min(windowSize, remaining)

    val startTime = Instant.now()
    val orders = orderStore.findWindow(offset, 400)
    println(s"Size : ${orders.size} in ${Duration.between(startTime, Instant.now())}")
    //offset += nextWindow.toInt
    //remaining -= nextWindow
  //}
}
