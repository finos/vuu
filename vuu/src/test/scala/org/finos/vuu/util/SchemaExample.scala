package org.finos.vuu.util

import org.finos.vuu.api.{ColumnBuilder, TableDef}
import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.test.{FakeIgniteStore, FakeInMemoryTable, SchemaTestData}
import org.finos.vuu.util.schema.{ExternalEntitySchema, ExternalEntitySchemaBuilder, SchemaMapperBuilder}

class SchemaExample {

  //todo - try in java
  //try more scenarios
  // -  virtual table - filter, type ahead
  // -  error scenarios fetching data or converting types
  //error handling - review api for returning error

  //create table def (use column builder)
  val tableDef = TableDef(
    name = "MyExampleTable",
    keyField = "Id",
    columns = new ColumnBuilder()
      .addString("Id")
      .addDouble("NotionalValue")
      .build
  )

  //todo to respect the QueryEntity order of fields, should be generated  using that?
  //create entity schema
  val externalEntitySchema: ExternalEntitySchema = ExternalEntitySchemaBuilder()
    .withEntity(classOf[SchemaTestData])
    .withIndex("ID_INDEX", List("id"))
    .build()

  //create schema mapper
  private val schemaMapper = SchemaMapperBuilder(externalEntitySchema, tableDef.columns)
    //.withFieldsMap(columnNameByExternalField)
    .build()

  //get data from ignite as list of values
  private val queryName = "myQuery"
  val igniteStore: FakeIgniteStore = new FakeIgniteStore
  igniteStore.setUpSqlFieldsQuery(
    queryName,
    List[List[Any]](
      "id1", 10.5
    )
  )

  val result = igniteStore.getSqlFieldsQuery(queryName)
    .getOrElse(throw new Exception("query does not exist in store. make sure it is setup"))

  // map to entity object - as order of values are relevant to how the query schema was defined
  val tableRowMap1 = result
    .map(rowData => mapToEntity(rowData))
    .map(externalEntity => schemaMapper.toInternalRowMap(externalEntity))

  private val tableRowMap2: Seq[Map[String, Any]] = result.map(rowData => schemaMapper.toInternalRowMap(rowData))

  //map to tablerow
  val keyFieldName = tableDef.keyField
  val tableRows = tableRowMap2.map(rowMap => {
    val keyValue = rowMap(keyFieldName).toString
    RowWithData(keyValue, rowMap)
  })

  //update table with table row?
  var table = new FakeInMemoryTable("SchemaMapTest", tableDef)
  tableRows.foreach(row => table.processUpdate(row.key, row))

  //assert on reading the table row - is that possible or need to use mock table with table interface
  var existingRows = table.pullAllRows()

  //todo different for java
  private def mapToEntity(rowData: List[Any]): SchemaTestData =
    getListToObjectConverter[SchemaTestData](SchemaTestData)(rowData)


}
//copy of one in org.finos.vuu.example.ignite.utils
//todo if not going to use or move to common place
object getListToObjectConverter {
  def apply[ReturnType](obj: Object): List[_] => ReturnType = {
    val converter = obj.getClass.getMethods.find(x => x.getName == "apply" && x.isBridge).get
    values => converter.invoke(obj, values.map(_.asInstanceOf[AnyRef]): _*).asInstanceOf[ReturnType]
  }
}


