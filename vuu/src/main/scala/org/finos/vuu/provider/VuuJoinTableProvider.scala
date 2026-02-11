package org.finos.vuu.provider

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.queue.BinaryPriorityBlockingQueue
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.vuu.api.{JoinTableDef, TableDef}
import org.finos.vuu.core.VuuJoinTableProviderOptions
import org.finos.vuu.core.table.{JoinTable, RowWithData}
import org.finos.vuu.provider.join.{JoinDefToJoinTable, JoinManagerEventDataSink, JoinRelations, JoinTableDeleteRow, JoinTableUpdate, JoinTableUpdateRow, RightToLeftKeys}

import java.util
import java.util.concurrent.{ConcurrentHashMap, TimeUnit}
import scala.concurrent.duration.Duration

/**
 * A native join table provider, this maintains a data structure of:
 *
 * example = "orders" = { orderId = 1,  latest    -> { orderId = 1, ric = VOD.L },
 * joins     -> [prices.ric]
 * joinData  -> { prices = [ "VOD.L" ] },
 * orderId = 2, { prices = [ "VOD.L" ],
 * orderId = 3, { prices = [ "VOD.L" ],
 * }
 * "prices" = { ric = "VOD.L", { orders = [ 1, 2 ,3 ] } //reverse map of ids
 *
 * so if we tick prices VOD.L, we will then output three records:
 *
 * { "order.orderId" -> 1, "orders.ric" -> "VOD.L", "prices.ric" -> "VOD.L" }
 * { "order.orderId" -> 2, "orders.ric" -> "VOD.L", "prices.ric" -> "VOD.L" }
 * { "order.orderId" -> 3, "orders.ric" -> "VOD.L", "prices.ric" -> "VOD.L" }
 *
 * Or a more complicated example:
 *
 * Instruments, Orders and Prices
 *
 * and we create an instrumentPrices and an orderInstrumentPrices:
 * //primary key in base model
 * example = "orders" = { orderId = 1, { prices -> [ "VOD.L" ]
 * instruments -> [ "VOD.L" ]
 * },
 * orderId = 2, { prices -> [ "VOD.L" ]
 * instruments -> [ "VOD.L" ]
 * },
 * orderId = 3, { prices -> [ "VOD.L" ]
 * instruments -> [ "VOD.L" ]
 * },
 * }
 */
class VuuJoinTableProvider(options: VuuJoinTableProviderOptions)(implicit lifecycle: LifecycleContainer) extends JoinTableProvider with StrictLogging {

  lifecycle(this)

  private val outboundQueue = BinaryPriorityBlockingQueue[JoinTableUpdate](options.maxQueueSize)
  private val queuePollDuration = Duration.create(150, TimeUnit.MILLISECONDS)
  private val inboundQueueSink = ThreadLocal.withInitial(() => new util.ArrayList[JoinTableUpdate](options.batchSize))
  private val joinRelations = new JoinRelations()
  private val joinSink = new JoinManagerEventDataSink()
  private val rightToLeftKeys = new RightToLeftKeys()
  private val tableToJoinDefinitions = new ConcurrentHashMap[String, Array[JoinDefToJoinTable]]()
  private val sourceTableDefsByName = new ConcurrentHashMap[String, TableDef]()

  override def hasJoins(tableName: String): Boolean = {
    tableToJoinDefinitions.containsKey(tableName)
  }

