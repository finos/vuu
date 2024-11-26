package org.finos.vuu.example.valkey.store

import org.finos.vuu.plugin.virtualized.table.VirtualizedTableKeys

class ValkeyIndex(indexName: String) {

  def loadKeysByIndex(from: Int, to: Int): (Int, List[String]) = ???

}
