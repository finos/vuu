package org.finos.vuu.core.table.datatype

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.math.BigDecimal as JBigDecimal

class ScaledDecimalTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("ScaledDecimal Factory") {

    Scenario("Creating ScaledDecimals with various scales") {

      Given("a set of input BigDecimals and target Scales")
      val val2 = BigDecimal("123.45")
      val val4 = BigDecimal("1.2345")
      val val6 = BigDecimal("0.123456")
      val val8 = BigDecimal("0.01234567")

      When("ScaledDecimal objects are created via the factory")
      val sd2 = ScaledDecimal(val2, Scale.Two)
      val sd4 = ScaledDecimal(val4, Scale.Four)
      val sd6 = ScaledDecimal(val6, Scale.Six)
      val sd8 = ScaledDecimal(val8, Scale.Eight)

      Then("the underlying scaledValue should be shifted correctly")
      sd2.scaledValue shouldBe 12345L
      sd4.scaledValue shouldBe 12345L
      sd6.scaledValue shouldBe 123456L
      sd8.scaledValue shouldBe 1234567L

      And("the type should match the specific case class")
      sd2 shouldBe a [ScaledDecimal2]
      sd8 shouldBe a [ScaledDecimal8]
    }

    Scenario("Handling Java BigDecimal inputs") {

      Given("a Java BigDecimal")
      val jVal = new JBigDecimal("10.50")

      When("ScaledDecimal is created using the Java-compatible apply method")
      val result = ScaledDecimal(jVal, Scale.Two)

      Then("it should correctly calculate the scaled value")
      result.scaledValue shouldBe 1050L
    }
  }

  Feature("Comparison and Ordering") {

    Scenario("Comparing two ScaledDecimal2 instances") {

      Given("two ScaledDecimal2 instances with different values")
      val smaller = ScaledDecimal2(1000L)
      val larger = ScaledDecimal2(2000L)
      val equalToSmaller = ScaledDecimal2(1000L)

      Then("the comparison operators should work correctly")
      (larger > smaller) shouldBe true
      (smaller < larger) shouldBe true
      (smaller <= equalToSmaller) shouldBe true
      (smaller == equalToSmaller) shouldBe true
    }
  }
}