package org.finos.vuu.plugin.offheap.store

import java.nio.{ByteBuffer, ByteOrder}
import java.nio.charset.StandardCharsets
import scala.collection.immutable.SortedMap

object FastStore {
  // Type Tags (1 byte)
  private val T_SHORT: Byte  = 0
  private val T_INT: Byte    = 1
  private val T_LONG: Byte   = 2
  private val T_CHAR: Byte   = 3
  private val T_STRING: Byte = 4

  // Header entry is 7 bytes: [Key: 2] + [Offset: 4] + [Tag: 1]
  private val ENTRY_SIZE = 7

  /**
   * Packs data into a read-only ByteBuffer.
   * Entries are sorted by key to enable O(log N) lookup.
   */
  def pack(data: SortedMap[Short, Any], target: ByteBuffer): Unit = {    
    val entryCount = data.size
    val headerSize = 2 + (entryCount * ENTRY_SIZE)

    // Skip header for now, we will write it last once we know offsets
    target.position(headerSize)

    val index = data.map { case (key, value) =>
      val offset = target.position()
      val tag = value match {
        case v: Short  => target.putShort(v); T_SHORT
        case v: Int    => target.putInt(v); T_INT
        case v: Long   => target.putLong(v); T_LONG
        case v: Char   => target.putChar(v); T_CHAR
        case v: String =>
          val bytes = v.getBytes(StandardCharsets.UTF_8)
          putVarInt(bytes.length, target)
          target.put(bytes)
          T_STRING
        case _ => throw new IllegalArgumentException(s"Unsupported type: ${value.getClass}")
      }
      (key, offset, tag)
    }

    // Write the actual Header at the beginning
    val finalSize = target.position()
    target.position(0)
    target.putShort(entryCount.toShort)

    index.foreach { case (key, offset, tag) =>
      target.putShort(key)
      target.putInt(offset)
      target.put(tag)
    }

    target.position(finalSize)
    target.flip() // Prepare for reading    
  }

  /**
   * Performs a Binary Search on the buffer header to find a key.
   * Zero-allocation for primitive returns (except Strings).
   */
  def lookup(buf: ByteBuffer, targetKey: Short): Any = {
    val count = buf.getShort(0)
    var low = 0
    var high = count - 1

    while (low <= high) {
      val mid = (low + high) / 2
      val pos = 2 + (mid * ENTRY_SIZE)
      val key = buf.getShort(pos)

      if (key == targetKey) {
        val offset = buf.getInt(pos + 2)
        val tag = buf.get(pos + 6)
        return readValue(buf, offset, tag)
      } else if (key < targetKey) {
        low = mid + 1
      } else {
        high = mid - 1
      }
    }
    null
  }

  private def readValue(buf: ByteBuffer, offset: Int, tag: Byte): Any = {
    buf.position(offset)
    tag match {
      case T_SHORT  => buf.getShort()
      case T_INT    => buf.getInt()
      case T_LONG   => buf.getLong()
      case T_CHAR   => buf.getChar()
      case T_STRING =>
        val len = getVarInt(buf)
        val bytes = new Array[Byte](len)
        buf.get(bytes)
        new String(bytes, StandardCharsets.UTF_8)
    }
  }

  private def putVarInt(value: Int, buf: ByteBuffer): Unit = {
    var v = value
    while ((v & ~0x7F) != 0) {
      buf.put(((v & 0x7F) | 0x80).toByte)
      v >>>= 7
    }
    buf.put(v.toByte)
  }

  private def getVarInt(buf: ByteBuffer): Int = {
    var b = buf.get()
    var value = b & 0x7F
    var shift = 7
    while ((b & 0x80) != 0) {
      b = buf.get()
      value |= (b & 0x7F) << shift
      shift += 7
    }
    value
  }
}
