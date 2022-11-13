package org.finos.vuu.util.table

import org.finos.vuu.core.table.{EmptyRowData, RowWithData}
import org.finos.vuu.viewport.{RowUpdateType, ViewPortUpdate}
import org.finos.toolbox.collection.MapDiffUtils
import org.finos.toolbox.text.AsciiUtil
import org.scalatest.prop._

object TableAsserts {

//  def assertVpEq(updates: Seq[ViewPortUpdate])(expectation:TableFor13[_, _, _, _, _, _, _, _, _, _, _, _, _]): Unit = {
//
//    val arraysOfMaps = updates.map(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.columns).asInstanceOf[RowWithData].data).toArray
//
//    val heading = expectation.heading
//
//    val expectationAsMap = expectation.map(row => heading.productIterator.zip(row.productIterator).map({ case (head, data) => (head -> data) }).toMap).toArray
//
//    val actualAsMap = Map("diff" -> arraysOfMaps)
//    val expectAsMap = Map("diff" -> expectationAsMap)
//
//    val diff = MapDiffUtils.diff(actualAsMap, expectAsMap)
//
//    if (diff.hasDiff) {
//      printTable(actualAsMap, heading, "diff")
//
//      val headers = Array("exp key", "exp val", "exp datatype", "act key", "act val", "act datatype")
//
//      val leftNotRight = diff.leftNotRight.map(kpv => Array[Any]("", "", "", kpv.path, kpv.value, kpv.theType)).toArray
//      val rightNotLeft = diff.rightNotLeft.map(kpv => Array[Any](kpv.path, kpv.value, kpv.theType, "", "", "")).toArray
//      val bothButDiff = diff.bothButDiff.map(tup => {
//        val left = tup._1
//        val right = tup._2
//
//        Array[Any](left.path, left.value, left.theType, right.path, right.value, right.theType)
//      }).toArray[Array[Any]]
//
//      val data = leftNotRight ++ rightNotLeft ++ bothButDiff
//
//      println(AsciiUtil.asAsciiTable(headers, data))
//
//    }
//  }

  def genericLogic(heading: Array[String], arraysOfMaps: Array[Map[String, Any]], expectationAsMap: Array[Map[Any, Any]]) = {

    val actualAsMap = Map("diff" -> arraysOfMaps)
    val expectAsMap = Map("diff" -> expectationAsMap)

    val diff = MapDiffUtils.diff(actualAsMap, expectAsMap)

    if(diff.hasDiff){
      printTable(actualAsMap, heading, "diff")

      val headers = Array("exp key", "exp val", "exp datatype", "act key", "act val", "act datatype")

      val leftNotRight = diff.leftNotRight.map( kpv => Array[Any]("", "", "", kpv.path, kpv.value, kpv.theType)).toArray
      val rightNotLeft = diff.rightNotLeft.map( kpv => Array[Any](kpv.path, kpv.value, kpv.theType, "", "", "")).toArray
      val bothButDiff  = diff.bothButDiff.map( tup => {
        val left = tup._1
        val right = tup._2

        Array[Any](left.path, left.value, left.theType, right.path, right.value, right.theType)
      }).toArray[Array[Any]]

      val data = leftNotRight ++ rightNotLeft ++ bothButDiff

      println(AsciiUtil.asAsciiTable(headers, data))

    }
    assert(diff.hasDiff == false, "check we have no diffs")
  }


