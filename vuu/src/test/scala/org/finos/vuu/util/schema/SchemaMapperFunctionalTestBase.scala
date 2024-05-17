package org.finos.vuu.util.schema

import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.api.TableDef
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.test.FakeDataSource
import org.scalatest.BeforeAndAfterEach
import org.scalatest.featurespec.AnyFeatureSpec

class SchemaMapperFunctionalTestBase extends AnyFeatureSpec with BeforeAndAfterEach {

  protected val fakeDataSource: FakeDataSource[SchemaTestData] = new FakeDataSource[SchemaTestData]
  protected var queryName: String = "myQuery"
  private val clock = new TestFriendlyClock(10001L)

  override def beforeEach(): Unit = {
    queryName += java.util.UUID.randomUUID.toString // unique query name for each test run
  }

  protected def getDataAndUpdateTable(table: DataTable, schemaMapper: SchemaMapper, queryName: String): Unit = {
    val result = getQueryResult(queryName)
    val rows = mapToRows(result, schemaMapper, table.getTableDef)
    rows.foreach(row => table.processUpdate(row.key, row, clock.now()))
  }

  protected def givenQueryReturns(queryName: String, results: List[List[Any]]): Unit = {
    fakeDataSource.setUpResultAsListOfValues(queryName, results)
  }

  private def getQueryResult(queryName: String): List[List[Any]] = {
    fakeDataSource.getAsListOfValues(queryName)
      .getOrElse(throw new Exception("query does not exist in store. make sure it is setup"))
  }

  private def mapToRows(resultData: List[List[Any]], schemaMapper: SchemaMapper, tableDef: TableDef): Seq[RowWithData] = {

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

  protected def createExternalEntitySchema: ExternalEntitySchema =
    ExternalEntitySchemaBuilder()
      .withEntity(classOf[SchemaTestData])
      .withIndex("ID_INDEX", List("id"))
      .build()


  //todo try more scenarios
  // -  virtual table - include filter, type ahead

  //todo to respect the QueryEntity order of fields, if it is different from order of fields on the entity class, should be generated using that?
  //error scenarios fetching data or converting types - review api for returning error
  //todo when query result has less number of fields than table column
  //todo when fields and column diff order but no mapping specified - assert on error message being useful


  //  //todo different for java
  //  private def mapToEntity(rowData: List[Any]): SchemaTestData =
  //    getListToObjectConverter[SchemaTestData](SchemaTestData)(rowData)

}

//copy of one in org.finos.vuu.example.ignite.utils
////todo if not going to use or move to common place
//object getListToObjectConverter {
//  def apply[ReturnType](obj: Object): List[_] => ReturnType = {
//    val converter = obj.getClass.getMethods.find(x => x.getName == "apply" && x.isBridge).get
//    values => converter.invoke(obj, values.map(_.asInstanceOf[AnyRef]): _*).asInstanceOf[ReturnType]
//  }
//}

case class SchemaTestData(id :String, clientId:Int, notionalValue: Double) {}