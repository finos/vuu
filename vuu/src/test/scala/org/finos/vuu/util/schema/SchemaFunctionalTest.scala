package org.finos.vuu.util.schema

import org.finos.vuu.api.{ColumnBuilder, TableDef}
import org.finos.vuu.test.SchemaTestData
import org.finos.vuu.util.SchemaExample
import org.scalatest.featurespec.AnyFeatureSpec
class SchemaFunctionalTest extends AnyFeatureSpec {

  Feature("Schema Functional test") {
    Scenario("Manually define table columns, Generate external schema from class object, use default index based mapping and update in memory table") {

      val tableDef = TableDef(
        name = "MyExampleTable",
        keyField = "Id",
        columns = new ColumnBuilder()
          .addString("Id")
          .addDouble("NotionalValue")
          .build()
      )

      //todo to respect the QueryEntity order of fields, if it is different from order of fields on the entity class, should be generated using that?
      val externalEntitySchema: ExternalEntitySchema = ExternalEntitySchemaBuilder()
        .withEntity(classOf[SchemaTestData])
        .withIndex("ID_INDEX", List("Id"))
        .build()

      //create schema mapper
      val schemaMapper = SchemaMapperBuilder(externalEntitySchema, tableDef.columns)
        //.withFieldsMap(columnNameByExternalField)
        .build()


      val example = new SchemaExample(tableDef, schemaMapper)

      val queryName = "myQuery"
      example.givenIgniteSqlFieldQueryReturns(queryName, List(List("id1", 10.5)))

      val result = example.getIgniteQueryResult(queryName)
      val rows = example.mapToRow(result)
      rows.foreach(row => example.table.processUpdate(row.key, row))

      val existingTableRows = example.table.pullAllRows()

      assert(existingTableRows.size == 1)
      assert(existingTableRows.head.get("NotionalValue") == 10.5)

    }
  }
}
