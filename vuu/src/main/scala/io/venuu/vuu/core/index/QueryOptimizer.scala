package io.venuu.vuu.core.index

import io.venuu.vuu.core.filter.FilterClause

class QueryOptimizer {
  def canUseIndex(clause: FilterClause): Boolean = ???
}
