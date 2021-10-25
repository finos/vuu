package io.venuu.vuu.core.table.join

import io.venuu.vuu.core.table.JoinTableUpdate
import io.venuu.vuu.provider.JoinTableProvider
import io.venuu.vuu.util.table.TableAsserts.genericLogic
import org.scalatest.prop._

import scala.collection.convert.ImplicitConversions.`collection AsScalaIterable`

object JoinAsserts {

  def assertJoins(tableName: String, joinTableProvider: JoinTableProvider)(expectation:Any): Unit = {

    val (count, output) = joinTableProvider.drainQueue_ForTesting()

    val array = output.map(_.asInstanceOf[JoinTableUpdate]).toArray.take(count)

    assertJoins(tableName, array)(expectation)
  }

  def assertJoins(tableName: String, output: Array[JoinTableUpdate])(expectation:Any): Unit = {

    val typedexpectation = expectation match {
      case exp: TableFor3[_, _, _] => generic3Assert(tableName, output)(exp)
      case exp: TableFor4[_, _, _, _] => generic4Assert(tableName, output)(exp)
      case exp: TableFor5[_, _, _, _, _] => generic5Assert(tableName, output)(exp)
      case exp: TableFor6[_, _, _, _, _, _] => generic6Assert(tableName, output)(exp)
      case exp: TableFor7[_, _, _, _, _, _, _] => generic7Assert(tableName, output)(exp)
      case exp: TableFor8[_, _, _, _, _, _, _, _] => generic8Assert(tableName, output)(exp)
    }
  }

  def generic5Assert(tableName: String, output: Array[JoinTableUpdate])(expectation: TableFor5[_, _, _, _, _]) = {

    val arraysOfMaps = output.filter( jtu => jtu.joinTable.name == tableName).map( jtu => jtu.rowUpdate.data ).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic6Assert(tableName: String, output: Array[JoinTableUpdate])(expectation: TableFor6[_, _, _, _, _, _]) = {

    val arraysOfMaps = output.filter( jtu => jtu.joinTable.name == tableName).map( jtu => jtu.rowUpdate.data ).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic4Assert(tableName: String, output: Array[JoinTableUpdate])(expectation: TableFor4[_, _, _, _]) = {

    val arraysOfMaps = output.filter( jtu => jtu.joinTable.name == tableName).map( jtu => jtu.rowUpdate.data ).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic3Assert(tableName: String, output: Array[JoinTableUpdate])(expectation: TableFor3[_, _, _]) = {

    val arraysOfMaps = output.filter( jtu => jtu.joinTable.name == tableName).map( jtu => jtu.rowUpdate.data ).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic7Assert(tableName: String, output: Array[JoinTableUpdate])(expectation: TableFor7[_, _, _, _, _, _, _]) = {

    val arraysOfMaps = output.filter( jtu => jtu.joinTable.name == tableName).map( jtu => jtu.rowUpdate.data ).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic8Assert(tableName: String, output: Array[JoinTableUpdate])(expectation: TableFor8[_, _, _, _, _, _, _, _]) = {

    val arraysOfMaps = output.filter( jtu => jtu.joinTable.name == tableName).map( jtu => jtu.rowUpdate.data ).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)

  }

}
