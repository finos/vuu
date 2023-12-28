package org.finos.vuu.feature

import org.finos.vuu.core.filter.Filter
import org.finos.vuu.net.FilterSpec

trait FilterFactory {
  def create(spec: FilterSpec): Filter
}
