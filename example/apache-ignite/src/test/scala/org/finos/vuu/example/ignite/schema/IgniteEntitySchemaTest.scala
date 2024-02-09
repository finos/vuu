package org.finos.vuu.example.ignite.schema

import org.apache.ignite.cache.{QueryIndex, QueryIndexType}
import org.finos.vuu.example.ignite.schema.IgniteEntitySchemaBuilder.InvalidIndexException
import org.finos.vuu.feature.ignite.schema.SchemaField
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.TableDrivenPropertyChecks._

import scala.jdk.CollectionConverters.IterableHasAsJava

class IgniteEntitySchemaTest extends AnyFeatureSpec with Matchers {
  private val queryIndex1 = new QueryIndex(List("name").asJavaCollection, QueryIndexType.SORTED).setName("NAME_IDX")
  private val queryIndex2 = new QueryIndex(List("size").asJavaCollection, QueryIndexType.SORTED).setName("SIZE_IDX")

  Feature("IgniteEntitySchemaBuilder") {
    Scenario("Builder can correctly pass index to the schema when index applied to existent fields") {
      val schema = IgniteEntitySchemaBuilder()
        .withColumn("name", classOf[String])
        .withColumn("size", classOf[Int])
        .withIndex(queryIndex1)
        .withIndex(queryIndex2)
        .build()

      schema.queryIndex shouldEqual List(queryIndex1, queryIndex2)
    }

    Scenario("Builder throws when user tries to build a schema with index applied to a non-existent field") {
      val exception = intercept[InvalidIndexException](
        IgniteEntitySchemaBuilder()
          .withColumn("other-field", classOf[String])
          .withIndex(queryIndex1)
          .build()
      )
      exception shouldBe a[RuntimeException]
      exception.getMessage should include regex s"[Ff]ield `name` in index `NAME_IDX`.*not found"
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