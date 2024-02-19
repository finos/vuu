package org.finos.vuu.util.schema

import org.finos.vuu.util.schema.ExternalEntitySchemaBuilder.InvalidIndexException
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks._

class ExternalEntitySchemaTest extends AnyFeatureSpec with Matchers {
  Feature("ExternalEntitySchemaBuilder") {
    Scenario("Builder can correctly pass index to the schema when index applied to existent fields") {
      val index1 = ("NAME_IDX", List("name"))
      val index2 = ("SIZE_IDX", List("size"))

      val schema = ExternalEntitySchemaBuilder()
        .withColumn("name", classOf[String])
        .withColumn("size", classOf[Int])
        .withIndex(index1._1, index1._2)
        .withIndex(index2._1, index2._2)
        .build()

      schema.index shouldEqual List(index1, index2)
    }

    Scenario("Builder throws when user tries to build a schema with index applied to a non-existent field") {
      val badIndex = ("BAD_IDX", List("missing-field"))

      val exception = intercept[InvalidIndexException](
        ExternalEntitySchemaBuilder()
          .withColumn("present-field", classOf[String])
          .withIndex(badIndex._1, badIndex._2)
          .build()
      )

      exception shouldBe a[RuntimeException]
      exception.getMessage should include regex s"[Ff]ield `missing-field` in index `BAD_IDX`.*not found"
    }

    Scenario("Builder throws when user tries to build a schema with multiple indexes applied to multiple non-existent fields") {
      val badIndex1 = ("BAD_IDX", List("missing-field-1", "missing-field-2"))
      val badIndex2 = ("BAD_IDX2", List("missing-field-3"))

      val exception = intercept[InvalidIndexException](
        ExternalEntitySchemaBuilder()
          .withColumn("present-field-1", classOf[String])
          .withColumn("present-field-2", classOf[String])
          .withIndex(badIndex1._1, badIndex1._2)
          .withIndex(badIndex2._1, badIndex2._2)
          .build()
      )

      exception shouldBe a[RuntimeException]
      exception.getMessage should include regex s"[Ff]ield `missing-field-1` in index `BAD_IDX`.*not found"
      exception.getMessage should include regex s"[Ff]ield `missing-field-2` in index `BAD_IDX`.*not found"
      exception.getMessage should include regex s"[Ff]ield `missing-field-3` in index `BAD_IDX2`.*not found"
    }

    Scenario("Can build schema by passing each field") {
      val schema = ExternalEntitySchemaBuilder()
        .withColumn("name", classOf[String])
        .withColumn("size", classOf[Int])
        .build()

      schema.schemaFields shouldEqual List(
        SchemaField("name", classOf[String], 0),
        SchemaField("size", classOf[Int], 1)
      )
    }

    Scenario("Can build schema with a case class") {
      val schema = ExternalEntitySchemaBuilder().withCaseClass[TestCaseClass].build()

      schema.schemaFields shouldEqual List(
        SchemaField("name", classOf[String], 0),
        SchemaField("size", classOf[Int], 1),
        SchemaField("value", classOf[Double], 2)
      )
    }
  }

  Feature("ExternalDataType.fromString") {

    forAll(Table(
      ("str", "expected"),
      ("string", ExternalDataType.String),
      ("int", ExternalDataType.Int),
      ("long", ExternalDataType.Long),
      ("double", ExternalDataType.Double),
    ))((str, expected) =>
      Scenario(
        s"can convert `$str` to correct ignite data type"
      ) {
        ExternalDataType.fromString(str) shouldEqual expected
      }
    )

    Scenario("can handle different alphabet casing") {
      ExternalDataType.fromString("StrIng") shouldEqual ExternalDataType.String
    }

    Scenario("throws exception when unsupported data type passed") {
      val exception = intercept[RuntimeException](ExternalDataType.fromString("UnknownDataType"))
      exception shouldBe a[RuntimeException]
    }
  }
}

private case class TestCaseClass(name: String, size: Int, value: Double)