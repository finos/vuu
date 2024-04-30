package org.finos.vuu.test
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