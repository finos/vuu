package io.venuu.vuu.provider

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.api.{JoinTableDef, TableDef}
import io.venuu.vuu.core.table.{DataTable, JoinTable, JoinTableUpdate, RowWithData}
import io.venuu.vuu.provider.join.{JoinDefToJoinTable, JoinManagerEventDataSink, JoinRelations, RightToLeftKeys}

import java.util
import java.util.concurrent.{ArrayBlockingQueue, ConcurrentHashMap}

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
class VuuJoinTableProvider(implicit timeProvider: Clock, lifecyle: LifecycleContainer, metrics: MetricsProvider) extends JoinTableProvider with StrictLogging {

  lifecyle(this)

  private val outboundQueue = new ArrayBlockingQueue[JoinTableUpdate](20000)
  private val joinRelations = new JoinRelations()
  private val joinSink = new JoinManagerEventDataSink()
  private val rightToLeftKeys = new RightToLeftKeys()

  @volatile private var joinDefs = List[JoinDefToJoinTable]()

  private val sourceTableDefsByName = new ConcurrentHashMap[String, TableDef]()

  override def hasJoins(tableName: String): Boolean = {
    joinDefs.find(defAndTable => defAndTable.joinDef.containsTable(tableName)) match {
      case Some(_) => true
      case None => false
    }
  }

