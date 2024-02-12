package org.finos.vuu.core.table

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.api.{JoinSessionTableDef, JoinTableDef, SessionTableDef, TableDef}
import org.finos.vuu.core.tree.TreeSessionTableImpl
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.provider.JoinTableProvider
import org.finos.vuu.viewport.{RowSource, ViewPortTable}
import org.finos.toolbox.jmx.{JmxAble, MetricsProvider}
import org.finos.toolbox.time.Clock

import java.util.concurrent.ConcurrentHashMap
import scala.jdk.CollectionConverters._

trait TableContainerMBean {
  def tableList: String

  def toAscii(name: String): String

  def toAsciiRange(name: String, start: Int, end: Int): String

  def getTables(): Array[ViewPortTable]

  def getSubscribedKeys(name: String): String
}

class TableContainer(val joinTableProvider: JoinTableProvider)(implicit val metrics: MetricsProvider, clock: Clock) extends JmxAble with TableContainerMBean with StrictLogging {

  private val tables = new ConcurrentHashMap[String, DataTable]()

  //private val sessionTables = new ConcurrentHashMap[String, GroupBySessionTable]()

  override def getSubscribedKeys(name: String): String = {
    val table = tables.get(name)

    if (table == null)
      s"table not found with name $name"
    else {
      val obByKey = table.getObserversByKey()
      obByKey.map({ case (key, obs) => s"key=$key,obs=${obs.mkString(",")}" }).mkString("\n")
    }
  }

  override def toAscii(name: String): String = {
    val table = tables.get(name)

    if (table == null)
      "Table not found"
    else
      table.toAscii(500)
  }

  override def toAsciiRange(name: String, start: Int, end: Int): String = {
    val table = tables.get(name)

    if (table == null)
      "Table not found"
    else
      table.toAscii(start, end)
  }


  override def tableList: String = {
    IteratorHasAsScala(tables.keySet().iterator()).asScala.mkString("\n")
  }

  //  override def sessionTableList: String = {
  //    import scala.collection.JavaConversions._
  //    sessionTables.keySet().iterator().mkString("\n")
  //  }

  def getTables(): Array[ViewPortTable] = {
    val tableList = IteratorHasAsScala(tables.values().iterator()).asScala
    tableList
      .map(table => ViewPortTable(table.getTableDef.name, if (table.getTableDef.getModule() != null) table.getTableDef.getModule().name else "null")).toArray[ViewPortTable].sortBy(_.table)
  }

  def getNonSessionTables: Array[ViewPortTable] = {
    val tableList = IteratorHasAsScala(tables.values().iterator()).asScala
    tableList
      //.filter(!isSessionTable(_))
      .map(table => ViewPortTable(table.getTableDef.name, if (table.getTableDef.getModule() != null) table.getTableDef.getModule().name else "null")).toArray[ViewPortTable].sortBy(_.table)
  }

  private def isSessionTable(table: DataTable): Boolean = {
    table.getTableDef.isInstanceOf[SessionTableDef] || table.getTableDef.isInstanceOf[JoinSessionTableDef] ||
      table.isInstanceOf[SessionTable]
  }


  def getTable(name: String): DataTable = {
    tables.get(name)
  }

  def addTable(table: DataTable): Unit = {
    tables.put(table.name, table)
  }

  def createAutoSubscribeTable(tableDef: TableDef): DataTable = {

    val table = new AutoSubscribeTable(tableDef, joinTableProvider)

    tables.put(table.getTableDef.name, table)

    table
  }

  def createTable(tableDef: TableDef): DataTable = {
    val table = new InMemDataTable(tableDef, joinTableProvider)
    tables.put(table.getTableDef.name, table)
    table
  }

  def createTreeSessionTable(source: RowSource, session: ClientSessionId): TreeSessionTableImpl = {
    val table = new TreeSessionTableImpl(source, session, joinTableProvider)
    //source.addSessionListener(table)
    val existing = tables.put(table.name, table)
    assert(existing == null, "we should never replace an existing table with session id name:" + table.name + " existing" + existing.name)
    table
  }

  def createSimpleSessionTable(source: RowSource, session: ClientSessionId): InMemSessionDataTable = {
    val table = new InMemSessionDataTable(session, source.asTable.getTableDef.asInstanceOf[SessionTableDef], joinTableProvider)
    val existing = tables.put(table.name, table)
    assert(existing == null, "we should never replace an existing table with session id")
    table
  }

  def removeGroupBySessionTable(source: RowSource): Unit = {
    assert(tables.remove(source.name) != null)
  }

  def createJoinTable(table: JoinTableDef): DataTable = {

    val baseTable = tables.get(table.baseTable.name)
    val joinTableMap = table.joins.map(join => join.table.name -> tables.get(join.table.name)).toMap //tables.get(table.right.name)
    val baseTableMap = Map[String, DataTable](table.baseTable.name -> baseTable)

    val sourceTables = joinTableMap ++ baseTableMap

    val joinTable = new JoinTable(table, sourceTables, joinTableProvider)

    tables.put(joinTable.getTableDef.name, joinTable)

    joinTableProvider.addJoinTable(joinTable)

    joinTable
  }

  def removeSessionTables(session: ClientSessionId): Unit = {
    val sessionTables = SetHasAsScala(tables.entrySet()).asScala
      .filter(entry => entry.getValue.isInstanceOf[SessionTable])
      .filter(entry => entry.getValue.asInstanceOf[SessionTable].sessionId == session)
      .map(_.getValue.asInstanceOf[SessionTable])
      .toArray

    logger.info(s"Removing ${sessionTables.length} session tables on disconnect of $session")

    sessionTables.foreach(sessTable => tables.remove(sessTable.name))
  }

}
