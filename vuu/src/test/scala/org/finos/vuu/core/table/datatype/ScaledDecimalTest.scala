package org.finos.vuu.core.table.datatype

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks

import java.math.BigDecimal as JBigDecimal

class ScaledDecimalTest extends AnyFeatureSpec with Matchers with GivenWhenThen with TableDrivenPropertyChecks {

  Feature("ScaledDecimal Factory") {

    Scenario("Creating ScaledDecimals with various scales") {

      // Define the test data table
      val testCases = Table(
        ("input",            "scale",       "expectedScaledValue", "expectedClass"),
        (BigDecimal("123.45"),    Scale.Two,    12345L,               classOf[ScaledDecimal2]),
        (BigDecimal("1.2345"),    Scale.Four,   12345L,               classOf[ScaledDecimal4]),
        (BigDecimal("0.123456"),  Scale.Six,    123456L,              classOf[ScaledDecimal6]),
        (BigDecimal("0.01234567"), Scale.Eight,  1234567L,             classOf[ScaledDecimal8])
      )

      forAll(testCases) { (input, scale, expectedScaledValue, expectedClass) =>
        Given(s"a BigDecimal $input and target $scale")

        When("a ScaledDecimal is created")
        val result = ScaledDecimal(input, scale)

        Then(s"the scaledValue should be $expectedScaledValue")
        result.scaledValue shouldBe expectedScaledValue

        And(s"the type should be ${expectedClass.getSimpleName}")
        result.getClass shouldBe expectedClass

        And("the toString should match the scaledValue")
        result.toString shouldBe expectedScaledValue.toString
      }
    }

    Scenario("Handling Java BigDecimal inputs") {
      val javaTestCases = Table(
        ("input",            "scale",    "expectedValue"),
        (new JBigDecimal("10.50"), Scale.Two, 1050L),
        (new JBigDecimal("1.1234"), Scale.Four, 11234L),
        (new JBigDecimal("0.123456"), Scale.Six, 123456L),
        (new JBigDecimal("0.01234567"), Scale.Eight, 1234567L),
      )

      forAll(javaTestCases) { (jVal, scale, expected) =>
        val result = ScaledDecimal(jVal, scale)
        result.scaledValue shouldBe expected
      }
    }
  }

  Feature("Comparison and Ordering") {

    Scenario("Comparing ScaledDecimal instances") {
      val comparisonTable = Table(
        ("val1", "val2", "isGreater", "isEqual"),
        (1000L, 2000L, false, false),
        (2000L, 1000L, true,  false),
        (1000L, 1000L, false, true)
      )

      forAll(comparisonTable) { (v1, v2, isGreater, isEqual) =>
        val sd1 = ScaledDecimal2(v1)
        val sd2 = ScaledDecimal2(v2)

        (sd1 > sd2) shouldBe isGreater
        (sd1 == sd2) shouldBe isEqual
        if (!isEqual) (sd1 < sd2) shouldBe !isGreater
      }
    }
  }
}