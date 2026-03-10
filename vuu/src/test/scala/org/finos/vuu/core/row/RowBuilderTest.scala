package org.finos.vuu.core.row

import org.finos.toolbox.jmx.MetricsProviderImpl
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.datatype.Scale.{EIGHT, Eight, FOUR, Four, Six, Two}
import org.finos.vuu.core.table.datatype.{EpochTimestamp, ScaledDecimal, ScaledDecimal2}
import org.finos.vuu.core.table.{Columns, InMemDataTable}
import org.finos.vuu.provider.{JoinTableProvider, JoinTableProviderImpl}
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class RowBuilderTest extends AnyFeatureSpec with Matchers with GivenWhenThen{

  def getTableDef: TableDef = {
      TableDef(
        name = "instruments",
        keyField = "ric",
        columns = Columns.fromNames(
          "ric:String",
          "description:String",
          "currency: String",
          "exchange:String",
          "lotSize:Double",
          "lastUpdated:EpochTimeStamp",
          "shortSellRestriction:Char",
          "delta:ScaledDecimal2",
          "tau:ScaledDecimal4",
          "gamma:ScaledDecimal6",
          "theta:ScaledDecimal8",
        ),
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

      val (ricColumn, descColumn, currColumn, exchangeColumn, lotSizeColumn, lastUpdatedColumn, shortSellRestrictionColumn,
        deltaColumn, tauColumn, gammaColumn, thetaColumn) =
        (
          tableDef.columnForName("ric"),
          tableDef.columnForName("description"),
          tableDef.columnForName("currency"),
          tableDef.columnForName("exchange"),
          tableDef.columnForName("lotSize"),
          tableDef.columnForName("lastUpdated"),
          tableDef.columnForName("shortSellRestriction"),
          tableDef.columnForName("delta"),
          tableDef.columnForName("tau"),
          tableDef.columnForName("gamma"),
          tableDef.columnForName("theta"),
        )

      val table = new InMemDataTable(tableDef, joinTableProvider)

      val row = table.rowBuilder
        .setKey("FOO.L")
        .setString(ricColumn, "FOO.L")
        .setString(descColumn, "Foo Inc")
        .setString(currColumn, "GBP")
        .setString(exchangeColumn, "LSE")
        .setDouble(lotSizeColumn, 1000.123)
        .setEpochTimestamp(lastUpdatedColumn, EpochTimestamp(1))
        .setChar(shortSellRestrictionColumn, 'N')
        .setScaledDecimal(deltaColumn, ScaledDecimal(1.01, Two))
        .setScaledDecimal(tauColumn, ScaledDecimal(1.02, Four))
        .setScaledDecimal(gammaColumn, ScaledDecimal(1.03, Six))
        .setScaledDecimal(thetaColumn, ScaledDecimal(1.04, Eight))
        .build

      row.key should equal("FOO.L")
      row.get(ricColumn) should equal("FOO.L")
      row.get(descColumn) should equal("Foo Inc")
      row.get(currColumn) should equal("GBP")
      row.get(exchangeColumn) should equal("LSE")
      row.get(lotSizeColumn) should equal(1000.123)
      row.get(lastUpdatedColumn) should equal(EpochTimestamp(1))
      row.get(shortSellRestrictionColumn) should equal('N')
      row.get(deltaColumn) should equal(ScaledDecimal(1.01, Two))
      row.get(tauColumn) should equal(ScaledDecimal(1.02, Four))
      row.get(gammaColumn) should equal(ScaledDecimal(1.03, Six))
      row.get(thetaColumn) should equal(ScaledDecimal(1.04, Eight))
    }

    Scenario("Test Reuse of Row Builder"){

      implicit val clock: Clock = new TestFriendlyClock(1000000)
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProviderImpl = new MetricsProviderImpl

      val tableDef = getTableDef
      val joinTableProvider: JoinTableProvider = JoinTableProviderImpl()

      val (ricColumn, descColumn, currColumn, exchangeColumn, lotSizeColumn, lastUpdatedColumn, shortSellRestrictionColumn,
      deltaColumn, tauColumn, gammaColumn, thetaColumn) =
        (
          tableDef.columnForName("ric"),
          tableDef.columnForName("description"),
          tableDef.columnForName("currency"),
          tableDef.columnForName("exchange"),
          tableDef.columnForName("lotSize"),
          tableDef.columnForName("lastUpdated"),
          tableDef.columnForName("shortSellRestriction"),
          tableDef.columnForName("delta"),
          tableDef.columnForName("tau"),
          tableDef.columnForName("gamma"),
          tableDef.columnForName("theta"),
        )

      val table = new InMemDataTable(tableDef, joinTableProvider)

      val builder = table.rowBuilder

      val row = builder.setKey("FOO.L")
        .setString(ricColumn, "FOO.L")
        .setString(descColumn, "Foo Inc")
        .setString(currColumn, "GBP")
        .setString(exchangeColumn, "LSE")
        .setDouble(lotSizeColumn, 1000.123)
        .setEpochTimestamp(lastUpdatedColumn, EpochTimestamp(1))
        .setChar(shortSellRestrictionColumn, 'N')
        .setScaledDecimal(deltaColumn, ScaledDecimal(1.01, Two))
        .setScaledDecimal(tauColumn, ScaledDecimal(1.02, Four))
        .setScaledDecimal(gammaColumn, ScaledDecimal(1.03, Six))
        .setScaledDecimal(thetaColumn, ScaledDecimal(1.04, Eight))
        .build

      row.key should equal("FOO.L")
      row.get(ricColumn) should equal("FOO.L")
      row.get(descColumn) should equal("Foo Inc")
      row.get(currColumn) should equal("GBP")
      row.get(exchangeColumn) should equal("LSE")
      row.get(lotSizeColumn) should equal(1000.123)
      row.get(lastUpdatedColumn) should equal(EpochTimestamp(1))
      row.get(shortSellRestrictionColumn) should equal('N')
      row.get(deltaColumn) should equal(ScaledDecimal(1.01, Two))
      row.get(tauColumn) should equal(ScaledDecimal(1.02, Four))
      row.get(gammaColumn) should equal(ScaledDecimal(1.03, Six))
      row.get(thetaColumn) should equal(ScaledDecimal(1.04, Eight))

      intercept[RuntimeException]{
        builder.build
      }

      val row2 = builder.setKey("BAR.L")
        .setString(ricColumn, "BAR.L")
        .setString(descColumn, "Bar Inc")
        .setString(currColumn, "USD")
        .setString(exchangeColumn, "NYSE")
        .setDouble(lotSizeColumn, 1010.123)
        .setEpochTimestamp(lastUpdatedColumn, EpochTimestamp(2))
        .setChar(shortSellRestrictionColumn, 'Y')
        .setScaledDecimal(deltaColumn, ScaledDecimal(2.01, Two))
        .setScaledDecimal(tauColumn, ScaledDecimal(2.02, Four))
        .setScaledDecimal(gammaColumn, ScaledDecimal(2.03, Six))
        .setScaledDecimal(thetaColumn, ScaledDecimal(2.04, Eight))
        .build

      row2.key should equal("BAR.L")
      row2.get(ricColumn) should equal("BAR.L")
      row2.get(descColumn) should equal("Bar Inc")
      row2.get(currColumn) should equal("USD")
      row2.get(exchangeColumn) should equal("NYSE")
      row2.get(lotSizeColumn) should equal(1010.123)
      row2.get(lastUpdatedColumn) should equal(EpochTimestamp(2))
      row2.get(shortSellRestrictionColumn) should equal('Y')
      row2.get(deltaColumn) should equal(ScaledDecimal(2.01, Two))
      row2.get(tauColumn) should equal(ScaledDecimal(2.02, Four))
      row2.get(gammaColumn) should equal(ScaledDecimal(2.03, Six))
      row2.get(thetaColumn) should equal(ScaledDecimal(2.04, Eight))

    }


  }


}
