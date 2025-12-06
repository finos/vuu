//package org.finos.vuu.provider
//
//import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
//import org.finos.toolbox.lifecycle.LifecycleContainer
//import org.finos.toolbox.time.TestFriendlyClock
//import org.finos.vuu.api.{TableDef, VisualLinks}
//import org.finos.vuu.core.module.FieldDefString
//import org.finos.vuu.core.module.basket.BasketModule.{BasketConstituentColumnNames => BC}
//import org.finos.vuu.core.module.basket.provider.BasketConstituentProvider
//import org.finos.vuu.core.table.{Column, Columns, InMemDataTable, ViewPortColumnCreator}
//import org.scalatest.BeforeAndAfter
//import org.scalatest.featurespec.AnyFeatureSpec
//import org.scalatest.matchers.should.Matchers
//
//class BasketConstituentProviderTest extends AnyFeatureSpec with Matchers with BeforeAndAfter {
//  final val TEST_TIME = 1450770869442L
//  val joinProvider = new TestFriendlyJoinTableProvider
//  implicit val timeProvider: TestFriendlyClock = new TestFriendlyClock(TEST_TIME)
//  implicit val metrics: MetricsProvider = new MetricsProviderImpl
//  implicit val lifecycleContainer: LifecycleContainer = new LifecycleContainer
//
//  val tableDef = TableDef(
//    name = "basketConstituent",
//    keyField = BC.RicBasketId,
//    columns = Columns.fromNames(new FieldDefString(BC.RicBasketId).string(),
//      new FieldDefString(BC.Ric).string(),
//      new FieldDefString(BC.BasketId).string(),
//      new FieldDefString(BC.Weighting).double(),
//      new FieldDefString(BC.LastTrade).string(),
//      new FieldDefString(BC.Change).string(),
//      new FieldDefString(BC.Volume).string()), // we can join to instruments and other tables to get the rest of the data.....
//    VisualLinks(),
//    joinFields = BC.RicBasketId
//  )
//  val table = new InMemDataTable(tableDef, joinProvider)
//  val provider = new BasketConstituentProvider(table)
//  val columns: Array[Column] = provider.table.getTableDef.getColumns
//  val headers: Array[String] = columns.map(_.name)
//
//  before {
//    provider.runOnce
//  }
//
//  ignore("Able to load basket constituents from .FTSE100 and show on basket constituent table") {
//
//    Scenario("display ric") {
//      assert(getDataForBasket(".FTSE100")(0)(headers.indexOf(BC.Ric)) == "AAL.L")
//    }
//
//    Scenario("display basket id") {
//      assert(getDataForBasket(".FTSE100")(0)(headers.indexOf(BC.BasketId)) == ".FTSE100")
//    }
//
//    Scenario("display change") {
//      assert(getDataForBasket(".FTSE100")(0)(headers.indexOf(BC.Change)) == "�5.35�(1.24%)")
//    }
//
//    // TODO emily - volume with , is not parsed correctly
////    Scenario("display volume") {
////      assert(getDataForBasket(".FTSE100")(0)(headers.indexOf(BC.Volume)) == "5,799,089")
////    }
//
//    Scenario("display weighting") {
//      assert(getDataForBasket(".FTSE100")(0)(headers.indexOf(BC.Weighting)) == null)
//    }
//  }
//
//  ignore("Able to load basket constituents from .NASDAQ100 and show on basket constituent table") {
//
////    Scenario("display ric") {
////      val array = getDataForBasket(".NASDAQ100")
////      assert(array(0)(headers.indexOf(BC.Ric)) == "AAPL")
////    }
//
//    Scenario("display basket id") {
//      assert(getDataForBasket(".NASDAQ100")(0)(headers.indexOf(BC.BasketId)) == ".NASDAQ100")
//    }
//
//    Scenario("display change") {
//      assert(getDataForBasket(".NASDAQ100")(0)(headers.indexOf(BC.Change)) == null)
//    }
//
//    Scenario("display volume") {
//      assert(getDataForBasket(".NASDAQ100")(0)(headers.indexOf(BC.Volume)) == null)
//    }
//
////    Scenario("display weighting") {
////      assert(getDataForBasket(".NASDAQ100")(0)(headers.indexOf(BC.Weighting)) == "11.007")
////    }
//  }
//
//
//  private def getData = {
//    val keys = provider.table.primaryKeys
//    val data = keys.toArray.map(key => provider.table.pullRowAsArray(key, ViewPortColumnCreator.create(provider.table, columns.map(_.name).toList)))
//    data
//  }
//  private def getDataForBasket(basketId:String) = {
//    val data = getData
//    data.filter(e => e(headers.indexOf(BC.BasketId))==basketId)
//  }
//}
