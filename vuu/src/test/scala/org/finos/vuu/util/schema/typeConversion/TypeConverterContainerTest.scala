package org.finos.vuu.util.schema.typeConversion

import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.math.BigDecimal

class TypeConverterContainerTest extends AnyFeatureSpec with Matchers {
  private val userDefinedConverter = TypeConverter[BigDecimal, Double](classOf[BigDecimal], classOf[Double], _.doubleValue())

  Feature("Instantiation with both default and user-defined converters") {
    val userDefinedConverterOverridesADefault = TypeConverter[String, Int](classOf[String], classOf[Int], _.toInt + 50)
    val tcContainer = TypeConverterContainerBuilder()
      .withConverter(userDefinedConverter)
      .withConverter(userDefinedConverterOverridesADefault)
      .build()

    Scenario("contains default converters") {
      tcContainer.typeConverter(classOf[String], classOf[Long]).nonEmpty should be(true)
      tcContainer.typeConverter(classOf[String], classOf[Double]).nonEmpty should be(true)
    }

    Scenario("contains user defined converters") {
      tcContainer.typeConverter(userDefinedConverter.fromClass, userDefinedConverter.toClass).nonEmpty should be(true)
      tcContainer.typeConverter(
        userDefinedConverterOverridesADefault.fromClass, userDefinedConverterOverridesADefault.toClass
      ).nonEmpty shouldBe true
    }

    Scenario("user defined overrides any default converters for the same types") {
      val defaultConverter = DefaultTypeConverters.stringToIntConverter

      tcContainer.typeConverter(classOf[String], classOf[Int]).get should not equal defaultConverter
      tcContainer.typeConverter(classOf[String], classOf[Int]).get should equal(userDefinedConverterOverridesADefault)
    }
  }

  Feature("Instantiation with only user-defined converters") {
    val tcContainer = TypeConverterContainerBuilder()
      .withoutDefaults()
      .withConverter(userDefinedConverter)
      .build()

    Scenario("contains no default converters") {
      val defaultConverters = DefaultTypeConverters.getAll

      defaultConverters.exists(tc => tcContainer.typeConverter(tc.fromClass, tc.toClass).nonEmpty) shouldBe false
    }

    Scenario("contains added user defined converter") {
      tcContainer.typeConverter(userDefinedConverter.fromClass, userDefinedConverter.toClass).nonEmpty shouldBe true
    }
  }
}
