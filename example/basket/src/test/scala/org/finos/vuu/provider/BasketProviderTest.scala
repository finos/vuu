//package org.finos.vuu.provider
//
//import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
//import org.finos.toolbox.lifecycle.LifecycleContainer
//import org.finos.toolbox.time.TestFriendlyClock
//import org.finos.vuu.api.{TableDef, VisualLinks}
//import org.finos.vuu.core.module.FieldDefString
//import org.finos.vuu.core.module.basket.BasketModule.{BasketColumnNames => B}
//import org.finos.vuu.core.module.basket.provider.BasketProvider
//import org.finos.vuu.core.table.{Column, Columns, InMemDataTable, ViewPortColumnCreator}
//import org.scalatest.BeforeAndAfter
//import org.scalatest.featurespec.AnyFeatureSpec
//import org.scalatest.matchers.should.Matchers
//
//class BasketProviderTest extends AnyFeatureSpec with Matchers with BeforeAndAfter {
//  final val TEST_TIME = 1450770869442L
//  val joinProvider = new TestFriendlyJoinTableProvider
//  implicit val timeProvider: TestFriendlyClock = new TestFriendlyClock(TEST_TIME)
//  implicit val metrics: MetricsProvider = new MetricsProviderImpl
//  implicit val lifecycleContainer: LifecycleContainer = new LifecycleContainer
//
//  val tableDef = TableDef(
//    name = "basket",
//    keyField = B.Id,
//    columns = Columns.fromNames(
//      new FieldDefString(B.Id).string(),
//      new FieldDefString(B.Name).string(),
//      new FieldDefString(B.NotionalValue).double(),
//      new FieldDefString(B.NotionalValueUsd).double()),
//    VisualLinks(),
//    joinFields = B.Id
//  )
//  val table = new InMemDataTable(tableDef, joinProvider)
//  val provider = new BasketProvider(table)
//  val columns: Array[Column] = provider.table.getTableDef.getColumns
//  val headers: Array[String] = columns.map(_.name)
//
//  before {
//    provider.runOnce()
//  }
//
//  Feature("Able to load baskets") {
//
//    Scenario("get list of baskets") {
//      val ids = getData.map(e => e(headers.indexOf(B.Id)))
////      assert(ids.sameElements(Array(".NASDAQ100", ".FTSE100", ".SP500", ".HSI")))
//    }
//  }
//
//  private def getData = {
//    val keys = provider.table.primaryKeys
//    val data = keys.toArray.map(key => provider.table.pullRowAsArray(key, ViewPortColumnCreator.create(provider.table, columns.map(_.name).toList)))
//    data
//  }
//}
