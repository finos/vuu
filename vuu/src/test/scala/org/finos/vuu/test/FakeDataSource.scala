package org.finos.vuu.test
class FakeDataSource[T]{

  private val queryToEntityResultMap = scala.collection.mutable.HashMap.empty[String, List[T]]
  private val queryToValuesResultMap = scala.collection.mutable.HashMap.empty[String, List[List[Any]]]

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
}