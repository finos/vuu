package org.finos.vuu.feature.ignite.filter

import org.apache.ignite.cache.query.{IndexQueryCriteriaBuilder, IndexQueryCriterion}

trait IgniteIndexFilterClause{
  def toCriteria(): List[IndexQueryCriterion]
}

case class OrIgniteIndexFilterClause(criteria:List[IgniteIndexFilterClause]) extends IgniteIndexFilterClause{
  override def toCriteria(): List[IndexQueryCriterion] = {
    criteria.flatMap(_.toCriteria())
  }
}

case class AndIgniteIndexFilterClause(criteria:List[IgniteIndexFilterClause]) extends IgniteIndexFilterClause{
  override def toCriteria(): List[IndexQueryCriterion] = {
    criteria.flatMap(_.toCriteria())
  }
}

case class EqIgniteIndexFilterClause(columnName: String, value: String) extends IgniteIndexFilterClause{
  override def toCriteria(): List[IndexQueryCriterion] = {
    //todo cast the value to right type  - need to look up table column schema
    List(IndexQueryCriteriaBuilder.eq(columnName, value))
  }
}
