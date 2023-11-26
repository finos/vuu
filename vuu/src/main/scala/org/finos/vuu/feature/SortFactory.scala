package org.finos.vuu.feature

import org.finos.vuu.core.sort.Sort
import org.finos.vuu.net.SortSpec

trait SortFactory {
  def create(sortSpec: SortSpec): Sort
}
