package org.finos.vuu.core.row

import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.{Columns, InMemDataTable}
import org.finos.vuu.provider.{JoinTableProvider, JoinTableProviderImpl, VuuJoinTableProvider}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class RowBuilderTest extends AnyFeatureSpec with Matchers with GivenWhenThen{

  def getTableDef: TableDef = {
      TableDef(
        name = "instruments",
        keyField = "ric",
        columns = Columns.fromNames("ric:String", "description:String", "currency: String", "exchange:String", "lotSize:Double"),
        joinFields = "ric"
      )
  }

  Feature("Test the row Builder for use in providers"){

    Scenario("Test New Each Time Row Builder"){

      implicit val clock: Clock = new TestFriendlyClock(1000000)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProviderImpl = new MetricsProviderImpl

      val tableDef = getTableDef
      val joinTableProvider: JoinTableProvider = JoinTableProviderImpl()

      val (ricColumn, descColumn, currColumn, exchangeColumn, lotSizeColumn) =
        (
          tableDef.columnForName("ric"), tableDef.columnForName("description"),
          tableDef.columnForName("currency"),tableDef.columnForName("exchange"), tableDef.columnForName("lotSize")
        )

      val table = new InMemDataTable(tableDef, joinTableProvider)

      val row = table.rowBuilder
        .setKey("FOO.L")
        .setString(ricColumn, "FOO.L")
        .setString(descColumn, "Foo Inc")
        .setString(currColumn, "GBP")
        .setString(exchangeColumn, "LSE")
        .setDouble(lotSizeColumn, 1000.123)
        .asRow

      row.key should equal("FOO.L")
      row.get(ricColumn) should equal("FOO.L")
      row.get(descColumn) should equal("Foo Inc")
      row.get(currColumn) should equal("GBP")
      row.get(exchangeColumn) should equal("LSE")
      row.get(lotSizeColumn) should equal(1000.123)

    }

    Scenario("Test Reuse of Row Builder"){

      implicit val clock: Clock = new TestFriendlyClock(1000000)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProviderImpl = new MetricsProviderImpl

      val tableDef = getTableDef
      val joinTableProvider: JoinTableProvider = JoinTableProviderImpl()

      val (ricColumn, descColumn, currColumn, exchangeColumn, lotSizeColumn) =
        (
          tableDef.columnForName("ric"), tableDef.columnForName("description"),
          tableDef.columnForName("currency"),tableDef.columnForName("exchange"), tableDef.columnForName("lotSize")
        )

      val table = new InMemDataTable(tableDef, joinTableProvider)

      val builder = table.rowBuilder

      val row = builder.setKey("FOO.L")
        .setString(ricColumn, "FOO.L")
        .setString(descColumn, "Foo Inc")
        .setString(currColumn, "GBP")
        .setString(exchangeColumn, "LSE")
        .setDouble(lotSizeColumn, 1000.123)
        .asRow

      row.key should equal("FOO.L")
      row.get(ricColumn) should equal("FOO.L")
      row.get(descColumn) should equal("Foo Inc")
      row.get(currColumn) should equal("GBP")
      row.get(exchangeColumn) should equal("LSE")
      row.get(lotSizeColumn) should equal(1000.123)

      intercept[RuntimeException]{
        builder.asRow
      }

      val row2 = builder.setKey("BAR.L")
        .setString(ricColumn, "BAR.L")
        .setString(descColumn, "Bar Inc")
        .setString(currColumn, "USD")
        .setString(exchangeColumn, "NYSE")
        .setDouble(lotSizeColumn, 1010.123)
        .asRow

      row2.key should equal("BAR.L")
      row2.get(ricColumn) should equal("BAR.L")
      row2.get(descColumn) should equal("Bar Inc")
      row2.get(currColumn) should equal("USD")
      row2.get(exchangeColumn) should equal("NYSE")
      row2.get(lotSizeColumn) should equal(1010.123)

    }


  }


}
