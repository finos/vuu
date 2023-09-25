package org.finos.vuu.provider

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.TestFriendlyClock
import org.finos.vuu.core.module.basket.BasketModule.{BASKET_CONSTITUENT_TABLE_DEF, BasketConstituentColumnNames}
import org.finos.vuu.core.module.basket.provider.BasketConstituentProvider
import org.finos.vuu.core.table.{Column, SimpleDataTable, ViewPortColumnCreator}
import org.scalatest.BeforeAndAfter
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class BasketConstituentProviderTest extends AnyFeatureSpec with Matchers with BeforeAndAfter {
  final val TEST_TIME = 1450770869442L
  val joinProvider = new TestFriendlyJoinTableProvider
  implicit val timeProvider: TestFriendlyClock = new TestFriendlyClock(TEST_TIME)
  implicit val metrics: MetricsProvider = new MetricsProviderImpl
  implicit val lifecycleContainer: LifecycleContainer = new LifecycleContainer
  val table = new SimpleDataTable(BASKET_CONSTITUENT_TABLE_DEF, joinProvider)
  val provider = new BasketConstituentProvider(table)
  val columns: Array[Column] = provider.table.getTableDef.columns
  val headers: Array[String] = columns.map(_.name)

  before {
    provider.runOnce()
  }

  Feature("Able to load basket constituents from .FTSE100 and show on basket constituent table") {

    Scenario("display ric") {
      assert(getDataForBasket(".FTSE100")(0)(headers.indexOf(BasketConstituentColumnNames.Ric)) == "AAL.L")
    }

    Scenario("display basket id") {
      assert(getDataForBasket(".FTSE100")(0)(headers.indexOf(BasketConstituentColumnNames.BasketId)) == ".FTSE100")
    }

    Scenario("display change") {
      assert(getDataForBasket(".FTSE100")(0)(headers.indexOf(BasketConstituentColumnNames.Change)) == null)
    }

    Scenario("display volume") {
      assert(getDataForBasket(".FTSE100")(0)(headers.indexOf(BasketConstituentColumnNames.Volume)) == null)
    }

    Scenario("display weighting") {
      assert(getDataForBasket(".FTSE100")(0)(headers.indexOf(BasketConstituentColumnNames.Weighting)) == null)
    }
  }

  Feature("Able to load basket constituents from .NASDAQ100 and show on basket constituent table") {

    Scenario("display ric") {
      assert(getDataForBasket(".NASDAQ100")(0)(headers.indexOf(BasketConstituentColumnNames.Ric)) == "AAPL")
    }

    Scenario("display basket id") {
      assert(getDataForBasket(".NASDAQ100")(0)(headers.indexOf(BasketConstituentColumnNames.BasketId)) == ".NASDAQ100")
    }

    Scenario("display change") {
      assert(getDataForBasket(".NASDAQ100")(0)(headers.indexOf(BasketConstituentColumnNames.Change)) == null)
    }

    Scenario("display volume") {
      assert(getDataForBasket(".NASDAQ100")(0)(headers.indexOf(BasketConstituentColumnNames.Volume)) == null)
    }

    Scenario("display weighting") {
      assert(getDataForBasket(".NASDAQ100")(0)(headers.indexOf(BasketConstituentColumnNames.Weighting)) == null)
    }
  }


  private def getData = {
    val keys = provider.table.primaryKeys
    val data = keys.toArray.map(key => provider.table.pullRowAsArray(key, ViewPortColumnCreator.create(provider.table, columns.map(_.name).toList)))
    data
  }
  private def getDataForBasket(basketId:String) = {
    getData.filter(e => e(headers.indexOf(BasketConstituentColumnNames.BasketId))==basketId).toArray
  }
}
