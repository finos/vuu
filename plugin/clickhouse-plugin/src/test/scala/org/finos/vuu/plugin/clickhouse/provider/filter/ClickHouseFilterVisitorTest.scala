package org.finos.vuu.plugin.clickhouse.provider.filter

import org.finos.toolbox.time.TimeUtils.ofEpochNanosecond
import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableColumnBuilder
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.time.Instant
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

      val result2 = compile("intColumn = \"100\"")

      result2 shouldBe expected
    }

    Scenario("Long equality comparison") {
      val expected = ("long_c = {p_0:Int64}", Map("p_0" -> 100L))

      val result = compile("longColumn = 100")

      result shouldBe expected

      val result2 = compile("longColumn = \"100\"")

      result2 shouldBe expected
    }

    Scenario("Double equality comparison") {
      val expected = ("double_c = {p_0:Float64}", Map("p_0" -> 100.1))

      val result = compile("doubleColumn = 100.1")

      result shouldBe expected

      val result2 = compile("doubleColumn = \"100.1\"")

      result2 shouldBe expected
    }

    Scenario("Boolean equality comparison") {
      val expected = ("boolean_c = {p_0:Bool}", Map("p_0" -> true))

      val result = compile("booleanColumn = true")

      result shouldBe expected

      val result2 = compile("booleanColumn = \"true\"")

      result2 shouldBe expected
    }

    Scenario("EpochTimestamp equality comparison") {
      val expected = ("epoch_c = {p_0:DateTime64}", Map("p_0" -> ofEpochMilli(1L)))

      val result = compile("epochColumn = 1")

      result shouldBe expected

      val result2 = compile("epochColumn = \"1\"")

      result2 shouldBe expected
    }

    Scenario("EpochTimestampNano equality comparison") {
      val expected = ("epoch_nano_c = {p_0:DateTime64}", Map("p_0" -> ofEpochNanosecond(1L)))

      val result = compile("epochNanoColumn = 1")

      result shouldBe expected

      val result2 = compile("epochNanoColumn = \"1\"")

      result2 shouldBe expected
    }

    Scenario("ScaledDecimal2 equality comparison") {
      val expected = ("sd2_c = {p_0:Int64}", Map("p_0" -> 101L))

      val result = compile("sd2Column = 1.01")

      result shouldBe expected

      val result2 = compile("sd2Column = \"1.01\"")

      result2 shouldBe expected
    }

    Scenario("ScaledDecimal4 equality comparison") {
      val expected = ("sd4_c = {p_0:Int64}", Map("p_0" -> 10001L))

      val result = compile("sd4Column = 1.0001")

      result shouldBe expected

      val result2 = compile("sd4Column = \"1.0001\"")

      result2 shouldBe expected
    }

    Scenario("ScaledDecimal6 equality comparison") {
      val expected = ("sd6_c = {p_0:Int64}", Map("p_0" -> 1000001L))

      val result = compile("sd6Column = 1.000001")

      result shouldBe expected

      val result2 = compile("sd6Column = \"1.000001\"")

      result2 shouldBe expected
    }

    Scenario("ScaledDecimal8 equality comparison") {
      val expected = ("sd8_c = {p_0:Int64}", Map("p_0" -> 100000001L))

      val result = compile("sd8Column = 1.00000001")

      result shouldBe expected

      val result2 = compile("sd8Column = \"1.00000001\"")

      result2 shouldBe expected
    }

  }

  Feature("Inequality test cases") {

    Scenario("String inequality comparison") {
      val expected = ("string_c != {p_0:String}", Map("p_0" -> "rahúl"))

      val result = compile("stringColumn != \"rahúl\"")

      result shouldBe expected
    }

    Scenario("Char inequality comparison") {
      val expected = ("char_c != {p_0:String}", Map("p_0" -> "r"))

      val result = compile("charColumn != \"r\"")

      result shouldBe expected
    }

    Scenario("Int inequality comparison") {
      val expected = ("int_c != {p_0:Int32}", Map("p_0" -> 100))

      val result = compile("intColumn != 100")

      result shouldBe expected

      val result2 = compile("intColumn != \"100\"")

      result2 shouldBe expected
    }

    Scenario("Long inequality comparison") {
      val expected = ("long_c != {p_0:Int64}", Map("p_0" -> 100L))

      val result = compile("longColumn != 100")

      result shouldBe expected

      val result2 = compile("longColumn != \"100\"")

      result2 shouldBe expected
    }

    Scenario("Double inequality comparison") {
      val expected = ("double_c != {p_0:Float64}", Map("p_0" -> 100.1))

      val result = compile("doubleColumn != 100.1")

      result shouldBe expected

      val result2 = compile("doubleColumn != \"100.1\"")

      result2 shouldBe expected
    }

    Scenario("Boolean inequality comparison") {
      val expected = ("boolean_c != {p_0:Bool}", Map("p_0" -> true))

      val result = compile("booleanColumn != true")

      result shouldBe expected

      val result2 = compile("booleanColumn != \"true\"")

      result2 shouldBe expected
    }

    Scenario("EpochTimestamp inequality comparison") {
      val expected = ("epoch_c != {p_0:DateTime64}", Map("p_0" -> ofEpochMilli(1L)))

      val result = compile("epochColumn != 1")

      result shouldBe expected

      val result2 = compile("epochColumn != \"1\"")

      result2 shouldBe expected
    }

    Scenario("EpochTimestampNano inequality comparison") {
      val expected = ("epoch_nano_c != {p_0:DateTime64}", Map("p_0" -> ofEpochNanosecond(1L)))

      val result = compile("epochNanoColumn != 1")

      result shouldBe expected

      val result2 = compile("epochNanoColumn != \"1\"")

      result2 shouldBe expected
    }

    Scenario("ScaledDecimal2 equality comparison") {
      val expected = ("sd2_c != {p_0:Int64}", Map("p_0" -> 101L))

      val result = compile("sd2Column != 1.01")

      result shouldBe expected

      val result2 = compile("sd2Column != \"1.01\"")

      result2 shouldBe expected
    }

    Scenario("ScaledDecimal4 inequality comparison") {
      val expected = ("sd4_c != {p_0:Int64}", Map("p_0" -> 10001L))

      val result = compile("sd4Column != 1.0001")

      result shouldBe expected

      val result2 = compile("sd4Column != \"1.0001\"")

      result2 shouldBe expected
    }

    Scenario("ScaledDecimal6 inequality comparison") {
      val expected = ("sd6_c != {p_0:Int64}", Map("p_0" -> 1000001L))

      val result = compile("sd6Column != 1.000001")

      result shouldBe expected

      val result2 = compile("sd6Column != \"1.000001\"")

      result2 shouldBe expected
    }

    Scenario("ScaledDecimal8 inequality comparison") {
      val expected = ("sd8_c != {p_0:Int64}", Map("p_0" -> 100000001L))

      val result = compile("sd8Column != 1.00000001")

      result shouldBe expected

      val result2 = compile("sd8Column != \"1.00000001\"")

      result2 shouldBe expected
    }

  }

  Feature("Less than test cases") {

    Scenario("Int less than comparison") {
      val expected = ("int_c < {p_0:Int32}", Map("p_0" -> 1))

      val result = compile("intColumn < 1")

      result shouldBe expected
    }

    Scenario("Double less than comparison") {
      val expected = ("double_c < {p_0:Float64}", Map("p_0" -> 1.01))

      val result = compile("doubleColumn < 1.01")

      result shouldBe expected
    }

    Scenario("Long less than comparison") {
      val expected = ("long_c < {p_0:Int64}", Map("p_0" -> 100L))

      val result = compile("longColumn < 100")

      result shouldBe expected
    }

    Scenario("Epoch less than comparison") {
      val expected = ("epoch_c < {p_0:DateTime64}", Map("p_0" -> ofEpochMilli(1L)))

      val result = compile("epochColumn < 1")

      result shouldBe expected
    }

    Scenario("EpochNano less than comparison") {
      val expected = ("epoch_nano_c < {p_0:DateTime64}", Map("p_0" -> ofEpochNanosecond(1L)))

      val result = compile("epochNanoColumn < 1")

      result shouldBe expected
    }

    Scenario("ScaledDecimal2 less than comparison") {
      val expected = ("sd2_c < {p_0:Int64}", Map("p_0" -> 101L))

      val result = compile("sd2Column < 1.01")

      result shouldBe expected
    }

    Scenario("ScaledDecimal4 less than comparison") {
      val expected = ("sd4_c < {p_0:Int64}", Map("p_0" -> 10001L))

      val result = compile("sd4Column < 1.0001")

      result shouldBe expected
    }

    Scenario("ScaledDecimal6 less than comparison") {
      val expected = ("sd6_c < {p_0:Int64}", Map("p_0" -> 1000001L))

      val result = compile("sd6Column < 1.000001")

      result shouldBe expected
    }

    Scenario("ScaledDecimal8 less than comparison") {
      val expected = ("sd8_c < {p_0:Int64}", Map("p_0" -> 100000001L))

      val result = compile("sd8Column < 1.00000001")

      result shouldBe expected
    }

  }

  Feature("Less than or equal test cases") {

    Scenario("Int less than or equal comparison") {
      val expected = ("int_c <= {p_0:Int32}", Map("p_0" -> 1))

      val result = compile("intColumn <= 1")

      result shouldBe expected
    }

    Scenario("Double less than or equal comparison") {
      val expected = ("double_c <= {p_0:Float64}", Map("p_0" -> 1.01))

      val result = compile("doubleColumn <= 1.01")

      result shouldBe expected
    }

    Scenario("Long less than or equal comparison") {
      val expected = ("long_c <= {p_0:Int64}", Map("p_0" -> 100L))

      val result = compile("longColumn <= 100")

      result shouldBe expected
    }

    Scenario("Epoch less than or equal comparison") {
      val expected = ("epoch_c <= {p_0:DateTime64}", Map("p_0" -> ofEpochMilli(1L)))

      val result = compile("epochColumn <= 1")

      result shouldBe expected
    }

    Scenario("EpochNano less than or equal comparison") {
      val expected = ("epoch_nano_c <= {p_0:DateTime64}", Map("p_0" -> ofEpochNanosecond(1L)))

      val result = compile("epochNanoColumn <= 1")

      result shouldBe expected
    }

    Scenario("ScaledDecimal2 less than or equal comparison") {
      val expected = ("sd2_c <= {p_0:Int64}", Map("p_0" -> 101L))

      val result = compile("sd2Column <= 1.01")

      result shouldBe expected
    }

    Scenario("ScaledDecimal4 less than or equal comparison") {
      val expected = ("sd4_c <= {p_0:Int64}", Map("p_0" -> 10001L))

      val result = compile("sd4Column <= 1.0001")

      result shouldBe expected
    }

    Scenario("ScaledDecimal6 less than or equal comparison") {
      val expected = ("sd6_c <= {p_0:Int64}", Map("p_0" -> 1000001L))

      val result = compile("sd6Column <= 1.000001")

      result shouldBe expected
    }

    Scenario("ScaledDecimal8 less than or equal comparison") {
      val expected = ("sd8_c <= {p_0:Int64}", Map("p_0" -> 100000001L))

      val result = compile("sd8Column <= 1.00000001")

      result shouldBe expected
    }

  }

  Feature("Greater than test cases") {

    Scenario("Int greater than comparison") {
      val expected = ("int_c > {p_0:Int32}", Map("p_0" -> 1))

      val result = compile("intColumn > 1")

      result shouldBe expected
    }

    Scenario("Double greater than comparison") {
      val expected = ("double_c > {p_0:Float64}", Map("p_0" -> 1.01))

      val result = compile("doubleColumn > 1.01")

      result shouldBe expected
    }

    Scenario("Long greater than comparison") {
      val expected = ("long_c > {p_0:Int64}", Map("p_0" -> 100L))

      val result = compile("longColumn > 100")

      result shouldBe expected
    }

    Scenario("Epoch greater than comparison") {
      val expected = ("epoch_c > {p_0:DateTime64}", Map("p_0" -> ofEpochMilli(1L)))

      val result = compile("epochColumn > 1")

      result shouldBe expected
    }

    Scenario("EpochNano greater than comparison") {
      val expected = ("epoch_nano_c > {p_0:DateTime64}", Map("p_0" -> ofEpochNanosecond(1L)))

      val result = compile("epochNanoColumn > 1")

      result shouldBe expected
    }

    Scenario("ScaledDecimal2 greater than comparison") {
      val expected = ("sd2_c > {p_0:Int64}", Map("p_0" -> 101L))

      val result = compile("sd2Column > 1.01")

      result shouldBe expected
    }

    Scenario("ScaledDecimal4 greater than comparison") {
      val expected = ("sd4_c > {p_0:Int64}", Map("p_0" -> 10001L))

      val result = compile("sd4Column > 1.0001")

      result shouldBe expected
    }

    Scenario("ScaledDecimal6 greater than comparison") {
      val expected = ("sd6_c > {p_0:Int64}", Map("p_0" -> 1000001L))

      val result = compile("sd6Column > 1.000001")

      result shouldBe expected
    }

    Scenario("ScaledDecimal8 greater than comparison") {
      val expected = ("sd8_c > {p_0:Int64}", Map("p_0" -> 100000001L))

      val result = compile("sd8Column > 1.00000001")

      result shouldBe expected
    }

  }

  Feature("Greater than or equal test cases") {

    Scenario("Int greater than or equal comparison") {
      val expected = ("int_c >= {p_0:Int32}", Map("p_0" -> 1))

      val result = compile("intColumn >= 1")

      result shouldBe expected
    }

    Scenario("Double greater than or equal comparison") {
      val expected = ("double_c >= {p_0:Float64}", Map("p_0" -> 1.01))

      val result = compile("doubleColumn >= 1.01")

      result shouldBe expected
    }

    Scenario("Long greater than or equal comparison") {
      val expected = ("long_c >= {p_0:Int64}", Map("p_0" -> 100L))

      val result = compile("longColumn >= 100")

      result shouldBe expected
    }

    Scenario("Epoch greater than or equal comparison") {
      val expected = ("epoch_c >= {p_0:DateTime64}", Map("p_0" -> ofEpochMilli(1L)))

      val result = compile("epochColumn >= 1")

      result shouldBe expected
    }

    Scenario("EpochNano greater than or equal comparison") {
      val expected = ("epoch_nano_c >= {p_0:DateTime64}", Map("p_0" -> ofEpochNanosecond(1L)))

      val result = compile("epochNanoColumn >= 1")

      result shouldBe expected
    }

    Scenario("ScaledDecimal2 greater than or equal comparison") {
      val expected = ("sd2_c >= {p_0:Int64}", Map("p_0" -> 101L))

      val result = compile("sd2Column >= 1.01")

      result shouldBe expected
    }

    Scenario("ScaledDecimal4 greater than or equal comparison") {
      val expected = ("sd4_c >= {p_0:Int64}", Map("p_0" -> 10001L))

      val result = compile("sd4Column >= 1.0001")

      result shouldBe expected
    }

    Scenario("ScaledDecimal6 greater than or equal comparison") {
      val expected = ("sd6_c >= {p_0:Int64}", Map("p_0" -> 1000001L))

      val result = compile("sd6Column >= 1.000001")

      result shouldBe expected
    }

    Scenario("ScaledDecimal8 greater than or equal comparison") {
      val expected = ("sd8_c >= {p_0:Int64}", Map("p_0" -> 100000001L))

      val result = compile("sd8Column >= 1.00000001")

      result shouldBe expected
    }

  }

  Feature("String operators") {

    Scenario("Starts with") {
      val expected = ("startsWith(string_c, {p_0:String})", Map("p_0" -> "rahúl"))

      val result = compile("stringColumn starts \"rahúl\"")

      result shouldBe expected
    }

    Scenario("Ends with") {
      val expected = ("endsWith(string_c, {p_0:String})", Map("p_0" -> "rahúl"))

      val result = compile("stringColumn ends \"rahúl\"")

      result shouldBe expected
    }

    Scenario("Contains") {
      val expected = ("string_c LIKE {p_0:String}", Map("p_0" -> "%rahúl%"))

      val result = compile("stringColumn contains \"rahúl\"")

      result shouldBe expected
    }

  }

  Feature("In test cases") {

    Scenario("String In") {
      val expected = ("string_c IN {p_0:Array(String)}", Map("p_0" -> java.util.List.of("'rahúl'", "'manuel'")))

      val result = compile("stringColumn in [\"rahúl\", \"manuel\"]")

      result._1 shouldBe expected._1
      result._2.head._1 shouldEqual expected._2.head._1
      result._2.head._2 shouldEqual expected._2.head._2
    }

    Scenario("Int In") {
      val expected = ("int_c IN {p_0:Array(Int32)}", Map("p_0" -> java.util.List.of[Integer](1, 2)))

      val result = compile("intColumn in [1, 2]")

      result._1 shouldBe expected._1
      result._2.head._1 shouldEqual expected._2.head._1
      result._2.head._2 shouldEqual expected._2.head._2
    }

    Scenario("Double In") {
      val expected = ("double_c IN {p_0:Array(Float64)}", Map("p_0" -> java.util.List.of[Double](1.01, 2.02)))

      val result = compile("doubleColumn in [1.01, 2.02]")

      result._1 shouldBe expected._1
      result._2.head._1 shouldEqual expected._2.head._1
      result._2.head._2 shouldEqual expected._2.head._2
    }

    Scenario("Long In") {
      val expected = ("long_c IN {p_0:Array(Int64)}", Map("p_0" -> java.util.List.of[Long](101L, 202L)))

      val result = compile("longColumn in [101, 202]")

      result._1 shouldBe expected._1
      result._2.head._1 shouldEqual expected._2.head._1
      result._2.head._2 shouldEqual expected._2.head._2
    }

    Scenario("Char In") {
      val expected = ("char_c IN {p_0:Array(String)}", Map("p_0" -> java.util.List.of("'t'", "'f'")))

      val result = compile("charColumn in [\"t\", \"f\"]")

      result._1 shouldBe expected._1
      result._2.head._1 shouldEqual expected._2.head._1
      result._2.head._2 shouldEqual expected._2.head._2
    }

    Scenario("EpochTimestamp In") {
      val expected = (
        "epoch_c IN {p_0:Array(DateTime64)}",
        Map("p_0" -> java.util.List.of[String]("'1970-01-01 00:00:00.001000000'", "'1970-01-01 00:00:00.002000000'"))
      )

      val result = compile("epochColumn in [1, 2]")

      result._1 shouldBe expected._1
      result._2.head._1 shouldEqual expected._2.head._1
      result._2.head._2 shouldEqual expected._2.head._2
    }

    Scenario("EpochTimestampNano In") {
      val expected = (
        "epoch_nano_c IN {p_0:Array(DateTime64)}",
        Map("p_0" -> java.util.List.of[String]("'1970-01-01 00:00:00.000000001'", "'1970-01-01 00:00:00.000000002'"))
      )

      val result = compile("epochNanoColumn in [1, 2]")

      result._1 shouldBe expected._1
      result._2.head._1 shouldEqual expected._2.head._1
      result._2.head._2 shouldEqual expected._2.head._2
    }

    Scenario("ScaledDecimal2 In") {
      val expected = (
        "sd2_c IN {p_0:Array(Int64)}",
        Map("p_0" -> java.util.List.of[Long](101L, 202L))
      )

      val result = compile("sd2Column in [1.01, 2.02]")

      result._1 shouldBe expected._1
      result._2.head._1 shouldEqual expected._2.head._1
      result._2.head._2 shouldEqual expected._2.head._2
    }

    Scenario("ScaledDecimal4 In") {
      val expected = (
        "sd4_c IN {p_0:Array(Int64)}",
        Map("p_0" -> java.util.List.of[Long](10100L, 20200L))
      )

      val result = compile("sd4Column in [1.01, 2.02]")

      result._1 shouldBe expected._1
      result._2.head._1 shouldEqual expected._2.head._1
      result._2.head._2 shouldEqual expected._2.head._2
    }

    Scenario("ScaledDecimal6 In") {
      val expected = (
        "sd6_c IN {p_0:Array(Int64)}",
        Map("p_0" -> java.util.List.of[Long](1010000L, 2020000L))
      )

      val result = compile("sd6Column in [1.01, 2.02]")

      result._1 shouldBe expected._1
      result._2.head._1 shouldEqual expected._2.head._1
      result._2.head._2 shouldEqual expected._2.head._2
    }

    Scenario("ScaledDecimal8 In") {
      val expected = (
        "sd8_c IN {p_0:Array(Int64)}",
        Map("p_0" -> java.util.List.of[Long](101000000L, 202000000L))
      )

      val result = compile("sd8Column in [1.01, 2.02]")

      result._1 shouldBe expected._1
      result._2.head._1 shouldEqual expected._2.head._1
      result._2.head._2 shouldEqual expected._2.head._2
    }

  }

  Feature("Composite operators") {

    Scenario("And") {
      val expected = ("(string_c = {p_0:String} AND int_c = {p_1:Int32})",
        Map("p_0" -> "rahúl", "p_1" -> 5)
      )

      val result = compile("stringColumn = \"rahúl\" and intColumn = 5")

      result shouldBe expected
    }

    Scenario("Or") {
      val expected = ("(string_c = {p_0:String} OR int_c = {p_1:Int32})",
        Map("p_0" -> "rahúl", "p_1" -> 5)
      )

      val result = compile("stringColumn = \"rahúl\" or intColumn = 5")

      result shouldBe expected
    }

    Scenario("Nested") {
      val expected = ("(string_c = {p_0:String} OR (int_c = {p_1:Int32} AND long_c = {p_2:Int64}))",
        Map("p_0" -> "rahúl", "p_1" -> 5, "p_2" -> 100L)
      )

      val result = compile("stringColumn = \"rahúl\" or (intColumn = 5 and longColumn = 100)")

      result shouldBe expected
    }

  }

}