  private def publishUpdateForLeftTableAndKey(joinTableDef: JoinTableDef, joinTable: JoinTable,
                                              leftTableName: String, leftKey: String, ev: util.HashMap[String, Any],
                                              isJoinEvent: Boolean
                                             ): Unit = {

    if (ev.get("_isDeleted").asInstanceOf[Boolean]) {
      val deleteRowUpdate = JoinTableDeleteRow(joinTable, leftKey)
      queueJoinTableUpdate(deleteRowUpdate, isJoinEvent)
      return
    }

    //get right keys and tables
    val rowJoin = joinRelations.getJoinsForEvent(leftTableName, leftKey)

    val leftKeys: Map[String, Any] = rowJoin.toMap

    val toPublishData = joinTableDef.joins.foldLeft(Map[String, Any]())((map, joinTo) => {

      val rightTable = joinTo.table.name
      val rightColumn = joinTo.table.keyField

      val rightKeyValue = leftKeys.get(joinTableDef.baseTable.name + "." + joinTo.joinSpec.left) match {
        case null =>
          logger.warn(s"get right key from ${joinTableDef.baseTable.name}.${joinTo.joinSpec.left}, null")
          null
        case None =>
          logger.warn(s"get right key from ${joinTableDef.baseTable.name}.${joinTo.joinSpec.left}, None")
          null
        case Some(x: String) => x
        case Some(x) => x.toString
      }

      val sinkData = joinSink.getEventDataSink(rightTable).getEventState(rightKeyValue)

      val rightValueToSend = sinkData match {
        case null => null
        case map: java.util.HashMap[String, Any] => rightKeyValue
      }

      val isDeleted = if (sinkData != null) {
        sinkData.get("_isDeleted") match {
          case null => null
          case false => false
          case true => true
        }
      } else {
        null
      }

      map ++ Map(rightTable + "." + rightColumn -> rightValueToSend, rightTable + "._isDeleted" -> isDeleted)
    }) ++ leftKeys

    val rowWithData = RowWithData(leftKey, toPublishData)
    val jtu = JoinTableUpdateRow(joinTable, rowWithData)
    queueJoinTableUpdate(jtu, isJoinEvent)
  }

  private def queueJoinTableUpdate(joinTableUpdate: JoinTableUpdate, isJoinEvent: Boolean): Unit = {
    logger.trace(s"[JoinTableProvider] Submitting join table event: $joinTableUpdate")
    if (isJoinEvent) {
      outboundQueue.putHighPriority(joinTableUpdate)
    } else {
      outboundQueue.put(joinTableUpdate)
    }
  }

  private def eventToRightKey(joinTableDef: JoinTableDef, tableName: String, ev: util.HashMap[String, Any], rightColumn: String): String = {
    //val keyName = joinTableDef.keyFieldForTable(tableName)

    ev.get(rightColumn) match {
      case null => null
      case s: String => s
      case x => x.toString
    }
  }

  private def leftColumnAsRightKey(joinTableDef: JoinTableDef, tableName: String, ev: util.HashMap[String, Any], leftColumn: String): String = {
    ev.get(leftColumn) match {
      case null => null
      case s: String => s
      case x => x.toString
    }
  }

  private def eventToLeftKey(joinTableDef: JoinTableDef, ev: util.HashMap[String, Any]): String = {
    ev.get(joinTableDef.baseTable.keyField).toString
  }

  private def eventToKey(tableName: String, ev: util.HashMap[String, Any]): String = {
    val keyField = sourceTableDefsByName.get(tableName).keyField
    ev.get(keyField).toString
  }

  private def addRightKeysForLeftKey(joinTableDef: JoinTableDef, tableName: String, ev: util.HashMap[String, Any]): Unit = {

    val leftKeyName = joinTableDef.baseTable.keyField
    val leftTable = tableName

    joinTableDef.joins.foreach(joinTo => {

      val rightColumn = joinTo.joinSpec.right
      val rightTable = joinTo.table.name
      val leftColumn = joinTo.joinSpec.left

      ev.get(joinTableDef.baseTable.keyField) match {
        case leftKey: String =>
          val rightKey = leftColumnAsRightKey(joinTableDef, rightTable, ev, leftColumn)
          rightToLeftKeys.addRightKey(rightTable, rightKey, leftTable, leftKey)
        case null =>
      }
    })

  }

  override def sendEvent(tableName: String, ev: util.HashMap[String, Any]): Unit = {
    processEvent(tableName, ev, false)
  }

  override def sendJoinEvent(tableName: String, ev: util.HashMap[String, Any]): Unit = {
    processEvent(tableName, ev, true)
  }

