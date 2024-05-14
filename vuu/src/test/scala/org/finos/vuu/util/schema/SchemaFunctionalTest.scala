package org.finos.vuu.util.schema

import org.finos.vuu.api.{ColumnBuilder, TableDef}
import org.finos.vuu.util.{SchemaExample, SchemaTestData}
import org.scalatest.featurespec.AnyFeatureSpec
class SchemaFunctionalTest extends AnyFeatureSpec {

  Feature("Update in memory table using schema mapper") {
    Scenario("When table columns and entity fields match exactly") {

      val tableDef = TableDef(
        name = "MyExampleTable",
        keyField = "id",
        columns = new ColumnBuilder()
          .addString("id")
          .addInt("clientId")
          .addDouble("notionalValue")
          .build()
      )

      //todo to respect the QueryEntity order of fields, if it is different from order of fields on the entity class, should be generated using that?
      val externalEntitySchema: ExternalEntitySchema = ExternalEntitySchemaBuilder()
        .withEntity(classOf[SchemaTestData])
        .withIndex("ID_INDEX", List("id"))
        .build()

      //create schema mapper
      val schemaMapper = SchemaMapperBuilder(externalEntitySchema, tableDef.columns)
        //.withFieldsMap(columnNameByExternalField)
        .build()

      val example = new SchemaExample(tableDef, schemaMapper)

      val queryName = "myQuery"
      example.givenIgniteSqlFieldQueryReturns(queryName, List(List("testId1", 5, 10.5)))

      val result = example.getIgniteQueryResult(queryName)
      val rows = example.mapToRow(result)
      rows.foreach(row => example.table.processUpdate(row.key, row))

      val existingTableRows = example.table.pullAllRows()

      assert(existingTableRows.size == 1)
      assert(existingTableRows.head.get("id") == "testId1")
      assert(existingTableRows.head.get("clientId") == 5)
      assert(existingTableRows.head.get("notionalValue") == 10.5)
    }

    Scenario("When table has fewer columns than fields on external entity") {

      val tableDef = TableDef(
        name = "MyExampleTable",
        keyField = "id",
        columns = new ColumnBuilder()
          .addString("id")
          .addDouble("notionalValue")
          .build()
      )

      val externalEntitySchema: ExternalEntitySchema = ExternalEntitySchemaBuilder()
        .withEntity(classOf[SchemaTestData])
        .withIndex("ID_INDEX", List("id"))
        .build()

      val schemaMapper = SchemaMapperBuilder(externalEntitySchema, tableDef.columns)
        .withFieldsMap(
          Map(
            "id" -> "id",
            "notionalValue" -> "notionalValue",
          )
        )
        .build()

      val example = new SchemaExample(tableDef, schemaMapper)

      val queryName = "myQuery"
      example.givenIgniteSqlFieldQueryReturns(queryName, List(List("testId1", 5, 10.5)))

      val result = example.getIgniteQueryResult(queryName)
      val rows = example.mapToRow(result)
      rows.foreach(row => example.table.processUpdate(row.key, row))

      val existingTableRows = example.table.pullAllRows()


      assert(existingTableRows.size == 1)
      assert(existingTableRows.head.get("id") == "testId1")
      assert(existingTableRows.head.get("notionalValue") == 10.5)
    }

    Scenario("When table has columns with different name than fields on external entity") {

      val tableDef = TableDef(
        name = "MyExampleTable",
        keyField = "firstColumn",
        columns = new ColumnBuilder()
          .addString("firstColumn")
          .addInt("secondColumn")
          .addDouble("thirdColumn")
          .build()
      )

      val externalEntitySchema: ExternalEntitySchema = ExternalEntitySchemaBuilder()
        .withEntity(classOf[SchemaTestData])
        .withIndex("ID_INDEX", List("id"))
        .build()

      val schemaMapper = SchemaMapperBuilder(externalEntitySchema, tableDef.columns)
        .build()

      val example = new SchemaExample(tableDef, schemaMapper)

      val queryName = "myQuery"
      example.givenIgniteSqlFieldQueryReturns(queryName, List(List("testId1", 5, 10.5)))

      val result = example.getIgniteQueryResult(queryName)
      val rows = example.mapToRow(result)
      rows.foreach(row => example.table.processUpdate(row.key, row))

      val existingTableRows = example.table.pullAllRows()

      assert(existingTableRows.size == 1)
      assert(existingTableRows.head.get("firstColumn") == "testId1")
      assert(existingTableRows.head.get("secondColumn") == 5)
      assert(existingTableRows.head.get("thirdColumn") == 10.5)
    }

    Scenario("When table has columns are in different order from fields on external entity") {

      val tableDef = TableDef(
        name = "MyExampleTable",
        keyField = "id",
        columns = new ColumnBuilder()
          .addDouble("notionalValue")
          .addString("id")
          .addInt("clientId")
          .build()
      )

      val externalEntitySchema: ExternalEntitySchema = ExternalEntitySchemaBuilder()
        .withEntity(classOf[SchemaTestData])
        .withIndex("ID_INDEX", List("id"))
        .build()

      val schemaMapper = SchemaMapperBuilder(externalEntitySchema, tableDef.columns)
        .withFieldsMap(
          Map(
            "notionalValue" -> "notionalValue",
            "id" -> "id",
            "clientId" -> "clientId",
          )
        )
        .build()

      val example = new SchemaExample(tableDef, schemaMapper)

      val queryName = "myQuery"
      example.givenIgniteSqlFieldQueryReturns(queryName, List(List("testId1", 5, 10.5)))

      val result = example.getIgniteQueryResult(queryName)
      val rows = example.mapToRow(result)
      rows.foreach(row => example.table.processUpdate(row.key, row))

      val existingTableRows = example.table.pullAllRows()

      assert(existingTableRows.size == 1)
      assert(existingTableRows.head.get("id") == "testId1")
      assert(existingTableRows.head.get("clientId") == 5)
      assert(existingTableRows.head.get("notionalValue") == 10.5)
    }
  }
}
