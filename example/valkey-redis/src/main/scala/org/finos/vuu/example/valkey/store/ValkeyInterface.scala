package org.finos.vuu.example.valkey.store

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.example.valkey.factory.ValkeyConnectionPool

import java.util.concurrent.atomic.AtomicInteger
import scala.jdk.CollectionConverters.{CollectionHasAsScala, MapHasAsScala}

class ValkeyInterface extends StrictLogging {

  def loadRecordsInRange(table: String, from: Int, to: Int)(implicit pool: ValkeyConnectionPool): (Int, List[(Map[String, Any], Int)]) = {

    logger.info("Getting connection....")

    val connection = pool.getConnection()

    logger.info("Getting zrange....")

    val keys = connection.zrange(s"$table.id.pk", from, to)

    logger.info("Getting zcount....")

    val tableSize = connection.zcount(s"$table.id.pk", "-inf", "+inf").toInt

    logger.info("Getting hgetAll....")

    val counter = new AtomicInteger(from)

    val rows = keys.toArray.map( k => (connection.hgetAll(s"$table:" + k.toString).asScala.toMap, counter.getAndIncrement())).toList

    logger.info("return")

    connection.close()

    (tableSize, rows)
  }

  def loadRecordsInRangeByIndex(table: String, index: String, from: Int, to: Int)(implicit pool: ValkeyConnectionPool): (Int, List[(Map[String, Any], Int)]) = {

    logger.info("Getting connection....")

    val connection = pool.getConnection()

    logger.info("Getting zrange....")

    val keysWithVals = connection.zrange(s"$table.$index.idx", from, to).asScala

    val keys = keysWithVals.map( kv => kv.split(":")(1)).toList

    logger.info("Getting zcount....")

    val tableSize = connection.zcount(s"$table.$index.idx", "-inf", "+inf").toInt

    logger.info("Getting hgetAll....")

    val counter = new AtomicInteger(from)

    val rows = keys.toArray.map( k => (connection.hgetAll(s"$table:" + k.toString).asScala.toMap, counter.getAndIncrement())).toList

    logger.info("return")

    connection.close()

    (tableSize, rows)
  }

  def loadRecordsInRevRangeByIndex(table: String, index: String, from: Int, to: Int)(implicit pool: ValkeyConnectionPool): (Int, List[(Map[String, Any], Int)]) = {

    logger.info("Getting connection....")

    val connection = pool.getConnection()

    logger.info("Getting zrange....")

    val keysWithVals = connection.zrevrange(s"$table.$index.idx", from, to).asScala

    val keys = keysWithVals.map( kv => kv.split(":")(1)).toList

    logger.info("Getting zcount....")

    val tableSize = connection.zcount(s"$table.$index.idx", "-inf", "+inf").toInt

    logger.info("Getting hgetAll....")

    val counter = new AtomicInteger(from)

    val rows = keys.toArray.map( k => (connection.hgetAll(s"$table:" + k.toString).asScala.toMap, counter.getAndIncrement())).toList

    logger.info("return")

    connection.close()

    (tableSize, rows)
  }

}
