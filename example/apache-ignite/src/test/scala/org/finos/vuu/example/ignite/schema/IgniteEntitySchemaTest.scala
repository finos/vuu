package org.finos.vuu.example.ignite.schema

import org.apache.ignite.cache.{QueryIndex, QueryIndexType}
import org.finos.vuu.example.ignite.schema.IgniteEntitySchemaBuilder.InvalidIndexException
import org.finos.vuu.feature.ignite.schema.SchemaField
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks._

import scala.jdk.CollectionConverters.IterableHasAsJava

class IgniteEntitySchemaTest extends AnyFeatureSpec with Matchers {
  Feature("IgniteEntitySchemaBuilder") {
    Scenario("Builder can correctly pass index to the schema when index applied to existent fields") {
      val queryIndex1 = new QueryIndex(List("name").asJavaCollection, QueryIndexType.SORTED).setName("NAME_IDX")
      val queryIndex2 = new QueryIndex(List("size").asJavaCollection, QueryIndexType.SORTED).setName("SIZE_IDX")

      val schema = IgniteEntitySchemaBuilder()
        .withColumn("name", classOf[String])
        .withColumn("size", classOf[Int])
        .withIndex(queryIndex1)
        .withIndex(queryIndex2)
        .build()

      schema.queryIndex shouldEqual List(queryIndex1, queryIndex2)
    }

    Scenario("Builder throws when user tries to build a schema with index applied to a non-existent field") {
      val badIndex = new QueryIndex(List("missing-field").asJavaCollection, QueryIndexType.SORTED).setName("BAD_IDX")

      val exception = intercept[InvalidIndexException](
        IgniteEntitySchemaBuilder()
          .withColumn("present-field", classOf[String])
          .withIndex(badIndex)
          .build()
      )

      exception shouldBe a[RuntimeException]
      exception.getMessage should include regex s"[Ff]ield `missing-field` in index `BAD_IDX`.*not found"
    }

    Scenario("Builder throws when user tries to build a schema with multiple indexes applied to multiple non-existent fields") {
      val badIndex1 = new QueryIndex(
        List("missing-field-1", "missing-field-2").asJavaCollection, QueryIndexType.SORTED
      ).setName("BAD_IDX")
      val badIndex2 = new QueryIndex(List("missing-field-3").asJavaCollection, QueryIndexType.SORTED).setName("BAD_IDX2")

      val exception = intercept[InvalidIndexException](
        IgniteEntitySchemaBuilder()
          .withColumn("present-field-1", classOf[String])
          .withColumn("present-field-2", classOf[String])
          .withIndex(badIndex1)
          .withIndex(badIndex2)
          .build()
      )

      exception shouldBe a[RuntimeException]
      exception.getMessage should include regex s"[Ff]ield `missing-field-1` in index `BAD_IDX`.*not found"
      exception.getMessage should include regex s"[Ff]ield `missing-field-2` in index `BAD_IDX`.*not found"
      exception.getMessage should include regex s"[Ff]ield `missing-field-3` in index `BAD_IDX2`.*not found"
    }

    Scenario("Can build schema by passing each field") {
      val schema = IgniteEntitySchemaBuilder()
        .withColumn("name", classOf[String])
        .withColumn("size", classOf[Int])
        .build()

      schema.schemaFields shouldEqual List(
        SchemaField("name", classOf[String], 0),
        SchemaField("size", classOf[Int], 1)
      )
    }

    Scenario("Can build schema with a case class") {
      val schema = IgniteEntitySchemaBuilder().withCaseClass[TestCaseClass].build()

      schema.schemaFields shouldEqual List(
        SchemaField("name", classOf[String], 0),
        SchemaField("size", classOf[Int], 1),
        SchemaField("value", classOf[Double], 2)
      )
    }
  }

  Feature("IgniteDataType.fromString") {

    forAll(Table(
      ("str", "expected"),
      ("string", IgniteDataType.String),
      ("int", IgniteDataType.Int),
      ("long", IgniteDataType.Long),
      ("double", IgniteDataType.Double),
    ))((str, expected) =>
      Scenario(
        s"can convert `$str` to correct ignite data type"
      ) {
        IgniteDataType.fromString(str) shouldEqual expected
      }
    )

    Scenario("can handle different alphabet casing") {
      IgniteDataType.fromString("StrIng") shouldEqual IgniteDataType.String
    }

    Scenario("throws exception when unsupported data type passed") {
      val exception = intercept[RuntimeException](IgniteDataType.fromString("UnknownDataType"))
      exception shouldBe a[RuntimeException]
    }
  }
}

private case class TestCaseClass(name: String, size: Int, value: Double)