  def publishUpdateForLeftTableAndKey(joinTableDef: JoinTableDef, JoinTable: JoinTable, leftTableName: String, leftKey: String, ev: util.HashMap[String, Any]): Unit = {
    //get cached data (actually do we need to do this..)
    //val cachedEventData = joinSink.getEventDataSink(leftTableName).getEventState(leftKey)

    //get right keys and tables
    val rowJoin = joinRelations.getJoinsForEvent(leftTableName, leftKey)

    val isDeleted = ev.get("_isDeleted").asInstanceOf[Boolean]

    val leftKeys = rowJoin.toMap() ++ Map(leftTableName + "._isDeleted" -> isDeleted)

    val toPublishData = joinTableDef.joins.foldLeft(Map[String, Any]())((map, joinTo) => {

      val rightTable = joinTo.table.name
      val rightColumn = joinTo.table.keyField

      val rightKeyValue = leftKeys.get(joinTableDef.baseTable.name + "." + joinTo.joinSpec.left) match {
        case null =>
          logger.warn("get right key, null")
          null
        case None =>
          logger.warn("get right key, None")
          null
        case Some(x: String) => x
        case Some(x) => x.toString
      }

      val sinkData = joinSink.getEventDataSink(rightTable).getEventState(rightKeyValue)

      val rightValueToSend = joinSink.getEventDataSink(rightTable).getEventState(rightKeyValue) match {
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

    logger.debug("join table data:" + toPublishData)

    val rowWithData = RowWithData(leftKey, toPublishData)

    val jtu = JoinTableUpdate(JoinTable, rowWithData, timeProvider.now())

    logger.debug("[JoinTableProvider] Submitting joint table event:" + jtu)

    //get the processing off the esper thread
    outboundQueue.offer(jtu)
  }

  def eventToRightKey(joinTableDef: JoinTableDef, tableName: String, ev: util.HashMap[String, Any], rightColumn: String): String = {
    //val keyName = joinTableDef.keyFieldForTable(tableName)

    ev.get(rightColumn) match {
      case null => null
      case s: String => s
      case x => x.toString
    }
  }

  def leftColumnAsRightKey(joinTableDef: JoinTableDef, tableName: String, ev: util.HashMap[String, Any], leftColumn: String): String = {
    ev.get(leftColumn) match {
      case null => null
      case s: String => s
      case x => x.toString
    }
  }

  def eventToLeftKey(joinTableDef: JoinTableDef, ev: util.HashMap[String, Any]): String = {
    ev.get(joinTableDef.baseTable.keyField).toString
  }

  def eventToKey(tableName: String, ev: util.HashMap[String, Any]): String = {
    val keyField = sourceTableDefsByName.get(tableName).keyField
    ev.get(keyField).toString
  }

  def addRightKeysForLeftKey(joinTableDef: JoinTableDef, tableName: String, ev: util.HashMap[String, Any]): Unit = {

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

    joinSink.getEventDataSink(tableName).putEventState(eventToKey(tableName, ev), ev)

    //pseudo code
    //for each join in join defs, does tableName participate?
    joinDefs.foreach(defAndTable => {

      val joinTableDef = defAndTable.joinDef
      val joinTable = defAndTable.table

      //if join contains table...
      if (joinTableDef.containsTable(tableName)) {

        logger.debug("processing event:" + ev + " for table:" + tableName + " in join:" + joinTableDef.name)

        //does it participate as a left table?
        if (joinTableDef.isLeftTable(tableName)) {

          joinRelations.addRowJoins(joinTableDef, ev)

          addRightKeysForLeftKey(joinTableDef, tableName, ev)

          //if so, publish a left table event for the right inbound event
          publishUpdateForLeftTableAndKey(joinTableDef, joinTable.asInstanceOf[JoinTable], tableName, eventToLeftKey(joinTableDef, ev), ev)

          //otherwise must be a right table
        } else {

          val keyName = joinTableDef.keyFieldForTable(tableName)

          val rightKey = eventToRightKey(joinTableDef, tableName, ev, keyName)

          //get left table keys for right table event
          val leftKeys = rightToLeftKeys.getLeftTableKeysForRightKey(tableName, rightKey, joinTableDef.baseTable.name)

          //for each key in left table, send left update, including additional keys
          leftKeys.foreach(key => {
            logger.debug(s"Publishing update for left key: ${key}")
            publishUpdateForLeftTableAndKey(joinTableDef, joinTable.asInstanceOf[JoinTable], joinTableDef.baseTable.name, key, joinSink.getEventDataSink(joinTableDef.baseTable.name).getEventState(key))
          })
        }
      } else {
        //do nothing... we're not part of this join
      }
    })
  }

  override def addJoinTable(join: DataTable): Unit = {

    logger.info("Adding joinDef for " + join.getTableDef.name)

    val tableDef = join.getTableDef.asInstanceOf[JoinTableDef]
    joinDefs = joinDefs ++ List(JoinDefToJoinTable(tableDef, join))
    joinSink.addSinkForTable(tableDef.name)
    sourceTableDefsByName.put(tableDef.baseTable.name, tableDef.baseTable)

    tableDef.rightTables.foreach(rightTable => {
      joinSink.addSinkForTable(rightTable)
    })

    tableDef.joins.foreach(joinTo => sourceTableDefsByName.put(joinTo.table.name, joinTo.table))
  }

  override def start(): Unit = {}

  private def isPrimaryKeyDeleted(jtu: JoinTableUpdate): Boolean = {
    val tableDef = jtu.joinTable.asInstanceOf[JoinTable].tableDef
    val columnName = tableDef.baseTable.deleteColumnName()
    val deleteColumn = jtu.rowUpdate.data.get(columnName)

    deleteColumn match {
      case Some(bool: Boolean) => bool
      case _ => false
    }
  }

  override def runOnce(): Unit = {
    val updates = new java.util.ArrayList[JoinTableUpdate](100)

    outboundQueue.drainTo(updates) match {

      case 0 => //is fine, means no work today
      case count: Int =>
        (0 until count).foreach(i => {
          val jtu = updates.get(i)

          if (isPrimaryKeyDeleted(jtu)) jtu.joinTable.processDelete(jtu.rowUpdate.key)
          else
            jtu.joinTable.processUpdate(jtu.rowUpdate.key, jtu.rowUpdate, jtu.time)
        })
    }
  }

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override def drainQueue_ForTesting(): (Int, util.ArrayList[JoinTableUpdate]) = {
    val updates = new java.util.ArrayList[JoinTableUpdate](100)
    val count = outboundQueue.drainTo(updates)
    (count, updates)
  }

  override val lifecycleId: String = "vuuJoinTableProvider"
}

