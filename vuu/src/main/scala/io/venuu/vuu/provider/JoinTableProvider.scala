/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.

 * Created by chris on 25/08/15.

 */
package io.venuu.vuu.provider

import com.espertech.esper.client._
import com.espertech.esper.event.map.MapEventBean
import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.MetricsProvider
import io.venuu.toolbox.lifecycle.{LifecycleContainer, LifecycleEnabled}
import io.venuu.toolbox.thread.RunInThread
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.api._
import io.venuu.vuu.core.table.{DataTable, JoinTable, JoinTableUpdate, RowWithData}

import java.util
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.{ArrayBlockingQueue, ConcurrentHashMap}
import scala.jdk.CollectionConverters._
import scala.util.{Failure, Success, Try}

trait JoinTableProvider extends RunInThread with LifecycleEnabled{
  def hasJoins(tableName: String): Boolean
  def sendEvent(tableName: String, ev: java.util.HashMap[String, Any]): Unit
  def addJoinTable(join: DataTable): Unit
  def start(): Unit
}

class JoinTableProviderImpl(implicit timeProvider: Clock, lifecyle: LifecycleContainer, metrics: MetricsProvider) extends UpdateListener with StrictLogging with JoinTableProvider{

  lifecyle(this)

  private val isStopping = new AtomicBoolean(false)

  private val eventFromEsper =  metrics.counter("JoinTableProviderImpl.eventFromEsper.count")

  private var cep: EPServiceProvider = null;
  private var cepRT: EPRuntime = null

  private var cepAdm: EPAdministrator = null; //cep.getEPAdministrator();

  private val eventTypeToTableMap = new ConcurrentHashMap[String, List[DataTable]]()

  private var eventsToRegister = List[(String, util.HashMap[String, Object])]()

  private var joinDevToCreateEpl = List[JoinTableDef]()

  private val queue = new ArrayBlockingQueue[JoinTableUpdate](20000)

  def hasJoins(tableName: String): Boolean = {
    assert(eventTypeToTableMap != null, "must start jointableManager before publishing data")
    eventTypeToTableMap.containsKey(tableName)
  }

  def sendEvent(tableName: String, ev: java.util.HashMap[String, Any]): Unit = {
    assert(cepRT != null, "must start jointableManager before publishing data")

    if(!isStopping.get()) cepRT.sendEvent(ev, tableName)
  }

  def addJoinTable(join: DataTable): Unit = {

    val joinDef = join.getTableDef.asInstanceOf[JoinTableDef]

    registerEvent(joinDef, join)

    joinDevToCreateEpl = List(joinDef) ++ joinDevToCreateEpl
  }

  def runOnce(): Unit = {
    val updates = new java.util.ArrayList[JoinTableUpdate](100)

    queue.drainTo(updates) match {

      case 0 => //is fine, means no work today
      case count: Int =>  {
        (0 to (count - 1)).map( i => {
          val jtu = updates.get(i)

          if(isPrimaryKeyDeleted(jtu)){
            jtu.joinTable.processDelete(jtu.rowUpdate.key)
          }
          else
            jtu.joinTable.processUpdate(jtu.rowUpdate.key, jtu.rowUpdate, jtu.time)
        })
      }
    }
  }

  private def isPrimaryKeyDeleted(jtu: JoinTableUpdate): Boolean = {
    val tableDef      = jtu.joinTable.asInstanceOf[JoinTable].tableDef
    val columnName    = tableDef.baseTable.deleteColumnName()
    val deleteColumn  = jtu.rowUpdate.data.get(columnName)

    deleteColumn match {
      case Some(bool: Boolean) => bool
      case _ => false
    }
  }


  override def update(eventBeans: Array[EventBean], eventBeans1: Array[EventBean]): Unit = {

    eventBeans.foreach(evb => {

      val bean = evb.asInstanceOf[MapEventBean]

      val map = bean.getProperties

      val immutable = MapHasAsScala(map).asScala.toMap

      logger.debug(s"[join] Got event from queue ${immutable}")

      val sourceTableList = immutable.keySet.map( tableAndField => tableAndField.split("\\.")(0) ).toList.distinct

      //logger.info(sourceTableList.mkString(","))

      sourceTableList.foreach(sourceTableName => {
        Try(processEventForSourceTable(sourceTableName, immutable)) match {
          case Success(_) =>
          case Failure(e) =>
            logger.error(s"error occured whilst trying to process esper event ${immutable} for source table ${sourceTableName}", e)
        }
      } )

    })

  }

  def processEventForSourceTable(sourceTableName: String, immutable: Map[String, AnyRef]): Unit = {

    eventFromEsper.inc()

    val joinTables = eventTypeToTableMap.get(sourceTableName)

    joinTables.foreach(jt => {

      val jtd = jt.getTableDef.asInstanceOf[JoinTableDef]

      val leftKey = s"${jtd.baseTable.name}.${jtd.baseTable.keyField}"

      val key = immutable.get(leftKey) match{
        case Some(key: String) => key
        case _ => null
      }   //.get.asInstanceOf[String]

      //logger.debug(s"Generating joint table event for key")

      if(key != null){
        val rowWithData = RowWithData(key, immutable)

        val jtu = JoinTableUpdate(jt, rowWithData, timeProvider.now())

        logger.debug("[JoinTableProvider] Submitting joint table event:" + jtu)

        //get the processing off the esper thread
        queue.offer(jtu)
      }

    } )
  }


