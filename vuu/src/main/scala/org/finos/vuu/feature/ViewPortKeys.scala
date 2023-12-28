package org.finos.vuu.feature

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.table.TablePrimaryKeys

trait ViewPortKeys {
    def create(tableKeys: TablePrimaryKeys): ViewPortKeys
    def get(index: Int): String
    def slice(from: Int, to: Int): Array[String]
    def sliceToKeys(from: Int, to: Int): ViewPortKeys
    def length: Int
    def toArray(): Array[String]
}
