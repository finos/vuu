package org.finos.vuu.plugin.clickhouse.provider.filter

case class ClauseWithParams(clause: String,
                            params: Map[String, Any]) {

  def and(other: ClauseWithParams): ClauseWithParams = (this, other) match {
    case (NoResults, _) | (_, NoResults) => NoResults
    case (NoFilter, _) => other
    case (_, NoFilter) => this
    case (c1, c2) =>
      ClauseWithParams(s"(${c1.clause}) AND (${c2.clause})", c1.params ++ c2.params)
  }

}

object NoFilter extends ClauseWithParams("", Map.empty)

object NoResults extends ClauseWithParams("1 = 0", Map.empty)



