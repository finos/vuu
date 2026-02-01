package org.finos.vuu.core.table.join

import org.finos.vuu.provider.join.{JoinTableDeleteRow, JoinTableUpdateRow}
import org.finos.vuu.provider.JoinTableProvider
import org.finos.vuu.util.table.TableAsserts.genericLogic
import org.scalatest.matchers.should.Matchers.shouldEqual
import org.scalatest.prop.*

import scala.jdk.CollectionConverters
import scala.jdk.CollectionConverters.ListHasAsScala

object JoinAsserts {

  def assertJoinRowDeletion(tableName: String, joinTableProvider: JoinTableProvider, key: String): Unit = {

    val (count, output) = joinTableProvider.drainQueue_ForTesting()

    count shouldEqual 1
    val joinUpdateDeleteRow = output.get(0).asInstanceOf[JoinTableDeleteRow]
    joinUpdateDeleteRow.joinTable.name shouldEqual tableName
    joinUpdateDeleteRow.key shouldEqual key
  }

  def assertJoins(tableName: String, joinTableProvider: JoinTableProvider)(expectation:Any): Unit = {

    val (count, output) = joinTableProvider.drainQueue_ForTesting()

    val array = output.asScala.filter(f => f.isInstanceOf[JoinTableUpdateRow]).map(_.asInstanceOf[JoinTableUpdateRow]).toArray.take(count)

    assertJoins(tableName, array)(expectation)
  }

  def assertJoins(tableName: String, output: Array[JoinTableUpdateRow])(expectation:Any): Unit = {

    val typedexpectation = expectation match {
      case exp: TableFor3[_, _, _] => generic3Assert(tableName, output)(exp)
      case exp: TableFor4[_, _, _, _] => generic4Assert(tableName, output)(exp)
      case exp: TableFor5[_, _, _, _, _] => generic5Assert(tableName, output)(exp)
      case exp: TableFor6[_, _, _, _, _, _] => generic6Assert(tableName, output)(exp)
      case exp: TableFor7[_, _, _, _, _, _, _] => generic7Assert(tableName, output)(exp)
      case exp: TableFor8[_, _, _, _, _, _, _, _] => generic8Assert(tableName, output)(exp)
    }
  }

  def generic5Assert(tableName: String, output: Array[JoinTableUpdateRow])(expectation: TableFor5[_, _, _, _, _]) = {

    val arraysOfMaps = output.filter( jtu => jtu.joinTable.name == tableName).map( jtu => jtu.rowUpdate.data ).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic6Assert(tableName: String, output: Array[JoinTableUpdateRow])(expectation: TableFor6[_, _, _, _, _, _]) = {

    val arraysOfMaps = output.filter( jtu => jtu.joinTable.name == tableName).map( jtu => jtu.rowUpdate.data ).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic4Assert(tableName: String, output: Array[JoinTableUpdateRow])(expectation: TableFor4[_, _, _, _]) = {

    val arraysOfMaps = output.filter( jtu => jtu.joinTable.name == tableName).map( jtu => jtu.rowUpdate.data ).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic3Assert(tableName: String, output: Array[JoinTableUpdateRow])(expectation: TableFor3[_, _, _]) = {

    val arraysOfMaps = output.filter( jtu => jtu.joinTable.name == tableName).map( jtu => jtu.rowUpdate.data ).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic7Assert(tableName: String, output: Array[JoinTableUpdateRow])(expectation: TableFor7[_, _, _, _, _, _, _]) = {

    val arraysOfMaps = output.filter( jtu => jtu.joinTable.name == tableName).map( jtu => jtu.rowUpdate.data ).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic8Assert(tableName: String, output: Array[JoinTableUpdateRow])(expectation: TableFor8[_, _, _, _, _, _, _, _]) = {

    val arraysOfMaps = output.filter( jtu => jtu.joinTable.name == tableName).map( jtu => jtu.rowUpdate.data ).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)

  }

}
