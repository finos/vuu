package org.finos.vuu.example.ignite

import org.finos.vuu.api.{ColumnBuilder, TableDef}
import org.finos.vuu.core.index.IndexedField
import org.finos.vuu.core.table.{Column, ColumnValueProvider, DataTable, KeyObserver, RowData, RowKeyUpdate, RowWithData, TableData, TablePrimaryKeys}
import org.finos.vuu.example.ignite.utils.getListToObjectConverter
import org.finos.vuu.util.schema.{ExternalEntitySchema, ExternalEntitySchemaBuilder, SchemaMapperBuilder}
import org.finos.vuu.viewport.{RowProcessor, ViewPortColumns}

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

  //create entity schema
 val externalEntitySchema: ExternalEntitySchema =  ExternalEntitySchemaBuilder()
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

  //this is one row - should be multiple?
  val result = igniteStore.getSqlFieldsQuery(queryName)
    .getOrElse(throw new Exception("query does not exist in store. make sure it is setup"))

  // map to entity object - as order of values are relevant to how the query schema was defined

  val tableRowMap1 = result
    .map(rowData => mapToEntity(rowData))
    .map(externalEntity => schemaMapper.toInternalRowMap(externalEntity))

  private val tableRowMap2: Seq[Map[String, Any]] = result.map(rowData => schemaMapper.toInternalRowMap(rowData))

  //map to tablerow
  val keyFieldName = tableDef.keyField
  val tableRows = tableRowMap2.map(rowMap =>
  {
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

class FakeIgniteStore(){

  private val queryToEntityResultMap = scala.collection.mutable.HashMap.empty[String, List[SchemaTestData]]
  private val queryToValuesResultMap = scala.collection.mutable.HashMap.empty[String, List[List[Any]]]

  def setUpIndexQuery(queryName:String, queryResult:List[SchemaTestData]): Unit = {
    queryToEntityResultMap += (queryName -> queryResult)
  }

  def getIndexQuery(queryName: String): Option[List[SchemaTestData]] = {
    queryToEntityResultMap.get(queryName)
  }

  def setUpSqlFieldsQuery(queryName: String, resultValues: List[List[Any]]): Unit = {
    queryToValuesResultMap += (queryName -> resultValues)
  }

  def getSqlFieldsQuery(queryName: String): Option[List[List[Any]]] = {
    queryToValuesResultMap.get(queryName)
  }
}

case class SchemaTestData(id :String, notionalValue: Double) {
}

class FakeInMemoryTable(name:String, tableDef: TableDef) extends DataTable {

  private val rowMap = scala.collection.mutable.HashMap.empty[String, RowWithData]

  override def name: String = name
  override def getTableDef: TableDef = tableDef

  override def processUpdate(rowKey: String, rowUpdate: RowWithData, timeStamp: Long = 0): Unit =
    rowMap += (rowKey -> rowUpdate)

  override def pullRow(key: String): RowData =
    rowMap.get(key)
      .getOrElse(throw new Exception(s"Could not find row data for key $key in table $name"))

  def pullAllRows() : List[RowWithData] =  rowMap.values.toList

  override protected def createDataTableData(): TableData = ???

  override def updateCounter: Long = ???

  override def incrementUpdateCounter(): Unit = ???

  override def indexForColumn(column: Column): Option[IndexedField[_]] = ???

  override def getColumnValueProvider: ColumnValueProvider = ???

  override def processDelete(rowKey: String): Unit = ???

  /**
   * notify listeners explicit when a rowKey changes
   */
  override def notifyListeners(rowKey: String, isDelete: Boolean): Unit = ???

  /**
   * Link table name is the name of the underlying table that we can link to.
   * In a session table this would be the underlying table.
   *
   * @return
   */
  override def linkableName: String = ???

  override def readRow(key: String, columns: List[String], processor: RowProcessor): Unit = ???

  override def primaryKeys: TablePrimaryKeys = ???

  override def pullRow(key: String, columns: ViewPortColumns): RowData = ???

  /**
   * Note the below call should only be used for testing. It filters the contents of maps by the expected viewPortColumns.
   * In practice we never need to do this at runtime.
   */
  override def pullRowFiltered(key: String, columns: ViewPortColumns): RowData = ???

  override def pullRowAsArray(key: String, columns: ViewPortColumns): Array[Any] = ???

  override def getObserversByKey(): Map[String, Array[KeyObserver[RowKeyUpdate]]] = ???

  override def addKeyObserver(key: String, observer: KeyObserver[RowKeyUpdate]): Boolean = ???

  override def removeKeyObserver(key: String, observer: KeyObserver[RowKeyUpdate]): Boolean = ???

  override def getObserversByKey(key: String): List[KeyObserver[RowKeyUpdate]] = ???

  override def isKeyObserved(key: String): Boolean = ???

  override def isKeyObservedBy(key: String, observer: KeyObserver[RowKeyUpdate]): Boolean = ???

  override def removeAllObservers(): Unit = ???
}
