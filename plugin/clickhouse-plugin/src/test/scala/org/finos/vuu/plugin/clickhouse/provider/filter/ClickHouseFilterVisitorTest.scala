package org.finos.vuu.plugin.clickhouse.provider.filter

import org.finos.toolbox.time.TimeUtils.ofEpochNanosecond
import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableColumnBuilder
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.time.Instant.ofEpochMilli
import scala.collection.mutable

class ClickHouseFilterVisitorTest extends AnyFeatureSpec with Matchers {

  private val remoteColumns = VirtualizedSessionTableColumnBuilder()
    .addString("stringColumn", "string_c")
    .addChar("charColumn", "char_c")
    .addInt("intColumn", "int_c")
    .addLong("longColumn", "long_c")
    .addDouble("doubleColumn", "double_c")
    .addBoolean("booleanColumn", "boolean_c")
    .addScaledDecimal2("sd2Column", "sd2_c")
    .addScaledDecimal4("sd4Column", "sd4_c")
    .addScaledDecimal6("sd6Column", "sd6_c")
    .addScaledDecimal8("sd8Column", "sd8_c")
    .addEpochTimestamp("epochColumn", "epoch_c")
    .addEpochTimestampNano("epochNanoColumn", "epoch_nano_c")
    .build()
    .map(f => f.name -> f)
    .toMap

  private def compile(filterStr: String): (String, mutable.HashMap[String, Any]) = {
    val stringBuilder = new java.lang.StringBuilder(256)
    val params = new mutable.HashMap[String, Any]()
    val clickHouseFilterVisitor = ClickHouseFilterVisitor(remoteColumns, stringBuilder, params)
    FilterSpecParser.parse(filterStr, clickHouseFilterVisitor)
    (stringBuilder.toString, params)
  }

  Feature("Edge cases") {

    Scenario("Invalid column name throws an exception") {
      var exception: IllegalArgumentException = null

      exception = intercept[IllegalArgumentException] {
        compile("lolcats = \"Fluffy\"")
      }

      exception.getMessage should include("Mapping missing for filter column: 'lolcats'")
    }

  }

  Feature("Equality test cases") {

    Scenario("String equality comparison") {
      val expected = ("string_c = {p_0:String}", Map("p_0" -> "rahúl"))

      val result = compile("stringColumn = \"rahúl\"")

      result shouldBe expected
    }

    Scenario("Char equality comparison") {
      val expected = ("char_c = {p_0:String}", Map("p_0" -> "r"))

      val result = compile("charColumn = \"r\"")

      result shouldBe expected
    }

    Scenario("Int equality comparison") {
      val expected = ("int_c = {p_0:Int32}", Map("p_0" -> 100))

      val result = compile("intColumn = 100")

      result shouldBe expected
    }

    Scenario("Long equality comparison") {
      val expected = ("long_c = {p_0:Int64}", Map("p_0" -> 100L))

      val result = compile("longColumn = 100")

      result shouldBe expected
    }

    Scenario("Double equality comparison") {
      val expected = ("double_c = {p_0:Float64}", Map("p_0" -> 100.1))

      val result = compile("doubleColumn = 100.1")

      result shouldBe expected
    }

    Scenario("Boolean equality comparison") {
      val expected = ("boolean_c = {p_0:Bool}", Map("p_0" -> true))

      val result = compile("booleanColumn = true")

      result shouldBe expected
    }

    Scenario("EpochTimestamp equality comparison") {
      val expected = ("epoch_c = {p_0:DateTime64}", Map("p_0" -> ofEpochMilli(1L)))

      val result = compile("epochColumn = \"1\"")

      result shouldBe expected
    }

    Scenario("EpochTimestampNano equality comparison") {
      val expected = ("epoch_nano_c = {p_0:DateTime64}", Map("p_0" -> ofEpochNanosecond(1L)))

      val result = compile("epochNanoColumn = \"1\"")

      result shouldBe expected
    }

    Scenario("ScaledDecimal2 equality comparison") {
      val expected = ("sd2_c = {p_0:Int64}", Map("p_0" -> 101L))

      val result = compile("sd2Column = 1.01")

      result shouldBe expected
    }

    Scenario("ScaledDecimal4 equality comparison") {
      val expected = ("sd4_c = {p_0:Int64}", Map("p_0" -> 10001L))

      val result = compile("sd4Column = 1.0001")

      result shouldBe expected
    }

    Scenario("ScaledDecimal6 equality comparison") {
      val expected = ("sd6_c = {p_0:Int64}", Map("p_0" -> 1000001L))

      val result = compile("sd6Column = 1.000001")

      result shouldBe expected
    }

    Scenario("ScaledDecimal8 equality comparison") {
      val expected = ("sd8_c = {p_0:Int64}", Map("p_0" -> 100000001L))

      val result = compile("sd8Column = 1.00000001")

      result shouldBe expected
    }


    //    Scenario("Magnitude comparisons") {
    //      compile("price > 123.45") shouldBe "price > 123.45"
    //      compile("price >= 100") shouldBe "price >= 100"
    //      compile("price < 50.5") shouldBe "price < 50.5"
    //      compile("price <= 50") shouldBe "price <= 50"
    //    }
    //
    //    Scenario("String match operators") {
    //      compile("ric starts \"AAPL\"") shouldBe "ric LIKE 'AAPL%'"
    //      compile("ric ends \"L\"") shouldBe "ric LIKE '%L'"
    //      compile("ric contains \"OD\"") shouldBe "ric LIKE '%OD%'"
    //    }
    //
    //    Scenario("In set operations") {
    //      compile("ric in [\"AAPL.L\", \"BT.L\"]") shouldBe "ric IN ('AAPL.L', 'BT.L')"
    //      compile("quantity in [10, 20, 30]") shouldBe "quantity IN (10, 20, 30)"
    //      compile("ric in []") shouldBe "1 = 0"
    //    }
    //
    //    Scenario("Composite logical operators") {
    //      compile("ric = \"AAPL.L\" and quantity > 100") shouldBe "(ric = 'AAPL.L' AND quantity > 100)"
    //      compile("ric = \"AAPL.L\" or quantity > 100") shouldBe "(ric = 'AAPL.L' OR quantity > 100)"
    //      compile("(ric = \"AAPL.L\" or ric = \"BT.L\") and quantity > 100") shouldBe "((ric = 'AAPL.L' OR ric = 'BT.L') AND quantity > 100)"
    //    }
    //

  }
}
