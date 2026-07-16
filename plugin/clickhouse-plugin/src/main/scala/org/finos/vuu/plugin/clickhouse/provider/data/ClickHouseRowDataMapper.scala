package org.finos.vuu.plugin.clickhouse.provider.data

import com.clickhouse.client.api.query.GenericRecord
import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.table.datatype.{EpochTimestamp, EpochTimestampNano, ScaledDecimal2, ScaledDecimal4, ScaledDecimal6, ScaledDecimal8}
import org.finos.vuu.core.table.{Column, DataType, RowWithData}
import org.finos.vuu.plugin.clickhouse.provider.data.ClickHouseRowDataMapper.{EPOCH_NANO_NAN_SENTINEL, EPOCH_NAN_SENTINEL}
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableColumn

import java.time.ZonedDateTime
import scala.collection.mutable

trait ClickHouseRowDataMapper {

  def mapRowData(genericRecord: GenericRecord, remoteKeyName: String, columns: List[VirtualizedSessionTableColumn]): RowWithData

}

object ClickHouseRowDataMapper {

  val INT_NAN_SENTINEL: Int = Int.MinValue
  val LONG_NAN_SENTINEL: Long = Long.MinValue
  val DOUBLE_NAN_SENTINEL: Double = java.lang.Double.NaN
  val EPOCH_NAN_SENTINEL: EpochTimestamp = EpochTimestamp(0)
  val EPOCH_NANO_NAN_SENTINEL: EpochTimestampNano = EpochTimestampNano(0)

  def apply(): ClickHouseRowDataMapper = ClickHouseRowDataMapperImpl()

}

private case class ClickHouseRowDataMapperImpl() extends ClickHouseRowDataMapper with StrictLogging {

  override def mapRowData(v1: GenericRecord, remoteKeyName: String,
                          columns: List[VirtualizedSessionTableColumn]): RowWithData = {
    val builder = mutable.Map.empty[String, Any]

    var i = 0
    val n = columns.length
    while (i < n) {
      val col = columns(i)
      val remoteName = col.remoteName
      val name = col.name

      if (v1.hasValue(remoteName)) {
        col.dataType match {
          case DataType.StringDataType =>
            val s = v1.getString(remoteName)
            if (s != null && s.nonEmpty) {
              builder.put(name, s)
            }

          case DataType.IntegerDataType =>
            val iv: Int = v1.getInteger(remoteName)
            if (iv != ClickHouseRowDataMapper.INT_NAN_SENTINEL) {
              builder.put(name, iv)
            }

          case DataType.LongDataType =>
            val lv: Long = v1.getLong(remoteName)
            if (lv != ClickHouseRowDataMapper.LONG_NAN_SENTINEL) {
              builder.put(name, lv)
            }

          case DataType.DoubleDataType =>
            val dv: Double = v1.getDouble(remoteName)
            if (!java.lang.Double.isNaN(dv)) {
              builder.put(name, dv)
            }

          case DataType.BooleanDataType =>
            val bv: Boolean = v1.getBoolean(remoteName)
            builder.put(name, bv)

          case DataType.CharDataType =>
            val s = v1.getString(remoteName)
            if (s != null && s.length == 1) {
              builder.put(name, s.charAt(0))
            }

          case DataType.EpochTimestampType =>
            val ts: ZonedDateTime = v1.getZonedDateTime(remoteName)
            if (ts != null) {
              val epochTimestamp = EpochTimestamp(ts)
              if (epochTimestamp != EPOCH_NAN_SENTINEL) {
                builder.put(name, epochTimestamp)
              }
            }

          case DataType.EpochTimestampNanoType =>
            val ts: ZonedDateTime = v1.getZonedDateTime(remoteName)
            if (ts != null) {
              val epochTimestampNano = EpochTimestampNano(ts)
              if (epochTimestampNano != EPOCH_NANO_NAN_SENTINEL) {
                builder.put(name, epochTimestampNano)
              }
            }

          case DataType.ScaledDecimal2Type =>
            val lv2: Long = v1.getLong(remoteName)
            if (lv2 != ClickHouseRowDataMapper.LONG_NAN_SENTINEL) {
              builder.put(name, ScaledDecimal2(lv2))
            }

          case DataType.ScaledDecimal4Type =>
            val lv4: Long = v1.getLong(remoteName)
            if (lv4 != ClickHouseRowDataMapper.LONG_NAN_SENTINEL) {
              builder.put(name, ScaledDecimal4(lv4))
            }

          case DataType.ScaledDecimal6Type =>
            val lv6: Long = v1.getLong(remoteName)
            if (lv6 != ClickHouseRowDataMapper.LONG_NAN_SENTINEL) {
              builder.put(name, ScaledDecimal6(lv6))
            }

          case DataType.ScaledDecimal8Type =>
            val lv8: Long = v1.getLong(remoteName)
            if (lv8 != ClickHouseRowDataMapper.LONG_NAN_SENTINEL) {
              builder.put(name, ScaledDecimal8(lv8))
            }

          case _ =>
            logger.warn(s"Unexpected column type: ${col.dataType}")
        }
      }

      i += 1
    }

    val primaryKey = v1.getString(remoteKeyName)
    RowWithData(primaryKey, builder.toMap)
  }

}
