package org.finos.vuu.util.schema

import org.finos.vuu.core.module.vui.VuiStateModule.stringToFieldDef
import org.finos.vuu.core.table.{Column, Columns, SimpleColumn}
import org.finos.vuu.util.schema.SchemaMapper.InvalidSchemaMapException
import org.finos.vuu.util.schema.SchemaMapperTest.{externalFields, externalSchema, fieldsMap, fieldsMapWithoutAssetClass, internalColumns}
import org.finos.vuu.util.schema.typeConversion.{TypeConverter, TypeConverterContainerBuilder}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.math.BigDecimal

class SchemaMapperTest extends AnyFeatureSpec with Matchers {

  Feature("toInternalRowMap") {
    Scenario("can convert an ordered list of external values") {
      val mapper = SchemaMapper(externalSchema, internalColumns, fieldsMap)

      val rowData = mapper.toInternalRowMap(List(3, "ric", "assetClass", "10.5"))

      rowData shouldEqual Map(
        "id" -> 3,
        "ric" -> "ric",
        "assetClass" -> "assetClass",
        "price" -> 10.5
      )
    }

    Scenario("can convert ordered list excluding any values not present in the `field->column` map") {
      val mapper = SchemaMapper(externalSchema, internalColumns, fieldsMapWithoutAssetClass)

      val rowData = mapper.toInternalRowMap(List(3, "ric", "assetClass", "10.5"))

      rowData shouldEqual Map(
        "id" -> 3,
        "ric" -> "ric",
        "price" -> 10.5
      )
    }

    Scenario("can convert a case class object containing external values") {
      val mapper = SchemaMapper(externalSchema, internalColumns, fieldsMap)

      val rowData = mapper.toInternalRowMap(TestDto(3, "ric", "assetClass", "10.5"))

      rowData shouldEqual Map(
        "id" -> 3,
        "ric" -> "ric",
        "assetClass" -> "assetClass",
        "price" -> 10.5
      )
    }

    Scenario("can convert a case class object excluding any fields not present in `field->column` map") {
      val mapper = SchemaMapper(externalSchema, internalColumns, fieldsMapWithoutAssetClass)

      val rowData = mapper.toInternalRowMap(TestDto(3, "ric", "assetClass", "10.5"))

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

  Feature("toMappedExternalFieldType") {
    val bigDecimalSchemaField = SchemaField("bigDecimalPrice", classOf[BigDecimal], 0)
    val doubleColumn = SimpleColumn("doublePrice", 0, classOf[Double])
    val schemaMapper = SchemaMapper(
      TestEntitySchema(List(bigDecimalSchemaField)),
      Array(doubleColumn),
      Map("bigDecimalPrice" -> "doublePrice"),
      TypeConverterContainerBuilder()
        .withoutDefaults()
        .withConverter(TypeConverter[BigDecimal, Double](classOf[BigDecimal], classOf[Double], _.doubleValue()))
        .withConverter(TypeConverter[Double, BigDecimal](classOf[Double], classOf[BigDecimal], new BigDecimal(_)))
        .build()
    )

    Scenario("should convert valid column value to external data type") {
      val result = schemaMapper.toMappedExternalFieldType("doublePrice", 10.65)
      result.get shouldEqual new BigDecimal(10.65)
    }

    Scenario("should return empty result if column value is not of the expected type") {
      val result = schemaMapper.toMappedExternalFieldType("doublePrice", "10.65")
      result.isEmpty shouldBe true
    }

    Scenario("should return empty result if column name is not a mapped field") {
      val result = schemaMapper.toMappedExternalFieldType("doubleColumn", 10.65)
      result.isEmpty shouldBe true
    }
  }

  Feature("toMappedInternalColumnType") {
    val bigDecimalSchemaField = SchemaField("bigDecimalPrice", classOf[BigDecimal], 0)
    val doubleColumn = SimpleColumn("doublePrice", 0, classOf[Double])
    val schemaMapper = SchemaMapper(
      TestEntitySchema(List(bigDecimalSchemaField)),
      Array(doubleColumn),
      Map("bigDecimalPrice" -> "doublePrice"),
      TypeConverterContainerBuilder()
        .withoutDefaults()
        .withConverter(TypeConverter[BigDecimal, Double](classOf[BigDecimal], classOf[Double], _.doubleValue()))
        .withConverter(TypeConverter[Double, BigDecimal](classOf[Double], classOf[BigDecimal], new BigDecimal(_)))
        .build()
    )

    Scenario("should convert valid external field value to column data type") {
      val result = schemaMapper.toMappedInternalColumnType("bigDecimalPrice", new BigDecimal(0.3333))
      result.get shouldEqual 0.3333
    }

    Scenario("should return empty result if external field value is not of the expected type") {
      val result = schemaMapper.toMappedInternalColumnType("bigDecimalPrice", 10.65)
      result.isEmpty shouldBe true
    }

    Scenario("should return empty result if external field name is not a mapped field") {
      val result = schemaMapper.toMappedInternalColumnType("bigDecimalField", new BigDecimal(10))
      result.isEmpty shouldBe true
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

    Scenario("fails when types differ b/w mapped fields and type converter is not provided") {
      val emptyTypeConverterContainer = TypeConverterContainerBuilder().withoutDefaults().build()
      val exception = intercept[InvalidSchemaMapException](
        SchemaMapper(externalSchema, internalColumns, fieldsMap, emptyTypeConverterContainer)
      )
      exception.getMessage should include regex ".*TypeConverter.* not found.*"
      exception.message should include("[ java.lang.Double->java.lang.String ]")
      exception.message should include("[ java.lang.String->java.lang.Double ]")
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

private case class TestDto(externalId: Int, externalRic: String, assetClass: String, price: String)

private object SchemaMapperTest {

  // no need to be sorted by their index
  val externalFields: List[SchemaField] = List(
    SchemaField("externalId", classOf[Int], 0),
    SchemaField("assetClass", classOf[String], 2),
    SchemaField("price", classOf[String], 3),
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
