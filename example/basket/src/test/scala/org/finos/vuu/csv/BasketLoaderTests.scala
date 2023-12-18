package org.finos.vuu.csv

import org.finos.vuu.core.module.basket.csv.BasketLoader
import org.scalatest.featurespec.AnyFeatureSpec
class BasketLoaderTests extends AnyFeatureSpec {

  Feature("Basket ids loading Test Case") {

    Scenario("Can successfully get basket ids from files") {
      val testResourcePath = this.getClass.getResource("/constituents").getPath
      val basketLoader = new BasketLoader(Some(testResourcePath))
      val basketIds = basketLoader.loadBasketIds()

      assert(basketIds.length == 2)
      assert(basketIds.contains(".FTSE100"))
      assert(basketIds.contains(".FTSEWITHERROR"))
    }

    Scenario("when no file found return empty") {
      val testResourcePath = this.getClass.getResource("/constituents").getPath + "/doesNotExist"
      val basketLoader = new BasketLoader(Some(testResourcePath))
      val basketIds = basketLoader.loadBasketIds()

      assert(basketIds.length == 0)
    }
  }

  Feature("Basket constituent loading Test Case") {

    val testResourcePath =  this.getClass.getResource("/constituents").getPath
    val basketLoader = new BasketLoader(Some(testResourcePath))

    Scenario("Can successfully load and parse basket constituents") {

      val constituents = basketLoader.loadConstituents(".FTSE100")

      assert(constituents.length == 3)
      val firstRow = constituents.head
      assert(firstRow("Symbol") == "AAL.L")
      assert(firstRow("Last Trade") == "436.35")
      assert(firstRow("Name") == "Anglo American PLC")
      assert(firstRow("Weighting") == 0.0278736825813547)
      assert(firstRow("Volume") == "5799089")
      assert(firstRow("Change") == "5.35")
    }

    Scenario("When parsing basket constituents fails return empty") {

      val constituents = basketLoader.loadConstituents(".FTSEWithError")

      assert(constituents.length == 0)
    }


    Scenario("When no matching basket constituents file return empty") {

      val constituents = basketLoader.loadConstituents(".NoSuchFile")

      assert(constituents.length == 0)
    }

  }
}