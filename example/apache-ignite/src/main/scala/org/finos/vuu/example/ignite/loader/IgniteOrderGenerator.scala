package org.finos.vuu.example.ignite.loader

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.simul.model.{ChildOrder, OrderStore}
import org.finos.vuu.core.module.simul.provider.{ParentChildOrdersModel, SeededRandomNumbers}

import java.util.concurrent.Executors
import java.util.concurrent.atomic.LongAdder

class IgniteOrderGenerator(orderStore: OrderStore) (implicit clock: Clock, lifecycleContainer: LifecycleContainer) extends StrictLogging{

  implicit val randomNumbers: SeededRandomNumbers = new SeededRandomNumbers(clock.now())
  private val ordersModel = new ParentChildOrdersModel()
  private val childOrderCounter = new LongAdder()
  private val executor = Executors.newWorkStealingPool()

  def save(): Unit = {

    logger.info("[Ignite] Saving orders to ignite.")
    (0 until 4_000).foreach(i =>
      executor.execute { () =>
        val parent = ordersModel.createParent()
        val childrenToCreate = randomNumbers.seededRand(100, 250)

        val children = (0 until childrenToCreate)
          .map(_ => ordersModel.createChild(parent))
          .foldLeft(List[ChildOrder]())((acc, child) => acc :+ child)

        orderStore.storeParentOrderWithChildren(parent, children)
        childOrderCounter.add(children.length)
        if (i % 1000 == 0) {
          println(s"[${Thread.currentThread().getName}] Loaded : $i parent orders and ${childOrderCounter.sum()} child orders")
        }
      })
  }


}