  private def processEvent(tableName: String, ev: util.HashMap[String, Any], isJoinEvent: Boolean): Unit = {

    joinSink.getEventDataSink(tableName).putEventState(eventToKey(tableName, ev), ev)

    logger.trace("Starting Event Cycle...")

    tableToJoinDefinitions.get(tableName).foreach(defAndTable => {

      val joinTableDef = defAndTable.joinDef

      //does it participate as a left table? i.e. the base table of the join
      if (joinTableDef.isLeftTable(tableName)) {

        joinRelations.addRowJoins(joinTableDef, ev)

        addRightKeysForLeftKey(joinTableDef, tableName, ev)

        //if so, publish a left table event for the right inbound event
        val leftKey = eventToLeftKey(joinTableDef, ev)
        logger.trace(s"Publishing update for left key: $leftKey to table $tableName")
        publishUpdateForLeftTableAndKey(joinTableDef, defAndTable.table.asInstanceOf[JoinTable], tableName, leftKey, ev, isJoinEvent)

        //otherwise must be a right table, i.e. any one of the joinTo tables
      } else {

        val keyName = joinTableDef.keyFieldForTable(tableName)

        val rightKey = eventToRightKey(joinTableDef, tableName, ev, keyName)

        //get left table keys for right table event
        val leftKeys = rightToLeftKeys.getLeftTableKeysForRightKey(tableName, rightKey, joinTableDef.baseTable.name)

        //for each key in left table, send left update, including additional keys
        leftKeys.foreach(key => {
          logger.trace(s"Publishing update for left key: $key to table ${joinTableDef.baseTable.name}")
          publishUpdateForLeftTableAndKey(joinTableDef, defAndTable.table.asInstanceOf[JoinTable], joinTableDef.baseTable.name,
            key, joinSink.getEventDataSink(joinTableDef.baseTable.name).getEventState(key), isJoinEvent)
        })
      }
    })

    logger.trace(s"Ended Event Cycle...${System.lineSeparator()}")
  }

  override def addJoinTable(join: JoinTable): Unit = {

    logger.debug("Adding joinDef for " + join.getTableDef.name)

    val tableDef = join.getTableDef
    val joinDef = JoinDefToJoinTable(tableDef, join)

    sourceTableDefsByName.put(tableDef.baseTable.name, tableDef.baseTable)

    joinSink.addSinkForTable(tableDef.name)
    addToJoinDefinitions(tableDef.baseTable.name, joinDef)

    tableDef.rightTables.foreach(rightTable => {
      joinSink.addSinkForTable(rightTable)
      addToJoinDefinitions(rightTable, joinDef)
    })

    tableDef.joins.foreach(joinTo => sourceTableDefsByName.put(joinTo.table.name, joinTo.table))
  }

  private def addToJoinDefinitions(table: String, joinDef: JoinDefToJoinTable): Unit = {
    tableToJoinDefinitions.compute(table, (_, existingArray) => {
      if (existingArray == null) {
        Array(joinDef)
      } else {
        existingArray :+ joinDef
      }
    })
  }

  override def start(): Unit = {}

  override def runOnce(): Unit = {
    val firstItem = outboundQueue.poll(queuePollDuration)
    if (firstItem.isEmpty) {
      logger.trace("Zero join table updates to process")
      return
    }

    val updates: util.ArrayList[JoinTableUpdate] = inboundQueueSink.get()
    updates.add(firstItem.get)
    outboundQueue.drainTo(updates, options.batchSize - 1)
    val size = updates.size()

    try {
      var i = 0
      while (i < size) {
        updates.get(i) match {
          case JoinTableDeleteRow(joinTable, key) => joinTable.processDelete(key)
          case JoinTableUpdateRow(joinTable, rowWithData) => joinTable.processUpdate(rowWithData)
        }
        i += 1
      }

    } finally {
      updates.clear()
    }

    logger.trace(s"Processed $size join table updates")
  }

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {
    outboundQueue.shutdown()
  }

  override def drainQueue_ForTesting(): (Int, util.ArrayList[JoinTableUpdate]) = {
    val updates = new java.util.ArrayList[JoinTableUpdate](100)
    val count = outboundQueue.drainTo(updates)
    (count, updates)
  }

  override val lifecycleId: String = "vuuJoinTableProvider"
}

