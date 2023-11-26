package org.finos.vuu.feature

import org.finos.toolbox.collection.array.ImmutableArray

trait ViewPortKeys {
    def create(immutableArray: ImmutableArray[String]): ViewPortKeys
    def get(index: Int): String
    def slice(from: Int, to: Int): Array[String]
    def sliceToKeys(from: Int, to: Int): ViewPortKeys
    def length: Int
    def toArray(): Array[String]
}
