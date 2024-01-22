package org.finos.vuu.core.module.simul.ignite

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.module.simul.provider.{ParentChildOrdersModel, SeededRandomNumbers}
import org.finos.vuu.data.order.{ChildOrder, OrderStore}
import org.finos.vuu.data.order.ignite.IgniteOrderStore

import java.util.concurrent.Executors
import java.util.concurrent.atomic.LongAdder

object IgniteOrderLoader extends App {
  implicit val clock: Clock = new DefaultClock()
  implicit val lifecycleContainer: LifecycleContainer = new LifecycleContainer()
  implicit val randomNumbers: SeededRandomNumbers = new SeededRandomNumbers(clock.now())
  implicit val orderStore: OrderStore = IgniteOrderStore.apply()

  private val ordersModel = new ParentChildOrdersModel()
  private val childOrderCounter = new LongAdder()
  private val executor = Executors.newWorkStealingPool()

  (0 until (50_000)).foreach(i =>
  executor.execute { () =>
    val parent = ordersModel.createParent()
    val childrenToCreate = randomNumbers.seededRand(100, 250)

    val children = (0 until childrenToCreate)
      .map(_ => ordersModel.createChild(parent))
      .foldLeft(List[ChildOrder]())((acc, child) => acc :+ child)

    orderStore.storeParentOrderWithChildren(parent, children)
    childOrderCounter.add(children.length)
    if(i % 1000 == 0) {
      println(s"[${Thread.currentThread().getName}] Loaded : $i parent orders and ${childOrderCounter.sum()} child orders")
    }
  })
}
