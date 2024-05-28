package org.finos.vuu.util.schema

import org.finos.vuu.core.table.{Column, SimpleColumn}
import org.finos.vuu.util.schema.SchemaMapper.InvalidSchemaMapException
import org.finos.vuu.util.schema.SchemaMapperTest.{column, externalSchema, fieldsMap, fieldsMapWithoutAssetClass, givenColumns, givenExternalSchema, internalColumns, schemaField}
import org.finos.vuu.util.types.{TypeConverter, TypeConverterContainerBuilder}
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.math.BigDecimal

class SchemaMapperTest extends AnyFeatureSpec with Matchers {

  Feature("toInternalRowMap") {
    Scenario("can convert an ordered list of external values") {
      val mapper = SchemaMapperBuilder(externalSchema, internalColumns).withFieldsMap(fieldsMap).build()

      val rowData = mapper.toInternalRowMap(List(3, "ric", "assetClass", "10.5", 'B'))

      rowData shouldEqual Map(
        "id" -> 3,
        "ric" -> "ric",
        "assetClass" -> "assetClass",
        "price" -> 10.5,
        "side" -> 'B'
      )
    }

    Scenario("can convert ordered list excluding any values not present in the `field->column` map") {
      val mapper = SchemaMapperBuilder(externalSchema, internalColumns)
        .withFieldsMap(fieldsMapWithoutAssetClass)
        .build()

      val rowData = mapper.toInternalRowMap(List(3, "ric", "assetClass", "10.5", 'B'))

      rowData shouldEqual Map(
        "id" -> 3,
        "ric" -> "ric",
        "price" -> 10.5,
        "side" -> 'B'
      )
    }

    Scenario("can convert a case class object containing external values") {
      val mapper = SchemaMapperBuilder(externalSchema, internalColumns).withFieldsMap(fieldsMap).build()

      val rowData = mapper.toInternalRowMap(TestDto(3, "ric", "assetClass", "10.5", 'S'))

      rowData shouldEqual Map(
        "id" -> 3,
        "ric" -> "ric",
        "assetClass" -> "assetClass",
        "price" -> 10.5,
        "side" -> 'S'
      )
    }

    Scenario("can convert a case class object excluding any fields not present in `field->column` map") {
      val mapper = SchemaMapperBuilder(externalSchema, internalColumns).withFieldsMap(fieldsMapWithoutAssetClass).build()

      val rowData = mapper.toInternalRowMap(TestDto(3, "ric", "assetClass", "10.5", 'S'))

      rowData shouldEqual Map(
        "id" -> 3,
        "ric" -> "ric",
        "price" -> 10.5,
        "side" -> 'S',
      )
    }
  }

  Feature("externalSchemaField") {
    val mapper = SchemaMapperBuilder(externalSchema, internalColumns)
      .withFieldsMap(fieldsMapWithoutAssetClass)
      .build()

    Scenario("can get external schema field from internal column name") {
      val field = mapper.externalSchemaField("ric")
      field.get shouldEqual SchemaField("externalRic", classOf[String], 1)
    }

    Scenario("returns None if column not present in mapped fields") {
      val field = mapper.externalSchemaField("assetClass")
      field shouldEqual None
    }
  }

  Feature("internalVuuColumn") {
    val mapper = SchemaMapperBuilder(externalSchema, internalColumns)
      .withFieldsMap(fieldsMapWithoutAssetClass)
      .build()

    Scenario("can get internal column from external field name") {
      val column = mapper.internalVuuColumn("externalRic")
      column.get shouldEqual SimpleColumn("ric", 1, classOf[String])
    }

    Scenario("returns None if external field not present in mapped fields") {
      val column = mapper.internalVuuColumn("assetClass")
      column shouldEqual None
    }
  }

  Feature("toMappedExternalFieldType") {
    val bigDecimalSchemaField = schemaField("bigDecimalPrice", classOf[BigDecimal], 0)
    val doubleColumn = column("doublePrice", classOf[Double], 0)
    val tcContainer = TypeConverterContainerBuilder().withoutDefaults()
      .withConverter(TypeConverter[BigDecimal, Double](classOf[BigDecimal], classOf[Double], _.doubleValue()))
      .withConverter(TypeConverter[Double, BigDecimal](classOf[Double], classOf[BigDecimal], new BigDecimal(_)))
      .build()
    val schemaMapper = SchemaMapperBuilder(givenExternalSchema(bigDecimalSchemaField), givenColumns(doubleColumn))
      .withFieldsMap(Map("bigDecimalPrice" -> "doublePrice"))
      .withTypeConverters(tcContainer)
      .build()

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
    val bigDecimalSchemaField = schemaField("bigDecimalPrice", classOf[BigDecimal], 0)
    val doubleColumn = column("doublePrice", classOf[Double], 0)
    val tcContainer = TypeConverterContainerBuilder().withoutDefaults()
      .withConverter(TypeConverter[BigDecimal, Double](classOf[BigDecimal], classOf[Double], _.doubleValue()))
      .withConverter(TypeConverter[Double, BigDecimal](classOf[Double], classOf[BigDecimal], new BigDecimal(_)))
      .build()
    val schemaMapper = SchemaMapperBuilder(givenExternalSchema(bigDecimalSchemaField), givenColumns(doubleColumn))
      .withFieldsMap(Map("bigDecimalPrice" -> "doublePrice"))
      .withTypeConverters(tcContainer)
      .build()

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
      val externalSchema = givenExternalSchema(schemaField("externalId"))
      val columns = givenColumns(column("ric"))

      val exception = intercept[InvalidSchemaMapException](
        SchemaMapperBuilder(externalSchema, columns).withFieldsMap(Map("externalRic" -> "ric")).build()
      )

      exception shouldBe a[RuntimeException]
      exception.getMessage should include regex s"[Ff]ield `externalRic` not found"
    }

