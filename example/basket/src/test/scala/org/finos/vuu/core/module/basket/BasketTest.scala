package org.finos.vuu.core.module.basket

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.module.price.PriceModule
import org.finos.vuu.test.VuuServerTestCase

class BasketTest extends VuuServerTestCase {

  Feature("Example Test Case") {

    Scenario("Check scenario") {

      implicit val clock: Clock = new TestFriendlyClock(10001L)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())
      implicit val metricsProvider: MetricsProvider = new MetricsProviderImpl

      withVuuServer(PriceModule(), BasketModule()) { vuuServer =>

        val pricesProvider = vuuServer.getProvider("PRICE", "prices")

        pricesProvider.tick("VOD.L", Map("ric" -> "VOD.L"))
//
//        val viewport = vuuServer.createViewPort("PRICE", "prices")
//
//        vuuServer.runOnce()

        //val service = viewport.getRpcService[TestService]

//        val action = service.sendBasketToMarket()
//
//        service.editCellAction().func("VOD.L", "price", 10001L, viewport, vuuServer.session)
//        service.editCellAction().func("VOD.L", "price", 10001L, viewport, vuuServer.session)
//        service.editCellAction().func("VOD.L", "price", 10001L, viewport, vuuServer.session)
//
//        service.onFormSubmit().func(viewport, vuuServer.session)

        //action.getClass should equal(ViewPortAc)
      }

    }
  }

}
