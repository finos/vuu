package org.finos.vuu.core.table.datatype

import org.junit.Assert.assertEquals
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class DecimalTest extends AnyFeatureSpec with Matchers {

  Feature("Check creation") {

    Scenario("Check creation via BigDecimal - Simple") {

      val input = BigDecimal("1234.56789123")

      val decimal = Decimal(input)

      assertEquals(123456789123L, decimal.value)
    }

    Scenario("Check creation via BigDecimal - More than 8 digits of precision is truncated") {

      val input = BigDecimal("1234.567891239")

      val decimal = Decimal(input)

      assertEquals(123456789123L, decimal.value)
    }

    Scenario("Check creation via BigDecimal - Number is maximum supported") {

      val input = Decimal.MaxValue

      val decimal = Decimal(input)

      assertEquals(Long.MaxValue, decimal.value)
    }

    Scenario("Check creation via BigDecimal - Whole number too large - throws Exception") {

      val input = BigDecimal("92233720368.54775808")

      intercept[IllegalArgumentException] {
        Decimal(input)
      }
    }

    Scenario("Check creation via BigDecimal - Number is minimum supported") {

      val input = Decimal.MinValue

      val decimal = Decimal(input)

      assertEquals(Long.MinValue, decimal.value)
    }

    Scenario("Check creation via BigDecimal - Whole number too small - throws Exception") {

      val input = BigDecimal("-92233720368.54775809")

      intercept[IllegalArgumentException] {
        Decimal(input)
      }
    }

  }
}
