package org.finos.vuu.util.schema.typeConversion

import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class TypeConverterTest extends AnyFeatureSpec with Matchers {

  Feature("TypeConverter") {
    Scenario("quick instantiation through TypeConverter.apply") {
      val tc: TypeConverter[Int, String] = TypeConverter(classOf[Int], classOf[String], _.toString)

      tc.convert(101) should equal("101")
      tc.name should equal("java.lang.Integer->java.lang.String")
    }

    Scenario("instantiation through trait implementation") {
      class MyTypeConverter extends TypeConverter[Double, String] {
        override val fromClass: Class[Double] = classOf[Double]
        override val toClass: Class[String] = classOf[String]
        override def convert(v: Double): String = v.toString
      }

      val tc: TypeConverter[Double, String] = new MyTypeConverter()

      tc.convert(10.56) should equal("10.56")
      tc.name should equal("java.lang.Double->java.lang.String")
    }
  }
}
