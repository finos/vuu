package io.venuu.toolbox.collection.set

import io.venuu.toolbox.collection.array.ImmutableArray

import scala.reflect.ClassTag
import scala.util.control.Breaks

object ImmutableUniqueArraySet{
  def empty[T :ClassTag](chunkSize: Int = 1000): ImmutableArray[T] = {
    new ChunkedUniqueImmutableArraySet[T](Set(), Array(), chunkSize = chunkSize)
  }
  def from[T](array: Array[T], chunkSize: Int = 1000)(implicit c: ClassTag[T]) = {
    ImmutableUniqueArraySet.empty[T]().++(ImmutableArray.from(array))
  }
}

trait ImmutableUniqueArraySet[T] extends ImmutableArray[T] {
  def contains(element: T): Boolean
}

class ChunkedUniqueImmutableArraySet[T :ClassTag](private val uniqueCheck: Set[T], private val chunks:Array[Array[T]], private val lastUsedIndex: Int = 0, val chunkSize: Int = 1000) extends ImmutableArray[T] with Iterable[T] {


  override def remove(element: T): ImmutableArray[T] = this.-(element)

  override def addAll(arr: ImmutableArray[T]): ImmutableArray[T] = this.++(arr)

  override def iterator: Iterator[T] = {
    new Iterator[T] {
      private var iterIdx: Int = 0

      override def hasNext: Boolean = {
        iterIdx < lastUsedIndex
      }

      override def next(): T = {
        val n = getIndex(iterIdx)
        iterIdx += 1
        n
      }
    }
  }

  def countOfChunks: Int = chunks.length

  override def +(element: T): ImmutableArray[T] = {
    if (uniqueCheck.contains(element)) {
      this
    } else {
      if (lastUsedIndex == 0) {
        val newChunks = new Array[Array[T]](1)
        newChunks(0) = new Array[T](chunkSize)
        newChunks(0)(0) = element
        newSetAddition(element, newChunks, indexPlusOne())
      } else {
        val activeChunk = (lastUsedIndex / chunkSize)
        val indexInChunk = lastUsedIndex % chunkSize
        //if we have gone over the last chunk, then add a new one
        if (activeChunk > chunks.length - 1) {
          val newChunks = new Array[Array[T]](chunks.length + 1)
          setChunks(chunks, newChunks)
          newChunks(activeChunk) = new Array[T](chunkSize)
          newChunks(activeChunk)(indexInChunk) = element
          newSetAddition(element, newChunks, indexPlusOne())
          //else amend an existing chunk
        } else {
          val newChunk = new Array[T](chunks(activeChunk).length)
          System.arraycopy(chunks(activeChunk), 0, newChunk, 0, chunks(activeChunk).length)
          newChunk(indexInChunk) = element
          val newChunks = new Array[Array[T]](chunks.length)
          setChunks(chunks, newChunks)
          newChunks(activeChunk) = newChunk
          newSetAddition(element, newChunks, indexPlusOne())
        }
      }
    }
  }

  private def newSetAddition(element: T, newChunks: Array[Array[T]], lastUsedIndex: Int) = {
    new ChunkedUniqueImmutableArraySet[T](uniqueCheck = uniqueCheck.+(element), newChunks, lastUsedIndex, chunkSize = this.chunkSize)
  }

  private def newSetRemoval(element: T, newChunks: Array[Array[T]], lastUsedIndex: Int) = {
    new ChunkedUniqueImmutableArraySet[T](uniqueCheck = uniqueCheck.-(element), newChunks, lastUsedIndex, chunkSize = this.chunkSize)
  }


  private def indexPlusOne(): Int = lastUsedIndex + 1

  private def indexMinusOne(): Int = lastUsedIndex - 1

  private def setFullChunks(oldChunks: Array[Array[T]], newChunks: Array[Array[T]]): Unit = {
    for (a <- 0 until oldChunks.length) {
      if (oldChunks(a).length == chunkSize) {
        newChunks(a) = oldChunks(a)
      }
    }
  }

  private def setChunks(oldChunks: Array[Array[T]], newChunks: Array[Array[T]]): Unit = {
    for (a <- 0 until oldChunks.length) {
      newChunks(a) = oldChunks(a)
    }
  }

  override def -(element: T): ImmutableArray[T] = {
    val idxOf = indexOf(element)
    remove(idxOf)
  }

  private def emptyChunk(): Array[T] = new Array[T](chunkSize)

  private def createChunks(length: Int): Array[Array[T]] = {
    new Array[Array[T]](length)
  }

  private def indexToChunk(idx: Int): Int = {
    (idx / chunkSize)
  }

  private def setInPlace(index: Int, elem: T, newChunks: Array[Array[T]]): Unit = {
    val activeChunks = (index / chunkSize)
    val indexInLastChunk = index % chunkSize
    if (newChunks(activeChunks) == null) {

    }
    else {
      newChunks(activeChunks)(indexInLastChunk) = elem
    }
  }

