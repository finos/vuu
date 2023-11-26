package org.finos.vuu.feature

import org.finos.vuu.core.filter.Filter
import org.finos.vuu.net.FilterSpec

trait FilterAndSortFactory {
  def create(filterSpec: FilterSpec): Filter
}
