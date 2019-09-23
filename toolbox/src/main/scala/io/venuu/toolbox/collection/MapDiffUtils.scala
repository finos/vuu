/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 19/11/2015.

  */
package io.venuu.toolbox.collection

case class MapDiffResult(leftNotRight: List[KeyPathValue], rightNotLeft: List[KeyPathValue], bothButDiff:List[(KeyPathValue, KeyPathValue)]){
  def hasDiff: Boolean = leftNotRight.size > 0 || rightNotLeft.size > 0 || bothButDiff.size > 0

}
case class KeyPathValue(path: String, value: String, theType: String)

object MapDiffUtils {

  private def partialMatch(k: String, v: Any, prefix: String): List[KeyPathValue] = {
    v match {
      case m: Map[_, _] => deMap(m.asInstanceOf[Map[String, Any]], prefix + "/" + k)
      case a: Array[_] => a.zipWithIndex.flatMap(el => partialMatch(s"[${el._2}]", el._1, prefix + k )).toList
      case a: List[_] => a.zipWithIndex.flatMap(el => partialMatch(s"[${el._2}]", el._1, prefix + k )).toList
      case x =>
        List(KeyPathValue(prefix + "/" + k, if(x != null) x.toString else "null", if(x != null) x.getClass.getSimpleName else "null"))
    }
  }

  private def deMap(map: Map[String, Any], prefix: String): List[KeyPathValue] = {
    map.flatMap({case(a,b) => partialMatch(a, b, prefix)}).toList
  }

  private def toKeyPathValue(map: Map[String, Any]): List[KeyPathValue] = {
    deMap(map, "/")
  }

  def diff(left: Map[String, Any], right: Map[String, Any]): MapDiffResult = {
    val leftKVP = toKeyPathValue(left)
    val rightKVP = toKeyPathValue(right)

    diffInternal(leftKVP, rightKVP)
  }

  private def diffInternal(left: List[KeyPathValue], right: List[KeyPathValue]):MapDiffResult = {
    val leftMap = left.map(kpv => kpv.path -> kpv).toMap
    val rightMap = right.map(kpv => kpv.path -> kpv).toMap

    val lNotR = leftNotRight(leftMap, rightMap)
    val rNotL = rightNotLeft(leftMap, rightMap)

    val bothButDiffy = bothButDiff(leftMap, rightMap)

    MapDiffResult(lNotR, rNotL, bothButDiffy)
  }

  private def bothButDiff(left: Map[String, KeyPathValue], right: Map[String, KeyPathValue]): List[(KeyPathValue, KeyPathValue)] = {
    right.filter( x => left.contains(x._1)).filter({case(k, v) => left.get(k).get.theType != v.theType || left.get(k).get.value != v.value }).map( tup => (tup._2, left.get(tup._1).get  )).toList
  }

  private def leftNotRight(left: Map[String, KeyPathValue], right: Map[String, KeyPathValue]): List[KeyPathValue] = {
    left.filter({ case(k,v) => !right.contains(k)}).values.toList
  }

  private def rightNotLeft(left: Map[String, KeyPathValue], right: Map[String, KeyPathValue]): List[KeyPathValue] = {
    right.filter({ case(k,v) => !left.contains(k)}).values.toList
  }


}