    Scenario("fails when mapped internal field not found in internal columns") {
      val externalSchema = givenExternalSchema(schemaField("externalId"))
      val columns = givenColumns(column("ric"))

      val exception = intercept[InvalidSchemaMapException](
        SchemaMapperBuilder(externalSchema, columns).withFieldsMap(Map("externalId" -> "id")).build()
      )

      exception shouldBe a[RuntimeException]
      exception.getMessage should include regex "[Cc]olumn `id` not found"
    }

    Scenario("fails when external->internal map contains duplicated internal fields") {
      val externalSchema = givenExternalSchema(schemaField("externalId"), schemaField("parentId"))
      val columns = givenColumns(column("id"))

      val exception = intercept[InvalidSchemaMapException](
        SchemaMapperBuilder(externalSchema, columns).withFieldsMap(Map("externalId" -> "id", "parentId" -> "id")).build()
      )

      exception shouldBe a[RuntimeException]
      exception.getMessage should include("duplicated column names")
    }

    Scenario("fails when types differ b/w mapped fields and type converter is not provided") {
      val externalSchema = givenExternalSchema(schemaField("externalId", classOf[Long], index = 0))
      val columns = givenColumns(column("id", classOf[String], index = 0))
      val emptyTypeConverterContainer = TypeConverterContainerBuilder().withoutDefaults().build()

      val exception = intercept[InvalidSchemaMapException](
        SchemaMapperBuilder(externalSchema, columns)
          .withFieldsMap(Map("externalId" -> "id"))
          .withTypeConverters(emptyTypeConverterContainer)
          .build()
      )

      exception.getMessage should include regex ".*TypeConverter.* not found.*"
      exception.message should include("[ java.lang.Long->java.lang.String ]")
      exception.message should include("[ java.lang.String->java.lang.Long ]")
    }
  }

  Feature("Build schema mapper without user-defined fields map") {
    Scenario("can generate mapper with exact fields matched by index") {
      val externalSchema = givenExternalSchema(schemaField("externalId", index = 0), schemaField("priceExt", index = 1))
      val columns = givenColumns(column("id", index = 0), column("price", index = 1))

      val mapper = SchemaMapperBuilder(externalSchema, columns).build()

      mapper.internalVuuColumn("externalId").get.name shouldEqual "id"
      mapper.internalVuuColumn("priceExt").get.name shouldEqual "price"
    }

    Scenario("can generate mapper with exact fields even when the fields are not ordered by their index") {
      val externalSchema = givenExternalSchema(schemaField("priceExt", index = 1), schemaField("externalId", index = 0))
      val columns = givenColumns(column("id", index = 0), column("price", index = 1))

      val mapper = SchemaMapperBuilder(externalSchema, columns).build()

      mapper.internalVuuColumn("externalId").get.name shouldEqual "id"
      mapper.internalVuuColumn("priceExt").get.name shouldEqual "price"
    }

    Scenario("can generate mapper when an external field has no matched column") {
      val externalSchema = givenExternalSchema(schemaField("priceExt", index = 1), schemaField("externalId", index = 0))
      val columns = givenColumns(column("id", index = 0))

      val mapper = SchemaMapperBuilder(externalSchema, columns).build()

      mapper.internalVuuColumn("externalId").get.name shouldEqual "id"
      mapper.internalVuuColumn("priceExt") shouldBe empty
    }

    Scenario("can generate mapper when a column has no matched external field") {
      val externalSchema = givenExternalSchema(schemaField("priceExt", index = 1))
      val columns = givenColumns(column("id", index = 0), column("price", index = 1))

      val mapper = SchemaMapperBuilder(externalSchema, columns).build()

      mapper.externalSchemaField("price").get.name shouldEqual "priceExt"
      mapper.externalSchemaField("id") shouldBe empty
    }
  }
}

private case class TestEntitySchema(override val fields: List[SchemaField]) extends ExternalEntitySchema

private case class TestDto(externalId: Int, externalRic: String, assetClass: String, price: String, side: java.lang.Character)

private object SchemaMapperTest {

  private def givenExternalSchema(fields: SchemaField*): ExternalEntitySchema = TestEntitySchema(fields.toList)

  private def schemaField(name: String, dataType: Class[_] = classOf[Any], index: Int = -1): SchemaField =
    SchemaField(name, dataType, index)

  private def givenColumns(columns: Column*): Array[Column] = columns.toArray

  private def column(name: String, dataType: Class[_] = classOf[Any], index: Int = -1): Column =
    SimpleColumn(name, index, dataType)

  private val externalFields: List[SchemaField] = List(
    schemaField("externalId", classOf[Int], 0),
    schemaField("externalRic", classOf[String], 1),
    schemaField("assetClass", classOf[String], 2),
    schemaField("price", classOf[String], 3),
    schemaField("side", classOf[java.lang.Character], 4),
  )

  private val externalSchema: ExternalEntitySchema = givenExternalSchema(externalFields: _*)

  private val internalColumns: Array[Column] = givenColumns(
    column("id", classOf[Int], 0),
    column("ric", classOf[String], 1),
    column("assetClass", classOf[String], 2),
    column("price", classOf[Double], 3),
    column("side", classOf[Char], 4),
  )

  private val fieldsMap: Map[String, String] = Map(
    "externalId" -> "id",
    "externalRic" -> "ric",
    "price" -> "price",
    "assetClass" -> "assetClass",
    "side" -> "side",
  )

  private val fieldsMapWithoutAssetClass: Map[String, String] = fieldsMap.filter({ case (k, _) => k != "assetClass"})
}
