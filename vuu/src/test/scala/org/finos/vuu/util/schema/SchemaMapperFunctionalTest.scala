package org.finos.vuu.util.schema

import org.finos.vuu.api.{ColumnBuilder, TableDef}
import org.finos.vuu.core.table.Columns
import org.finos.vuu.test.FakeInMemoryTable

class SchemaMapperFunctionalTest extends SchemaMapperFunctionalTestBase {

  Feature("Update in memory table using schema mapper") {
    Scenario("When table columns and entity fields match exactly") {

      val externalEntitySchema: ExternalEntitySchema = createExternalEntitySchema
      val tableDef = TableDef(
        name = "MyExampleTable",
        keyField = "id",
        columns = Columns.fromExternalSchema(externalEntitySchema)
      )
      val schemaMapper = SchemaMapperBuilder(externalEntitySchema, tableDef.columns)
        .build()
      val table = new FakeInMemoryTable("SchemaMapTest", tableDef)
      givenQueryReturns(queryName, List(List("testId1", 5, 10.5)))

      getDataAndUpdateTable(table, schemaMapper, queryName)

      val existingTableRows = table.pullAllRows()
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
      val externalEntitySchema: ExternalEntitySchema = createExternalEntitySchema
      val schemaMapper = SchemaMapperBuilder(externalEntitySchema, tableDef.columns)
        .withFieldsMap(
          Map(
            "id" -> "id",
            "notionalValue" -> "notionalValue",
          )
        )
        .build()
      val table = new FakeInMemoryTable("SchemaMapTest", tableDef)
      givenQueryReturns(queryName, List(List("testId1", 5, 10.5)))

      getDataAndUpdateTable(table, schemaMapper, queryName)

      val existingTableRows = table.pullAllRows()
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
      val externalEntitySchema: ExternalEntitySchema = createExternalEntitySchema
      val schemaMapper = SchemaMapperBuilder(externalEntitySchema, tableDef.columns)
        .build()
      val table = new FakeInMemoryTable("SchemaMapTest", tableDef)
      givenQueryReturns(queryName, List(List("testId1", 5, 10.5)))

      getDataAndUpdateTable(table, schemaMapper, queryName)

      val existingTableRows = table.pullAllRows()
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
      val externalEntitySchema: ExternalEntitySchema = createExternalEntitySchema
      val schemaMapper = SchemaMapperBuilder(externalEntitySchema, tableDef.columns)
        .withFieldsMap(
          Map(
            "notionalValue" -> "notionalValue",
            "id" -> "id",
            "clientId" -> "clientId",
          )
        )
        .build()
      val table = new FakeInMemoryTable("SchemaMapTest", tableDef)
      givenQueryReturns(queryName, List(List("testId1", 5, 10.5)))

      getDataAndUpdateTable(table, schemaMapper, queryName)

      val existingTableRows = table.pullAllRows()
      assert(existingTableRows.size == 1)
      assert(existingTableRows.head.get("id") == "testId1")
      assert(existingTableRows.head.get("clientId") == 5)
      assert(existingTableRows.head.get("notionalValue") == 10.5)
    }
  }

  Scenario("When table has columns are different type from fields on external entity") {}
  Scenario("When query result has less number of fields than table columns return useful error") {}
  Scenario("When column and field order does not match but no fields map defined on schema return useful error") {}
  Scenario("When getting data from source fails return useful error") {}
  Scenario("When getting casting data from source to table column type fails return useful error") {}


}