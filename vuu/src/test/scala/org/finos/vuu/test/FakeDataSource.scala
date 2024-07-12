package org.finos.vuu.test
class FakeDataSource[T]{

  private val queryToEntityResultMap = scala.collection.mutable.HashMap.empty[String, List[T]]
  private val queryToValuesResultMap = scala.collection.mutable.HashMap.empty[String, List[List[Any]]]
  private val queryToColumnResultMap = scala.collection.mutable.HashMap.empty[String, Array[String]]

  def setUpResultAsObjects(queryName:String, queryResult:List[T]): Unit = {
    queryToEntityResultMap += (queryName -> queryResult)
  }

  def getAsObjects(queryName: String): Option[List[T]] = {
    queryToEntityResultMap.get(queryName)
  }

  def setUpResultAsListOfValues(queryName: String, resultValues: List[List[Any]]): Unit = {
    queryToValuesResultMap += (queryName -> resultValues)
  }

  def getAsListOfValues(queryName: String): Option[List[List[Any]]] = {
    queryToValuesResultMap.get(queryName)
  }

  def setUpResultGivenColumn(queryName:String, columnName:String, queryResult:Array[String]): Unit = {
    queryToColumnResultMap += (getQueryColumnName(queryName, columnName)  -> queryResult)
  }

  def getColumnValues(queryName: String, columnName:String): Option[Array[String]] = {
    queryToColumnResultMap.get(getQueryColumnName(queryName, columnName))
  }

  private def getQueryColumnName(queryName: String, columnName: String) = {
    queryName + ":" + columnName
  }
}