  override def ++(arr: ImmutableArray[T]): ImmutableArray[T] = {
    val currentLength = length
    val currentFullChunks = (currentLength / chunkSize)
    val currentChunks = if (currentLength % chunkSize > 0) currentFullChunks + 1 else currentFullChunks
    val indexInCurrentChunk = currentLength % chunkSize

    val requiredLength = indexPlusOne() + arr.length
    val requiredChunks = if (requiredLength % chunkSize > 0) (requiredLength / chunkSize) + 1 else (requiredLength / chunkSize)

    val newChunks = new Array[Array[T]](requiredChunks)
    setFullChunks(chunks, newChunks)

    //if last chunk was partially filled, take a copy, and set it back
    if (indexInCurrentChunk > 0) {
      val newChunk = new Array[T](chunkSize)
      System.arraycopy(chunks(currentFullChunks), 0, newChunk, 0, chunks(currentFullChunks).length)
      newChunks(currentFullChunks) = newChunk
    }

    //create any empty chunks required till we get to required chunks
    //create empty chunks
    (currentChunks to requiredChunks - 1).foreach(i =>
      newChunks(i) = new Array[T](chunkSize)
    )

    //at this point I should have full chunks for all previous items, now I need to add in place
    var targetIdx = currentLength

    var unique = this.uniqueCheck

    for (a <- 0 until arr.length) {
      val elem = arr.getIndex(a)
      if(! unique.contains(elem)){
        setElementInPlace(targetIdx, newChunks, elem)
        targetIdx += 1
        unique = unique.+(elem)
      }
    }

    new ChunkedUniqueImmutableArraySet[T](uniqueCheck = unique, newChunks, targetIdx, chunkSize = this.chunkSize)
  }

  private def setChunksUpTo(oldChunks: Array[Array[T]], newChunks: Array[Array[T]], chunkIndex: Int): Unit = {
    for (a <- 0 until chunkIndex) {
      newChunks(a) = oldChunks(a)
    }
  }

  private def setElementInPlace(idx: Int, chunks: Array[Array[T]], elem: T): Unit = {
    val activeChunk = (idx / chunkSize)
    val indexInChunk = idx % chunkSize
    //println(s"Setting in place: chunks($activeChunk)($indexInChunk) = $elem")
    chunks(activeChunk)(indexInChunk) = elem
  }

  override def getIndex(index: Int): T = {
    var activeChunk = (index / chunkSize)
    var indexInChunk = index % chunkSize

    if (indexInChunk == chunkSize) {
      indexInChunk = 0
      activeChunk += 1
    }

    //println(s"getIndex($index) -> ($activeChunk)($indexInChunk)")
    chunks(activeChunk)(indexInChunk)
  }

  override def indexOf(element: T): Int = {
    val loop = new Breaks
    var index = -1
    loop.breakable {
      for (a <- 0 until this.length) {
        val v = getIndex(a)
        if (v == element) {
          index = a
          loop.break()
        }
      }
    }
    index
  }

  override def length: Int = lastUsedIndex

  override def apply(i: Int): T = getIndex(i)

  override def set(index: Int, element: T): ImmutableArray[T] = {
    if(!uniqueCheck.contains(element)){
      val chunkOf = indexToChunk(index)
      val newChunks = new Array[Array[T]](chunks.length)
      setChunksUpTo(chunks, newChunks, chunks.length)
      val newChunkOfElem = emptyChunk()
      System.arraycopy(chunks(chunkOf), 0, newChunkOfElem, 0, chunks(chunkOf).length)
      newChunkOfElem(index) = element
      newChunks(chunkOf) = newChunkOfElem
      new ChunkedUniqueImmutableArraySet[T](uniqueCheck = this.uniqueCheck.+(element), newChunks, lastUsedIndex, chunkSize = this.chunkSize)
    }else{
      this
    }

  }

  override def remove(idxOf: Int): ImmutableArray[T] = {
    if (idxOf == -1) {
      this
    } else {

      val elem = getIndex(idxOf)

      val chunkOf = indexToChunk(idxOf)

      val newChunks = createChunks(this.countOfChunks)

      setChunksUpTo(chunks, newChunks, chunkOf)

      for (chunkIx <- chunkOf until chunks.length) {
        newChunks(chunkIx) = emptyChunk()
      }

      val lastChunkStart = chunkOf * chunkSize

      for (a <- lastChunkStart until idxOf) {
        setInPlace(a, getIndex(a), newChunks)
      }

      for (a <- idxOf until this.length) {
        setInPlace(a, getIndex(a + 1), newChunks)
      }

      newSetRemoval(elem, newChunks, indexMinusOne())
    }
  }

  override def distinct: ImmutableArray[T] = this
}

