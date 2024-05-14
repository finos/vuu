package org.finos.vuu.test
class FakeIgniteStore[T](){

  private val queryToEntityResultMap = scala.collection.mutable.HashMap.empty[String, List[T]]
  private val queryToValuesResultMap = scala.collection.mutable.HashMap.empty[String, List[List[Any]]]

  def setUpIndexQuery(queryName:String, queryResult:List[T]): Unit = {
    queryToEntityResultMap += (queryName -> queryResult)
  }

  def getIndexQuery(queryName: String): Option[List[T]] = {
    queryToEntityResultMap.get(queryName)
  }

  def setUpSqlFieldsQuery(queryName: String, resultValues: List[List[Any]]): Unit = {
    queryToValuesResultMap += (queryName -> resultValues)
  }

  def getSqlFieldsQuery(queryName: String): Option[List[List[Any]]] = {
    queryToValuesResultMap.get(queryName)
  }
}