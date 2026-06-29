package org.finos.vuu.plugin.virtualized.api

import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.GivenWhenThen
import org.scalamock.scalatest.MockFactory

class VirtualizedSessionTableColumnBuilderTest extends AnyFeatureSpec
  with Matchers
  with GivenWhenThen
  with MockFactory {

  Feature("Virtualized Session Table Column Builder") {

    Scenario("Adding columns using the single-argument methods (default remote name)") {
      Given("a new VirtualizedSessionTableColumnBuilder")
      val builder = new VirtualizedSessionTableColumnBuilder()

      When("adding every column type using only a columnName")
      builder
        .addString("strCol")
        .addDouble("doubleCol")
        .addInt("intCol")
        .addLong("longCol")
        .addBoolean("boolCol")
        .addChar("charCol")
        .addEpochTimestamp("timestampCol")
        .addScaledDecimal2("decimal2Col")
        .addScaledDecimal4("decimal4Col")
        .addScaledDecimal6("decimal6Col")
        .addScaledDecimal8("decimal8Col")

      Then("the internal array builder should mirror the column names as remote names")
      val expected = Array(
        "strCol:String:strCol",
        "doubleCol:Double:doubleCol",
        "intCol:Int:intCol",
        "longCol:Long:longCol",
        "boolCol:Boolean:boolCol",
        "charCol:Char:charCol",
        "timestampCol:EpochTimestamp:timestampCol",
        "decimal2Col:ScaledDecimal2:decimal2Col",
        "decimal4Col:ScaledDecimal4:decimal4Col",
        "decimal6Col:ScaledDecimal6:decimal6Col",
        "decimal8Col:ScaledDecimal8:decimal8Col"
      )

      builder.columns.result() shouldEqual expected
    }

    Scenario("Adding columns using the two-argument methods (explicit remote name)") {
      Given("a new VirtualizedSessionTableColumnBuilder")
      val builder = new VirtualizedSessionTableColumnBuilder()

      When("adding every column type with an explicit remoteName")
      builder
        .addString("strCol", "remoteStr")
        .addDouble("doubleCol", "remoteDouble")
        .addInt("intCol", "remoteInt")
        .addLong("longCol", "remoteLong")
        .addBoolean("boolCol", "remoteBool")
        .addChar("charCol", "remoteChar")
        .addEpochTimestamp("timestampCol", "remoteTimestamp")
        .addScaledDecimal2("decimal2Col", "remoteDecimal2")
        .addScaledDecimal4("decimal4Col", "remoteDecimal4")
        .addScaledDecimal6("decimal6Col", "remoteDecimal6")
        .addScaledDecimal8("decimal8Col", "remoteDecimal8")

      Then("the internal array builder should reflect the custom remote names accurately")
      val expected = Array(
        "strCol:String:remoteStr",
        "doubleCol:Double:remoteDouble",
        "intCol:Int:remoteInt",
        "longCol:Long:remoteLong",
        "boolCol:Boolean:remoteBool",
        "charCol:Char:remoteChar",
        "timestampCol:EpochTimestamp:remoteTimestamp",
        "decimal2Col:ScaledDecimal2:remoteDecimal2",
        "decimal4Col:ScaledDecimal4:remoteDecimal4",
        "decimal6Col:ScaledDecimal6:remoteDecimal6",
        "decimal8Col:ScaledDecimal8:remoteDecimal8"
      )

      builder.columns.result() shouldEqual expected
    }

    Scenario("Verifying fluent interface pattern (method chaining)") {
      Given("a new VirtualizedSessionTableColumnBuilder")
      val builder = new VirtualizedSessionTableColumnBuilder()

      When("chaining method calls together")
      val resultBuilder = builder.addString("col1").addInt("col2", "remote2")

      Then("each method should return the exact same builder instance instance reference")
      resultBuilder shouldBe builder
    }
  }
}
