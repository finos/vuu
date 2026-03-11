package org.finos.vuu.core.sort

import org.finos.vuu.core.table.RowWithData

import java.util

object SortBuffer {
  
  private val threadLocalSortBuffer = new ThreadLocal[Array[RowWithData]]()
  private val maxRetainedSize = 5_000_000

  /**
   * Gets or grows a thread-local array.
   */
  def borrow(requiredCapacity: Int): Array[RowWithData] = {
    val existing = threadLocalSortBuffer.get()

    if (existing == null || existing.length < requiredCapacity) {      
      val newSize = if (existing == null) requiredCapacity
      else Math.max(requiredCapacity, (existing.length * 1.5).toInt)

      val newArray = new Array[RowWithData](newSize)
      threadLocalSortBuffer.set(newArray)
      newArray
    } else {
      existing
    }
  }

  /**
   * Nulls out references to prevent memory leaks.
   */
  def release(array: Array[RowWithData], size: Int): Unit = {
    if (array != null) {
      util.Arrays.fill(array.asInstanceOf[Array[AnyRef]], 0, size, null)
      if (array.length > maxRetainedSize) {
        threadLocalSortBuffer.remove()
      }
    }
  }
}


