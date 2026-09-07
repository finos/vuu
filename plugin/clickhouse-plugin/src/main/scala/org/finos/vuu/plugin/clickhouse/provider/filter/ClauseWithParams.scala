package org.finos.vuu.plugin.clickhouse.provider.filter

sealed trait ClauseWithParams {
  def clause: String

  def params: Map[String, Any]

  def and(other: ClauseWithParams): ClauseWithParams
}

object ClauseWithParams {
  def apply(clause: String, params: Map[String, Any] = Map.empty): ClauseWithParams =
    ClauseWithParamsImpl(clause, params)
}

case object NoFilter extends ClauseWithParams {
  override val clause: String = ""
  override val params: Map[String, Any] = Map.empty

  override def and(other: ClauseWithParams): ClauseWithParams = other
}

case object NoResults extends ClauseWithParams {
  override val clause: String = "1 = 0"
  override val params: Map[String, Any] = Map.empty

  override def and(other: ClauseWithParams): ClauseWithParams = NoResults
}

private case class ClauseWithParamsImpl(clause: String, params: Map[String, Any]) extends ClauseWithParams {
  override def and(other: ClauseWithParams): ClauseWithParams = other match {
    case NoFilter => this
    case NoResults => NoResults
    case sc: ClauseWithParamsImpl =>
      val combinedParams =
        if (params.isEmpty) sc.params
        else if (sc.params.isEmpty) params
        else params ++ sc.params

      ClauseWithParamsImpl(s"($clause) AND (${sc.clause})", combinedParams)
  }
}
