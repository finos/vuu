package org.finos.vuu.feature

import org.finos.vuu.core.table.TablePrimaryKeys

trait ViewPortKeys extends Iterable[String] {
    def create(tableKeys: TablePrimaryKeys): ViewPortKeys
    def get(index: Int): String
    // From a key (inclusive) until another key (exclusive)
    def sliceToArray(from: Int, to: Int): Array[String]
    // From a key (inclusive) until another key (exclusive)
    def sliceToKeys(from: Int, to: Int): ViewPortKeys
    def length: Int
    def toArray(): Array[String]
}
