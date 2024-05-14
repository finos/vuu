package org.finos.vuu.util

import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.RowWithData
import org.finos.vuu.test.{FakeIgniteStore, FakeInMemoryTable}
import org.finos.vuu.util.schema.SchemaMapper

class SchemaExample(val tableDef: TableDef, schemaMapper: SchemaMapper) {

  val igniteStore: FakeIgniteStore[SchemaTestData] = new FakeIgniteStore[SchemaTestData]
  var table = new FakeInMemoryTable("SchemaMapTest", tableDef)

  //todo try more scenarios
  // -  virtual table - include filter, type ahead
  // -  error scenarios fetching data or converting types - review api for returning error
  // - example of generating table Def from an class rather than using column builder? maybe more of a unit teest/example for table def?

  //todo when query result has less number of fields than table column
  //todo when fields and column diff order but no mapping specified - assert on error message being useful


  //todo make it not specific to ignite? type the results more?
  def givenIgniteSqlFieldQueryReturns(queryName: String, results: List[List[Any]]): Unit = {
    igniteStore.setUpSqlFieldsQuery(queryName, results)
  }

  def getIgniteQueryResult(queryName: String): List[List[Any]] = {
    igniteStore.getSqlFieldsQuery(queryName)
      .getOrElse(throw new Exception("query does not exist in store. make sure it is setup"))
  }

  def mapToRow(resultData: List[List[Any]]): Seq[RowWithData] = {

    // map to entity object - as order of values are relevant to how the query schema was defined
    //todo two options, is direct to row map better if query result returns values?
//    val tableRowMap1 = resultData
//      .map(rowData => mapToEntity(rowData))
//      .map(externalEntity => schemaMapper.toInternalRowMap(externalEntity))

    val tableRowMap2: Seq[Map[String, Any]] =
      resultData.map(rowData => schemaMapper.toInternalRowMap(rowData))

    //map to tablerow
    val keyFieldName = tableDef.keyField
    tableRowMap2.map(rowMap => {
      val keyValue = rowMap(keyFieldName).toString
      RowWithData(keyValue, rowMap)
    })
  }

  def updateTable(rows: Seq[RowWithData]): Unit = {
    rows.foreach(row => table.processUpdate(row.key, row))
  }

  def getExitingRows() = {
    table.pullAllRows()
  }

//  //todo different for java
//  private def mapToEntity(rowData: List[Any]): SchemaTestData =
//    getListToObjectConverter[SchemaTestData](SchemaTestData)(rowData)

}

//copy of one in org.finos.vuu.example.ignite.utils
//todo if not going to use or move to common place
object getListToObjectConverter {
  def apply[ReturnType](obj: Object): List[_] => ReturnType = {
    val converter = obj.getClass.getMethods.find(x => x.getName == "apply" && x.isBridge).get
    values => converter.invoke(obj, values.map(_.asInstanceOf[AnyRef]): _*).asInstanceOf[ReturnType]
  }
}

case class SchemaTestData(id :String, clientId:Int, notionalValue: Double) {}


