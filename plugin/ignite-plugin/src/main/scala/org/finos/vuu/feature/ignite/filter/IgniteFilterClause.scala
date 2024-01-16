package org.finos.vuu.feature.ignite.filter

import org.apache.ignite.cache.query.{IndexQueryCriteriaBuilder, IndexQueryCriterion}

trait IgniteFilterClause{
  def toCriteria(): List[IndexQueryCriterion]
}

case class OrIgniteFilterClause(criteria:List[IgniteFilterClause]) extends IgniteFilterClause{
  override def toCriteria(): List[IndexQueryCriterion] = {
    criteria.flatMap(_.toCriteria())
  }
}

case class AndIgniteFilterClause(criteria:List[IgniteFilterClause]) extends IgniteFilterClause{
  override def toCriteria(): List[IndexQueryCriterion] = {
    criteria.flatMap(_.toCriteria())
  }
}

case class EqIgniteFilterClause(columnName: String, value: String) extends IgniteFilterClause{
  override def toCriteria(): List[IndexQueryCriterion] = {
    //todo cast the value to right type  - need to look up table column schema
    List(IndexQueryCriteriaBuilder.eq(columnName, value))
  }
}


//case class IgniteEqualsClause(columnName: String, value: String) extends RowFilterClause {
//  override def filter(row: RowData): Boolean = {
//    row.get(columnName) match {
//      case null => false
//      case s: String => s == value
//      case i: Int => i == value.toInt
//      case f: Float => f == value.toFloat
//      case d: Double => d == value.toDouble
//      case b: Boolean => b == value.equalsIgnoreCase("true")
//    }
//  }
//}