package org.finos.vuu.feature

import org.finos.vuu.core.table.TablePrimaryKeys

trait ViewPortKeys extends Iterable[String] {
    def create(tableKeys: TablePrimaryKeys): ViewPortKeys
    def get(index: Int): String
    def sliceToArray(from: Int, to: Int): Array[String]
    def sliceToKeys(from: Int, to: Int): ViewPortKeys
    def length: Int
    def toArray(): Array[String]
}
