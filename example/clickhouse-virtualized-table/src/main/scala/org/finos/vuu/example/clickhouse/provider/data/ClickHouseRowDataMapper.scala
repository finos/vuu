package org.finos.vuu.example.clickhouse.provider.data

import com.clickhouse.client.api.query.GenericRecord
import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.datatype.{EpochTimestamp, ScaledDecimal2, ScaledDecimal4, ScaledDecimal6, ScaledDecimal8}
import org.finos.vuu.core.table.{Column, DataType, RowWithData}

import scala.collection.mutable

trait ClickHouseRowDataMapper {

  def mapRowData(genericRecord: GenericRecord, key: String, columns: List[Column]): RowWithData

}

object ClickHouseRowDataMapper {

  val INT_NAN_SENTINEL: Int = Int.MinValue
  val LONG_NAN_SENTINEL: Long = Long.MinValue

  def apply(): ClickHouseRowDataMapper = ClickHouseRowDataMapperImpl()

}

private case class ClickHouseRowDataMapperImpl() extends ClickHouseRowDataMapper with StrictLogging {

  override def mapRowData(v1: GenericRecord, key: String, columns: List[Column]): RowWithData = {
    val builder = mutable.Map.empty[String, Any]

    var i = 0
    val n = columns.length
    while (i < n) {
      val col = columns(i)
      val name = col.name

      if (v1.hasValue(name)) {
        col.dataType match {
          case DataType.StringDataType =>
            val s = v1.getString(name)
            if (s != null && s.nonEmpty) {
              builder.put(name, s)
            }

          case DataType.IntegerDataType =>
            val iv: Int = v1.getInteger(name)
            if (iv != ClickHouseRowDataMapper.INT_NAN_SENTINEL) {
              builder.put(name, iv)
            }

          case DataType.LongDataType =>
            val lv: Long = v1.getLong(name)
            if (lv != ClickHouseRowDataMapper.LONG_NAN_SENTINEL) {
              builder.put(name, lv)
            }

          case DataType.DoubleDataType =>
            val dv: Double = v1.getDouble(name)
            if (!java.lang.Double.isNaN(dv)) {
              builder.put(name, dv)
            }

          case DataType.BooleanDataType =>
            val bv: Boolean = v1.getBoolean(name)
            builder.put(name, bv)

          case DataType.CharDataType =>
            val s = v1.getString(name)
            if (s != null && s.length == 1) {
              builder.put(name, s.charAt(0))
            }

          case DataType.EpochTimestampType =>
            val ts: Long = v1.getLong(name)
            if (ts != ClickHouseRowDataMapper.LONG_NAN_SENTINEL) {
              builder.put(name, EpochTimestamp(ts))
            }

          case DataType.ScaledDecimal2Type =>
            val lv2: Long = v1.getLong(name)
            if (lv2 != ClickHouseRowDataMapper.LONG_NAN_SENTINEL) {
              builder.put(name, ScaledDecimal2(lv2))
            }

          case DataType.ScaledDecimal4Type =>
            val lv4: Long = v1.getLong(name)
            if (lv4 != ClickHouseRowDataMapper.LONG_NAN_SENTINEL) {
              builder.put(name, ScaledDecimal4(lv4))
            }

          case DataType.ScaledDecimal6Type =>
            val lv6: Long = v1.getLong(name)
            if (lv6 != ClickHouseRowDataMapper.LONG_NAN_SENTINEL) {
              builder.put(name, ScaledDecimal6(lv6))
            }

          case DataType.ScaledDecimal8Type =>
            val lv8: Long = v1.getLong(name)
            if (lv8 != ClickHouseRowDataMapper.LONG_NAN_SENTINEL) {
              builder.put(name, ScaledDecimal8(lv8))
            }

          case _ =>
            logger.warn(s"Unexpected column type: ${col.dataType}")
        }
      }

      i += 1
    }

    val primaryKey = v1.getString(key)
    RowWithData(primaryKey, builder.toMap)
  }

}
