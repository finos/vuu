package org.finos.vuu.core.index

import org.finos.vuu.core.filter.FilterClause

class QueryOptimizer {
  def canUseIndex(clause: FilterClause): Boolean = ???
}
