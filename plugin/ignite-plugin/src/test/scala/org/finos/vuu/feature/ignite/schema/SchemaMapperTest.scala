package org.finos.vuu.feature.ignite.schema

import org.finos.vuu.core.table.{Column, SimpleColumn}
import org.finos.vuu.feature.ignite.schema.SchemaMapper.InvalidSchemaMapException
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class SchemaMapperTest extends AnyFeatureSpec with Matchers {

  private val testExternalSchema = new TestEntitySchema
  private val tableColumnsByExternalField = testTableColumnsByExternalField()
  private val schemaMapper = SchemaMapper(testExternalSchema, tableColumnsByExternalField)

  Feature("validation") {
    Scenario("fails when mapped external field not found in external schema") {
      val exception = intercept[InvalidSchemaMapException](
        SchemaMapper(testExternalSchema, Map("not-exists" -> SimpleColumn("ric", 0, classOf[Int])))
      )
      exception shouldBe a[RuntimeException]
      exception.getMessage should include regex "[Ff]ield `not-exists` not found"
    }
  }

  Feature("tableColumns") {
    Scenario("can extract and return internal table columns") {
      schemaMapper.tableColumns shouldEqual tableColumnsByExternalField.values.toArray
    }
  }

  Feature("toTableRowData") {
    Scenario("can convert an ordered list of external values to a map conforming to internal schema") {
      val rowData = schemaMapper.toTableRowData(List(3, "ric", "type", 10.5))
      rowData shouldEqual Map(
        "id" -> 3,
        "ric" -> "ric",
        "type" -> "type",
        "price" -> 10.5
      )
    }
  }

  Feature("externalSchemaField") {
    Scenario("can get external schema field from internal column name") {
      val f = schemaMapper.externalSchemaField("ric")
      f.get shouldEqual SchemaField("externalRic", classOf[String], 1)
    }
  }

  Feature("tableColumn") {
    Scenario("can get internal column from external field name") {
      val column = schemaMapper.tableColumn("externalRic")
      column.get shouldEqual SimpleColumn("ric", 1, classOf[String])
    }
  }
}

private class TestEntitySchema extends ExternalStoreEntitySchema {
  override def schemaFields: List[SchemaField] = List(
    SchemaField("externalId", classOf[Int], 0),
    SchemaField("externalRic", classOf[String], 1),
    SchemaField("type", classOf[String], 2),
    SchemaField("price", classOf[Double], 3),
  )
}

private object testTableColumnsByExternalField {
  def apply(): Map[String, Column] = {
    Map(
      "externalId" -> SimpleColumn("id", 0, classOf[Int]),
      "externalRic" -> SimpleColumn("ric", 1, classOf[String]),
      "type" -> SimpleColumn("type", 2, classOf[String]),
      "price" -> SimpleColumn("price", 3, classOf[Double]),
    )
  }
}
