package org.finos.vuu.util.types

import org.finos.vuu.util.types.{DefaultTypeConverters, TypeConverter, TypeConverterContainerBuilder}
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
      tcContainer.typeConverter(classOf[String], classOf[Long]) should not be empty
      tcContainer.typeConverter(classOf[String], classOf[Double]) should not be empty
    }

    Scenario("contains user defined converters") {
      tcContainer.typeConverter(userDefinedConverter.fromClass, userDefinedConverter.toClass) should not be empty
      tcContainer.typeConverter(
        userDefinedConverterOverridesADefault.fromClass, userDefinedConverterOverridesADefault.toClass
      ) should not be empty
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
      tcContainer.typeConverter(userDefinedConverter.fromClass, userDefinedConverter.toClass) should not be empty
    }
  }

  Feature("TypeConverterContainer.convert") {
    val converter = TypeConverter[Double, String](classOf[Double], classOf[String], _.toString)
    val container = TypeConverterContainerBuilder()
      .withoutDefaults()
      .withConverter(converter)
      .build()

    Scenario("should simply return the same value if From & To types are equal even if no converter found") {
      container.convert[Char, java.lang.Character]('A', classOf[Char], classOf[java.lang.Character]).get should equal('A')
    }

    Scenario("should return converted value if required type converter exists") {
      container.convert(10.55, classOf[Double], classOf[String]).get should equal("10.55")
    }

    Scenario("should return empty if type converter not found") {
      container.convert(10.55, classOf[Double], classOf[Long]) shouldBe empty
    }
  }

  Feature("TypeConverterContainerBuilder.with2WayConverter") {
    val container = TypeConverterContainerBuilder()
      .withoutDefaults()
      .with2WayConverter[Long, String](classOf[Long], classOf[String], _.toString, _.toLong)
      .build()

    Scenario("should build both converters") {
      container.typeConverter(classOf[Long], classOf[String]) should not be empty
      container.typeConverter(classOf[String], classOf[Long]) should not be empty
    }
  }
}
