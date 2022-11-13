package org.finos.vuu.core.module

import org.finos.vuu.core.table.Columns
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class ModuleSyntaxTest extends AnyFeatureSpec with Matchers with GivenWhenThen{

  Feature("check the new builder syntax for view server modules"){

    Scenario("check we can parse the module"){

      Given("A test module which several tables defined, which takes some parameters (these are simple example params but could be complicated lifecycle stuff)")
      val module = TestModule2.apply("foo", 100)
      module.tableDefs.size should be (3)
      module.name should equal("TEST")

      val instruments = module.tableDefs.head

      instruments.name should equal("instruments")
      instruments.columns should equal(
        Columns.fromNames(
          "ric:String",
          "description:String",
          "currency:String",
          "exchange:String",
          "lotSize:Double"
        )
      )
      instruments.joinFields should equal(Seq("ric"))
      
      val prices = module.tableDefs.tail.head
      prices.name should equal("prices")
      prices.columns.size should equal(7)
      prices.joinFields should equal(Seq("ric"))

      val instrumentPrices = module.tableDefs.tail.tail.head
      instrumentPrices.name should equal("instrumentPrices")
      instrumentPrices.columns.size should equal(prices.columns.size + instruments.columns.size - 1)

      instrumentPrices.joinFields should equal(Seq())
    }
  }
}
