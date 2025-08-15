package org.finos.vuu.util.schema

import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.test.FakeDataSource
import org.scalatest.BeforeAndAfterEach
import org.scalatest.featurespec.AnyFeatureSpec

class SchemaMapperFunctionalTestBase extends AnyFeatureSpec with BeforeAndAfterEach {

  protected val fakeDataSource: FakeDataSource[SchemaTestData] = new FakeDataSource[SchemaTestData]
  protected var queryName: String = "myQuery"

  override def beforeEach(): Unit = {
    queryName += java.util.UUID.randomUUID.toString // unique query name for each test run
  }

  protected def getDataAndUpdateTable(table: DataTable, schemaMapper: SchemaMapper, queryName: String): Unit = {
    val keyFieldName = table.getTableDef.keyField

    getQueryResult(queryName)
      .map(rowValues => mapToRow(schemaMapper, keyFieldName, rowValues))
      .foreach(row => table.processUpdate(row.key, row))
  }

  private def mapToRow(schemaMapper: SchemaMapper, keyFieldName: String, rowValues: List[Any]) = {
    val rowMap = schemaMapper.toInternalRowMap(rowValues)
    val keyValue = rowMap(keyFieldName).toString
    RowWithData(keyValue, rowMap)
  }

  protected def givenQueryReturns(queryName: String, results: List[List[Any]]): Unit = {
    fakeDataSource.setUpResultAsListOfValues(queryName, results)
  }

  private def getQueryResult(queryName: String): List[List[Any]] = {
    fakeDataSource.getAsListOfValues(queryName)
      .getOrElse(throw new Exception("query does not exist in store. make sure it is setup"))
  }

  protected def givenColumnQueryReturns(queryName: String, columnName:String, results: Array[String]): Unit = {
    fakeDataSource.setUpResultGivenColumn(queryName, columnName, results)
  }

  protected def createExternalEntitySchema: ExternalEntitySchema =
    ExternalEntitySchemaBuilder()
      .withEntity(classOf[SchemaTestData])
      .withIndex("ID_INDEX", List("id"))
      .build()
}

case class SchemaTestData(id: String, clientId: Int, notionalValue: Double) {}