package io.venuu.vuu.viewport.balancing

import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.thread.balancing.{BalancingWorkerContainer, BalancingWorker, DefaultWorkerManager, SimpleBinPackingAlgo, WorkGenerator}
import io.venuu.vuu.util.table.TableAsserts
import io.venuu.vuu.viewport.{AbstractViewPortTestCase, ViewPort}
import io.venuu.vuu.viewport.OrdersAndPricesScenarioFixture.setup
import org.joda.time.{DateTime, DateTimeZone}
import org.scalatest.GivenWhenThen
import org.scalatest.matchers.should.Matchers

class BalancingViewPortTest extends AbstractViewPortTestCase with Matchers with GivenWhenThen {

  Feature("Verify Logic for Balancing Viewport Processing"){

    Scenario("Check we can calculate viewports and move them between threads"){

      import TableAsserts._

      implicit val lifecycle = new LifecycleContainer

      val dateTime = new DateTime(2015, 7, 24, 11, 0, DateTimeZone.forID("Europe/London")).toDateTime.toInstant.getMillis

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      val workGenerator = new  ViewPortWorkGenerator(viewPortContainer)

      val size = 3

      val workers = (0 until size).map( i => new ViewPortBalancingWorker()).toArray[BalancingWorker[ViewPort]]

      val workerManager = new DefaultWorkerManager[ViewPort](5, workers)

      val threadManager = new BalancingWorkerContainer(3, workGenerator, new SimpleBinPackingAlgo[ViewPort], workerManager)


    }

  }

}