   def generic13Assert(updates: Seq[ViewPortUpdate], expectation: TableFor13[_, _, _, _, _, _, _, _, _, _, _, _, _]) = {

     val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType).map(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns)).filter(_.isInstanceOf[RowWithData]).map(_.asInstanceOf[RowWithData].data).toArray

     val heading = expectation.heading

     val headingAsArray = heading.productIterator.map(_.toString).toArray

     val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

     genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)

   }

  def generic12Assert(updates: Seq[ViewPortUpdate], expectation: TableFor12[_, _, _, _, _, _, _, _, _, _, _, _]) = {

    val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType).map(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns)).filter(_.isInstanceOf[RowWithData]).map(_.asInstanceOf[RowWithData].data).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)

  }

  def generic14Assert(updates: Seq[ViewPortUpdate], expectation: TableFor14[_, _, _, _, _, _, _, _, _, _, _, _, _, _]) = {

    val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType).map(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns)).filter(_.isInstanceOf[RowWithData]).map(_.asInstanceOf[RowWithData].data).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)

  }

  def generic15Assert(updates: Seq[ViewPortUpdate], expectation: TableFor15[_, _, _, _, _, _, _, _, _, _, _, _, _, _, _]) = {

    val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType).map(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns)).filter(_.isInstanceOf[RowWithData]).map(_.asInstanceOf[RowWithData].data).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)

  }

  def generic16Assert(updates: Seq[ViewPortUpdate], expectation: TableFor16[_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _]) = {

    val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType).map(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns)).filter(_.isInstanceOf[RowWithData]).map(_.asInstanceOf[RowWithData].data).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)

  }

  def generic17Assert(updates: Seq[ViewPortUpdate], expectation: TableFor17[_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _]) = {

    val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType).map(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns)).filter(_.isInstanceOf[RowWithData]).map(_.asInstanceOf[RowWithData].data).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)

  }

  def generic10Assert(updates: Seq[ViewPortUpdate], expectation: TableFor10[_, _, _, _, _, _, _, _, _, _]) = {

    val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType)
      .filter(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns) != EmptyRowData)
      .map(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns).asInstanceOf[RowWithData].data).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)

  }

  def generic11Assert(updates: Seq[ViewPortUpdate], expectation: TableFor11[_, _, _, _, _, _, _, _, _, _, _]) = {

    val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType)
      .filter(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns) != EmptyRowData)
      .map(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns).asInstanceOf[RowWithData].data).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)

  }

  def generic7Assert(updates: Seq[ViewPortUpdate], expectation: TableFor7[_, _, _, _, _, _, _]) = {

    val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType).map(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns)).filter(_.isInstanceOf[RowWithData]).map(_.asInstanceOf[RowWithData].data).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic6Assert(updates: Seq[ViewPortUpdate], expectation: TableFor6[_, _, _, _, _, _]) = {

    val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType).map(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns)).filter(_.isInstanceOf[RowWithData]).map(_.asInstanceOf[RowWithData].data).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic6AssertWithMeta(updates: Seq[ViewPortUpdate], expectation: TableFor6[_, _, _, _, _, _]) = {

    val addVpuMeta = (vpu: ViewPortUpdate) => {
      val isSel = if( vpu.vp.getSelection.contains(vpu.key.key) ) 1 else 0
      Map("sel" -> isSel)
    }

    val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType)
                              .filter(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns).isInstanceOf[RowWithData])
                              .map( vpu =>   addVpuMeta(vpu) ++ vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns).asInstanceOf[RowWithData].data ).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic12AssertWithMeta(updates: Seq[ViewPortUpdate], expectation: TableFor12[_, _, _, _, _, _,_, _, _, _, _, _]) = {

    val addVpuMeta = (vpu: ViewPortUpdate) => {
      val isSel = if( vpu.vp.getSelection.contains(vpu.key.key) ) 1 else 0
      Map("sel" -> isSel)
    }

    val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType)
      .filter(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns).isInstanceOf[RowWithData])
      .map( vpu =>   addVpuMeta(vpu) ++ vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns).asInstanceOf[RowWithData].data ).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }


  def generic5Assert(updates: Seq[ViewPortUpdate], expectation: TableFor5[_, _, _, _, _]) = {

    val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType).map(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns)).filter(_.isInstanceOf[RowWithData]).map(_.asInstanceOf[RowWithData].data).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic3Assert(updates: Seq[ViewPortUpdate], expectation: TableFor3[_, _, _]) = {

    val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType).map(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns)).filter(_.isInstanceOf[RowWithData]).map(_.asInstanceOf[RowWithData].data).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

  def generic9Assert(updates: Seq[ViewPortUpdate], expectation: TableFor9[_, _, _, _, _, _, _, _, _]) = {

    val arraysOfMaps = updates.filter(vpu => vpu.vpUpdate == RowUpdateType).map(vpu => vpu.table.pullRow(vpu.key.key, vpu.vp.getColumns).asInstanceOf[RowWithData].data).toArray

    val heading = expectation.heading

    val headingAsArray = heading.productIterator.map(_.toString).toArray

    val expectationAsMap = expectation.map( row => heading.productIterator.zip(row.productIterator).map({case(head, data) => (head -> data)}).toMap).toArray

    genericLogic(headingAsArray, arraysOfMaps, expectationAsMap)
  }

   def assertVpEq(updates: Seq[ViewPortUpdate])(expectation:Any): Unit = {

     //val expectation = block()
    val typedexpectation = expectation match {
        case exp: TableFor17[_, _, _, _, _, _, _, _, _, _, _, _, _, _,_, _, _] => generic17Assert(updates, exp)
        case exp: TableFor16[_, _, _, _, _, _, _, _, _, _, _, _, _, _,_, _] => generic16Assert(updates, exp)
        case exp: TableFor15[_, _, _, _, _, _, _, _, _, _, _, _, _, _,_] => generic15Assert(updates, exp)
        case exp: TableFor14[_, _, _, _, _, _, _, _, _, _, _, _, _, _] => generic14Assert(updates, exp)
        case exp: TableFor13[_, _, _, _, _, _, _, _, _, _, _, _, _] => generic13Assert(updates, exp)
        case exp: TableFor12[_, _, _, _, _, _, _, _, _, _, _, _] => generic12Assert(updates, exp)
        case exp: TableFor11[_, _, _, _, _, _, _, _, _, _, _] => generic11Assert(updates, exp)
        case exp: TableFor10[_, _, _, _, _, _, _, _, _, _] => generic10Assert(updates, exp)
        case exp: TableFor9[_, _, _, _, _, _, _, _, _] => generic9Assert(updates, exp)
        case exp: TableFor7[_, _, _, _, _, _, _] => generic7Assert(updates, exp)
        case exp: TableFor6[_, _, _, _, _, _] => generic6Assert(updates, exp)
        case exp: TableFor5[_, _, _, _, _] => generic5Assert(updates, exp)
        case exp: TableFor3[_, _, _] => generic3Assert(updates, exp)
    }

   }

  def assertVpEqWithMeta(updates: Seq[ViewPortUpdate])(expectation:Any): Unit = {

    //val expectation = block()
    val typedexpectation = expectation match {
      case exp: TableFor6[_, _, _, _, _, _] => generic6AssertWithMeta(updates, exp)
      case exp: TableFor12[_, _, _, _, _, _,_, _, _, _, _, _] => generic12AssertWithMeta(updates, exp)
    }

  }

  private def mv(map: Map[String, Any], key: String): String = {
    if(map.contains(key)){
      map.get(key).get match {
        case str: String => "\"" + str + "\""
        case d: Double => if(d.isNaN) "Double.NaN" else d.toString
        case l: Long => l.toString + "L"
        case null => "null"
        case x => x.toString
      }
    }else{
      ""
    }
  }

  private def printTable(map: Map[String, Any], heading: Array[String], mapKey: String): Unit = {

    def p20(s: String) =
      s.padTo(10, " ").mkString("")

    val tableAsString = {
        val rows = map.get(mapKey).get.asInstanceOf[Array[Map[String, Any]]]
        val tableAsS = s"Table(\n" +
                "(" + heading.map(header => p20("\"" + header.asInstanceOf[String] + "\"" ) ).mkString(",") + "),\n" +
                rows.map(entry => {
                  "(" + heading.map(key => p20(mv(entry, key.asInstanceOf[String]))).mkString(",") + ")"
                } ).mkString(",\n") + "\n)"

        tableAsS
    }

    println(tableAsString)

  }

}