  private def buildEventForTable(table: TableDef): util.HashMap[String, Object] = {

    val fields = table.joinFields

    val event = new util.HashMap[String, Object]()

    fields.foreach(field => {
      val col = table.columnForName(field)
      event.put(col.name, col.dataType)
    }  )

    event.put("_isDeleted", classOf[Boolean])

    event
  }

  private def internalRegisterEvent(tableName: String, eventDef: util.HashMap[String, Object], joinTable: DataTable) = {

    if(!eventTypeToTableMap.containsKey(tableName) )
      eventTypeToTableMap.put(tableName, List(joinTable))
    else
      eventTypeToTableMap.put(tableName, joinTable :: eventTypeToTableMap.get(tableName)  )

    eventsToRegister = List[(String, util.HashMap[String, Object])]((tableName, eventDef)) ++ eventsToRegister

  }



  private def registerEvent(joinDef: JoinTableDef, joinTable: DataTable): Unit = {

    val baseTableName = joinDef.baseTable.name

    val baseTableKey  = joinDef.baseTable.keyField

    val baseEvent     = buildEventForTable(joinDef.baseTable)

    val joinEvents        = joinDef.joins.map( join => buildEventForTable(join.table) )

    internalRegisterEvent(joinDef.baseTable.name, baseEvent, joinTable)

    joinDef.joins.map(_.table).zip(joinEvents).foreach({case(table, event) => internalRegisterEvent(table.name, event, joinTable) } )

  }

  private def makeJoinStr(joinDef: JoinTableDef, joins: Seq[JoinTo]): String = {

    if(joins.isEmpty)
      ""
    else{

    val join = joins.head

    val joinType = join.joinSpec.joinType match {
      case InnerJoin => " INNER JOIN "
      case LeftOuterJoin => " LEFT OUTER JOIN "
    }

    val index = join.table.name + "." + join.joinSpec.right

    joinType + join.table.name + s".std:unique($index) AS " + join.table.name + " ON " + joinDef.baseTable.name + "." + join.joinSpec.left + " = " +
    join.table.name + "." + join.joinSpec.right + " " +
      makeJoinStr(joinDef, joins.tail)
    }
  }

  private def buildEpl(joinDef: JoinTableDef): String = {
    //s"SELECT $leftEventType.ric, $rightEventType.ric FROM $leftEventType.win:keepall() AS $leftEventType LEFT OUTER JOIN $rightEventType.win:keepall() AS $rightEventType ON $leftEventType.ric = $rightEventType.ric"

    val leftFields = (joinDef.baseTable.joinFields ++ Seq("_isDeleted")).map( columnName => joinDef.baseTable.name + "." + columnName ).mkString(",")

    val joinFields = joinDef.joins.map(join => (join.table.joinFields ++ Seq("_isDeleted")).map( columnName => join.table.name + "." + columnName ).mkString(",") ).mkString(",")

    //s"SELECT $leftFields, $joinFields FROM ${joinDef.baseTable.name}.win:keepall() AS ${joinDef.baseTable.name} " + makeJoinStr(joinDef, joinDef.joins)
    s"SELECT $leftFields, $joinFields FROM ${joinDef.baseTable.name}.std:unique($leftFields) AS ${joinDef.baseTable.name} " + makeJoinStr(joinDef, joinDef.joins)

    //std:unique
//
//
//    val onStatement = s"ON ${joinDef.left.name}.${joinDef.joinDef.leftKeyField} = ${joinDef.right.name}.${joinDef.joinDef.rightKeyField}"
//
//    s"SELECT $leftFields, $rightFields FROM ${joinDef.left.name}.win:keepall() AS ${joinDef.left.name} LEFT OUTER JOIN ${joinDef.right.name}.win:keepall() AS ${joinDef.right.name} $onStatement"

  }





  override def doStart(): Unit = {
    start()
  }

  override def doStop(): Unit = {
    logger.info("[ESPER] Stopping...")
    isStopping.set(true)
    if(cep != null) cep.destroy()
  }

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "joinManager"

  def start(): Unit = {

    logger.info("[ESPER] Starting...")

    val cepConfig = new Configuration();

    eventsToRegister.foreach({case(key, map) => {
      logger.info(s"registering event: $key definition " + MapHasAsScala(map).asScala.toMap)
      cepConfig.addEventType(key, map)
    }
    })

    cep = EPServiceProviderManager.getProvider("joinEsper@" + System.currentTimeMillis(), cepConfig);
    cepAdm = cep.getEPAdministrator();

    joinDevToCreateEpl.foreach(joinDef =>{
      val epl = buildEpl(joinDef)

      logger.info(s"registering epl query: $epl")

      val statement = cepAdm.createEPL(epl)

      statement.addListener(this)
    })

    cepRT = cep.getEPRuntime();

  }

}
