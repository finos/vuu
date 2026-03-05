package org.finos.toolbox.number

import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.math.BigInteger

class BigDecimalToScaledLongConverterTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("BigDecimal to Scaled Long conversion") {

    Scenario("The requested shift matches the current scale (Alignment)") {
      Given("a BigDecimal with scale 2")
      val bd = BigDecimal("123.45")

      When("shifting left by 2 to get a whole number")
      val result = BigDecimalToScaledLongConverter.toScaledLong(bd, 2)

      Then("the result should be the unscaled value exactly")
      result shouldBe 12345L
    }

    Scenario("Shifting left more than the current scale (Upscaling)") {
      Given("a BigDecimal with scale 2")
      val bd = BigDecimal("12.34")

      When("shifting left by 4 (moving point right by 2 extra places)")
      val result = BigDecimalToScaledLongConverter.toScaledLong(bd, 4)

      Then("the result should be multiplied by 100")
      result shouldBe 123400L
    }

    Scenario("Shifting a very small decimal left by a big value") {
      Given("a decimal with scale 18 decimal places")
      val bd = BigDecimal("0.000000000000000001")

      When("shifting left by 36")
      val result = BigDecimalToScaledLongConverter.toScaledLong(bd, 36)

      Then("the result should be 1000000000000000000")
      result shouldBe 1000000000000000000L
    }

    Scenario("Shifting left more than the current scale, but larger than the max") {
      Given("a BigDecimal with scale 0")
      val bd = BigDecimal("12")

      Then("shifting left by 19 should throw an exception")
      assertThrows[ArithmeticException] {
        BigDecimalToScaledLongConverter.toScaledLong(bd, 19)
      }
    }

    Scenario("Shifting left less than the current scale (Downscaling)") {
      Given("a BigDecimal with scale 6")
      val bd = BigDecimal("1.234567")

      When("shifting left by 2 (keeping only two decimal places as whole numbers)")
      val result = BigDecimalToScaledLongConverter.toScaledLong(bd, 2)

      Then("the result should be truncated")
      result shouldBe 123L
    }

    Scenario("Shifting left less than the current scale, but still too small to have a value") {
      Given("a BigDecimal with scale -18")
      val bd = new java.math.BigDecimal(BigInteger.valueOf(1), 36)

      When("shifting left by 16")
      val result = BigDecimalToScaledLongConverter.toScaledLong(bd, 16)

      Then("the result should be truncated to zero")
      result shouldBe 0L
    }

    Scenario("Handling zero values") {
      Given("a BigDecimal of zero")
      val bd = BigDecimal("0.000")

      When("shifting left by any amount")
      val result = BigDecimalToScaledLongConverter.toScaledLong(bd, 5)

      Then("the result should still be 0")
      result shouldBe 0L
    }

    Scenario("Handling massive decimals") {
      Given("a decimal that is greater than 63 bits")
      val hugeUnscaled = new BigInteger("1234567890123456789012345678901234567890")
      val bd = new java.math.BigDecimal(hugeUnscaled, 18)

      Then("shifting left by anything should throw an exception")
      assertThrows[ArithmeticException] {
        BigDecimalToScaledLongConverter.toScaledLong(bd, 0)
      }
    }

  }

}
