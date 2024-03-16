package org.finos.vuu.util.schema

import org.finos.vuu.core.module.vui.VuiStateModule.stringToFieldDef
import org.finos.vuu.core.table.{Column, Columns, SimpleColumn}
import org.finos.vuu.util.schema.SchemaMapper.InvalidSchemaMapException
import org.finos.vuu.util.schema.SchemaMapperTest.{externalFields, externalSchema, fieldsMap, fieldsMapWithoutAssetClass, internalColumns}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class SchemaMapperTest extends AnyFeatureSpec with Matchers {

  Feature("toInternalRowMap") {
    Scenario("can convert an ordered list of external values") {
      val mapper = SchemaMapper(externalSchema, internalColumns, fieldsMap)

      val rowData = mapper.toInternalRowMap(List(3, "ric", "assetClass", 10.5))

      rowData shouldEqual Map(
        "id" -> 3,
        "ric" -> "ric",
        "assetClass" -> "assetClass",
        "price" -> 10.5
      )
    }

    Scenario("can convert ordered list excluding any values not present in the `field->column` map") {
      val mapper = SchemaMapper(externalSchema, internalColumns, fieldsMapWithoutAssetClass)

      val rowData = mapper.toInternalRowMap(List(3, "ric", "assetClass", 10.5))

      rowData shouldEqual Map(
        "id" -> 3,
        "ric" -> "ric",
        "price" -> 10.5
      )
    }

    Scenario("can convert a case class object containing external values") {
      val mapper = SchemaMapper(externalSchema, internalColumns, fieldsMap)

      val rowData = mapper.toInternalRowMap(TestDto(3, "ric", "assetClass", 10.5))

      rowData shouldEqual Map(
        "id" -> 3,
        "ric" -> "ric",
        "assetClass" -> "assetClass",
        "price" -> 10.5
      )
    }

    Scenario("can convert a case class object excluding any fields not present in `field->column` map") {
      val mapper = SchemaMapper(externalSchema, internalColumns, fieldsMapWithoutAssetClass)

      val rowData = mapper.toInternalRowMap(TestDto(3, "ric", "assetClass", 10.5))

      rowData shouldEqual Map(
        "id" -> 3,
        "ric" -> "ric",
        "price" -> 10.5
      )
    }
  }

  Feature("externalSchemaField") {
    val mapper = SchemaMapper(externalSchema, internalColumns, fieldsMapWithoutAssetClass)

    Scenario("can get external schema field from internal column name") {
      val field = mapper.externalSchemaField("ric")
      field.get shouldEqual SchemaField("externalRic", classOf[String], 1)
    }

    Scenario("returns None if column not present in the mapped fields") {
      val field = mapper.externalSchemaField("assetClass")
      field shouldEqual None
    }
  }

  Feature("tableColumn") {
    val mapper = SchemaMapper(externalSchema, internalColumns, fieldsMapWithoutAssetClass)

    Scenario("can get internal column from external field name") {
      val column = mapper.tableColumn("externalRic")
      column.get shouldEqual SimpleColumn("ric", 1, classOf[String])
    }

    Scenario("returns None if external field not present in the mapped fields") {
      val column = mapper.tableColumn("assetClass")
      column shouldEqual None
    }
  }


  Feature("validation on instantiation") {
    Scenario("fails when mapped external field not found in external schema") {
      val exception = intercept[InvalidSchemaMapException](
        SchemaMapper(externalSchema, Columns.fromNames("ric".int()), Map("non-existent" -> "ric"))
      )
      exception shouldBe a[RuntimeException]
      exception.getMessage should include regex s"[Ff]ield `non-existent` not found"
    }

    Scenario("fails when mapped internal field not found in internal columns") {
      val exception = intercept[InvalidSchemaMapException](
        SchemaMapper(externalSchema, Columns.fromNames("id".int()), Map("externalId" -> "absent-col"))
      )
      exception shouldBe a[RuntimeException]
      exception.getMessage should include regex "[Cc]olumn `absent-col` not found"
    }

    Scenario("fails when external->internal map contains duplicated internal fields") {
      val exception = intercept[InvalidSchemaMapException](SchemaMapper(
        externalSchema,
        Columns.fromNames("id".int(), "ric".string()),
        Map("externalId" -> "id", "externalRic" -> "id")
      ))
      exception shouldBe a[RuntimeException]
      exception.getMessage should include("duplicated column names")
    }
  }

  Feature("SchemaMapper.apply without user-defined fields map") {
    Scenario("can generate mapper with exact fields matched by index") {
      val mapper = SchemaMapper(externalSchema, internalColumns)

      mapper.tableColumn("externalId").get.name shouldEqual "id"
      mapper.tableColumn("externalRic").get.name shouldEqual "ric"
      mapper.tableColumn("assetClass").get.name shouldEqual "assetClass"
      mapper.tableColumn("price").get.name shouldEqual "price"
    }

    Scenario("can generate mapper when an external field has no matched column") {
      val mapper = SchemaMapper(externalSchema, internalColumns.slice(0, 3))

      mapper.tableColumn("externalId") shouldBe empty
      mapper.tableColumn("externalRic").get.name shouldEqual "ric"
      mapper.tableColumn("assetClass").get.name shouldEqual "assetClass"
      mapper.tableColumn("price").get.name shouldEqual "price"
    }

    Scenario("can generate mapper when a column has no matched external field") {
      val mapper = SchemaMapper(TestEntitySchema(externalFields.slice(0, 3)), internalColumns)

      mapper.tableColumn("externalId").get.name shouldEqual "id"
      mapper.tableColumn("externalRic") shouldBe empty
      mapper.tableColumn("assetClass").get.name shouldBe  "assetClass"
      mapper.tableColumn("price").get.name shouldEqual "price"
    }
  }
}

private case class TestEntitySchema(override val fields: List[SchemaField]) extends ExternalEntitySchema

private case class TestDto(externalId: Int, externalRic: String, assetClass: String, price: Double)

private object SchemaMapperTest {

  // no need to be sorted by their index
  val externalFields: List[SchemaField] = List(
    SchemaField("externalId", classOf[Int], 0),
    SchemaField("assetClass", classOf[String], 2),
    SchemaField("price", classOf[Double], 3),
    SchemaField("externalRic", classOf[String], 1),
  )

  val externalSchema: TestEntitySchema = TestEntitySchema(externalFields)

  val internalColumns: Array[Column] = {
    val columns = Columns.fromNames(
      "id".int(),
      "ric".string(),
      "assetClass".string(),
      "price".double(),
    )
    // no need to be sorted by their index
    columns.tail.appended(columns.head)
  }

  val fieldsMap: Map[String, String] = Map(
    "externalId" -> "id",
    "externalRic" -> "ric",
    "price" -> "price",
    "assetClass" -> "assetClass"
  )

  val fieldsMapWithoutAssetClass: Map[String, String] = fieldsMap.slice(0, 3)
}
