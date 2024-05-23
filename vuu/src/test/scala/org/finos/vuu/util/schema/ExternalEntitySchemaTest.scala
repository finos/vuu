package org.finos.vuu.util.schema

import org.finos.vuu.util.schema.ExternalEntitySchemaBuilder.InvalidIndexException
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class ExternalEntitySchemaTest extends AnyFeatureSpec with Matchers {
  Feature("ExternalEntitySchemaBuilder") {
    Scenario("Builder can correctly pass index to the schema when index applied to existent fields") {
      val index1 = SchemaIndex("NAME_IDX", List("name"))
      val index2 = SchemaIndex("SIZE_IDX", List("size"))

      val schema = ExternalEntitySchemaBuilder()
        .withField("name", classOf[String])
        .withField("size", classOf[Int])
        .withIndex(index1.name, index1.fields)
        .withIndex(index2.name, index2.fields)
        .build()

      schema.indexes shouldEqual List(index1, index2)
    }

    Scenario("Builder throws when user tries to build a schema with index applied to a non-existent field") {
      val badIndex = SchemaIndex("BAD_IDX", List("missing-field"))

      val exception = intercept[InvalidIndexException](
        ExternalEntitySchemaBuilder()
          .withField("present-field", classOf[String])
          .withIndex(badIndex.name, badIndex.fields)
          .build()
      )

      exception shouldBe a[RuntimeException]
      exception.getMessage should include regex s"[Ff]ield `missing-field` in index `BAD_IDX`.*not found"
    }

    Scenario("Builder throws when user tries to build a schema with multiple indexes applied to multiple non-existent fields") {
      val badIndex1 = SchemaIndex("BAD_IDX", List("missing-field-1", "missing-field-2"))
      val badIndex2 = SchemaIndex("BAD_IDX2", List("missing-field-3"))

      val exception = intercept[InvalidIndexException](
        ExternalEntitySchemaBuilder()
          .withField("present-field-1", classOf[String])
          .withField("present-field-2", classOf[String])
          .withIndex(badIndex1.name, badIndex1.fields)
          .withIndex(badIndex2.name, badIndex2.fields)
          .build()
      )

      exception shouldBe a[RuntimeException]
      exception.getMessage should include regex s"[Ff]ield `missing-field-1` in index `BAD_IDX`.*not found"
      exception.getMessage should include regex s"[Ff]ield `missing-field-2` in index `BAD_IDX`.*not found"
      exception.getMessage should include regex s"[Ff]ield `missing-field-3` in index `BAD_IDX2`.*not found"
    }

    Scenario("Can build schema by passing each field") {
      val schema = ExternalEntitySchemaBuilder()
        .withField("name", classOf[String])
        .withField("size", classOf[Int])
        .build()

      schema.fields shouldEqual List(
        SchemaField("name", classOf[String], 0),
        SchemaField("size", classOf[Int], 1)
      )
    }

    Scenario("Can build schema with a case class") {
      val schema = ExternalEntitySchemaBuilder().withEntity(classOf[TestCaseClass]).build()

      schema.fields shouldEqual List(
        SchemaField("name", classOf[String], 0),
        SchemaField("size", classOf[Int], 1),
        SchemaField("value", classOf[Double], 2)
      )
    }
  }

  Feature("ExternalEntitySchema.toMap") {
    val schema = ExternalEntitySchemaBuilder().withEntity(classOf[TestCaseClass]).build()

    Scenario("Can convert list of values ordered according to the schema field index to a map of filedName->value") {
      val m = schema.toMap(List("t-shirt", 3, 10.99))

      m shouldEqual Map("name" -> "t-shirt", "size" -> 3, "value" -> 10.99)
    }

    Scenario("Can convert a list of correctly ordered values with some last missing to a map without the missing fields") {
      val m = schema.toMap(List("t-shirt", 3))

      m shouldEqual Map("name" -> "t-shirt", "size" -> 3)
    }

    Scenario("Can convert a list of correctly ordered values with extra values appended at the end to a map skipping any extra values") {
      val m = schema.toMap(List("t-shirt", 3, 10.99, "extra-value-passed"))

      m shouldEqual Map("name" -> "t-shirt", "size" -> 3, "value" -> 10.99)
    }
  }
}

private case class TestCaseClass(name: String, size: Int, value: Double)