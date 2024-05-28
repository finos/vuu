package org.finos.vuu.core.module.typeahead

import org.finos.vuu.net.RequestContext

trait TypeAheadRpcHandler{
  def getUniqueFieldValues(tableMap: Map[String, String], column: String, ctx: RequestContext): Array[String]
  def getUniqueFieldValuesStartingWith(tableMap: Map[String, String], column: String, starts: String, ctx: RequestContext): Array[String]
}
