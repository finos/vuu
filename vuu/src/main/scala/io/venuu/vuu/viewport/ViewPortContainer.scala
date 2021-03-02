/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.
  *
  * Created by chris on 27/03/15.
  *
  */
package io.venuu.vuu.viewport

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.jmx.{JmxAble, MetricsProvider}
import io.venuu.toolbox.text.AsciiUtil
import io.venuu.toolbox.thread.RunInThread
import io.venuu.toolbox.time.Clock
import io.venuu.toolbox.time.TimeIt.timeIt
import io.venuu.vuu.api.Link
import io.venuu.vuu.core.filter.{Filter, FilterSpecParser, NoFilter}
import io.venuu.vuu.core.groupby.GroupBySessionTableImpl
import io.venuu.vuu.core.sort._
import io.venuu.vuu.core.table.{Column, TableContainer}
import io.venuu.vuu.net.{ClientSessionId, FilterSpec, SortSpec}
import io.venuu.vuu.util.PublishQueue
import io.venuu.vuu.{core, viewport}

import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicReference
import scala.jdk.CollectionConverters.{CollectionHasAsScala, IteratorHasAsScala, SetHasAsScala}
import scala.util.{Failure, Success, Try}

trait ViewPortContainerMBean {
  def listViewPorts: String
  def listViewPortsForSession(clientSession: ClientSessionId): List[ViewPort]
  def toAscii(vpId: String): String
  def subscribedKeys(vpId: String): String
  def setRange(vpId: String, start: Int, end: Int): String
  def openGroupByKey(vpId: String, treeKey: String): String
  def closeGroupByKey(vpId: String, treeKey: String): String
}

class ViewPortContainer(tableContainer: TableContainer)(implicit timeProvider: Clock, metrics: MetricsProvider) extends RunInThread with StrictLogging with JmxAble with ViewPortContainerMBean {

  private val groupByhistogram = metrics.histogram("org.whitebox.vs.thread.groupby.cycleTime")
  private val viewPorthistogram = metrics.histogram("org.whitebox.vs.thread.viewport.cycleTime")

  def removeViewPort(vpId: String) = {
    this.viewPorts.get(vpId) match {
      case null =>
        logger.error(s"Could not find viewport to remove ${vpId}")
      case vp: ViewPort =>
        logger.info(s"Removing ${vpId} from container")
        this.viewPorts.remove(vp.id)
    }
  }

  def disableViewPort(vpId: String) = {
    this.viewPorts.get(vpId) match {
      case null =>
        logger.error(s"Could not find viewport to disable ${vpId}")
      case vp: ViewPort =>
        vp.setEnabled(false)
        logger.info(s"Disabled ${vpId} in container")
    }
  }

  def enableViewPort(vpId: String) = {
    this.viewPorts.get(vpId) match {
      case null =>
        logger.error(s"Could not find viewport to enable ${vpId}")
      case vp: ViewPort =>
        vp.setEnabled(true)
        logger.info(s"Enabled ${vpId} in container")
    }
  }

  override def openGroupByKey(vpId: String, treeKey: String): String = {
    Try(this.openNode(vpId, treeKey)) match {
      case Success(_) => "Done"
      case Failure(e) =>
        logger.error("Could not invoke jmx", e)
        "error occured: " + e.toString
    }
  }

  override def closeGroupByKey(vpId: String, treeKey: String): String = {
    Try(this.closeNode(vpId, treeKey)) match {
      case Success(_) => "Done"
      case Failure(e) =>
        logger.error("Could not invoke jmx", e)
        "error occured: " + e.toString
    }
  }

  override def setRange(vpId: String, start: Int, end: Int): String = {
    viewPorts.get(vpId) match {
      case null =>
        s"No viewport found for id ${vpId}"
      case vp: ViewPort =>
        vp.setRange(ViewPortRange(start, end))
        "Done"
    }
  }


  override def subscribedKeys(vpId: String): String = {
    //    viewPorts.get(vpId) match {
    //      case null =>
    //       s"no viewport found for id ${vpId}"
    //      case vp: ViewPort =>
    //        vp.getKeysInRange()
    //    }
    ""
  }

  override def listViewPortsForSession(clientSession: ClientSessionId): List[ViewPort] = {
    IteratorHasAsScala(viewPorts.values().iterator())
      .asScala
      .filter( vp => vp.session.equals(clientSession)).toList
  }

  override def listViewPorts: String = {

    val headers = Array("id", "table", "rangeFrom", "rangeTo")

    val data = SetHasAsScala(viewPorts.entrySet())
                .asScala
                .map(vp => Array[Any](vp.getKey, vp.getValue.table.name, vp.getValue.getRange().from, vp.getValue.getRange().to)).toArray[Array[Any]]

    AsciiUtil.asAsciiTable(headers, data)
  }

  override def toAscii(vpId: String): String = {
    viewPorts.get(vpId) match {
      case null => s"No viewport found for id ${vpId}"
      case vp: ViewPort =>
        val columns = vp.getColumns
        val keys = vp.getKeysInRange()

        val rows = keys.toArray.map(key => vp.table.pullRowAsArray(key, columns))

        val headers = if (vp.hasGroupBy)
          Array[String]("depth", "isOpen", "key", "isLeaf") ++ columns.map(_.name).toArray[String]
        else
          columns.map(_.name).toArray

        AsciiUtil.asAsciiTable(headers, rows)
    }
  }

  private val viewPorts: ConcurrentHashMap[String, ViewPort] = new ConcurrentHashMap[String, ViewPort]()

  private def createId(user: String): String = {
    val id = user + "-" + UUID.randomUUID().toString
    id
  }

  def get(clientSession: ClientSessionId, id: String): Option[ViewPort] = {

    val viewport = viewPorts.get(id)

    if (viewport != null && viewport.session.equals(clientSession))
      Option(viewport)
    else
      None
  }

  private def parseSort(sort: SortSpec, table: RowSource): Sort = {
    if (!sort.sortDefs.isEmpty)
      GenericSort(sort, table.asTable.columnsForNames(sort.sortDefs.map(sd => sd.column)))
    else
      NoSort
  }

  private def parseFilter(filterSpec: FilterSpec): Filter = {
    if (filterSpec == null || filterSpec.filter == "")
      NoFilter
    else {
      Try(FilterSpecParser.parse(filterSpec.filter)) match {
        case Success(clause) =>
          AntlrBasedFilter(clause)
        case Failure(err) =>
          logger.error(s"could not parse filter ${filterSpec.filter}", err)
          NoFilter
      }
    }
  }

  def change(clientSession: ClientSessionId, id: String, range: ViewPortRange, columns: List[Column], sort: SortSpec = SortSpec(List()), filterSpec: FilterSpec = FilterSpec(""), groupBy: GroupBy = NoGroupBy) = {

    val viewPort = viewPorts.get(id)

    if (viewPort == null) {
      throw new Exception(s"view port not found ${id}")
    }

    val aSort = parseSort(sort, viewPort.table)

    val aFilter = parseFilter(filterSpec)

    val filtAndSort = UserDefinedFilterAndSort(aFilter, aSort)

    //if we're flipping between a non-group by and a group by
    val structure = if (viewPort.getGroupBy == NoGroupBy && groupBy != NoGroupBy) {

      val sourceTable = viewPort.table

      val sessionTable = tableContainer.createGroupBySessionTable(sourceTable, clientSession)

      viewport.ViewPortStructuralFields(table = sessionTable, columns = columns, filtAndSort = filtAndSort, filterSpec = filterSpec, groupBy = groupBy, viewPort.getTreeNodeState)

      //or if we've reverted back to non-group by from group-by
    } else if (viewPort.getGroupBy != NoGroupBy && groupBy == NoGroupBy) {

      val sourceTable = viewPort.table.asTable.asInstanceOf[GroupBySessionTableImpl].sourceTable

      viewport.ViewPortStructuralFields(table = sourceTable, columns = columns, filtAndSort = filtAndSort, filterSpec = filterSpec, groupBy = groupBy, viewPort.getTreeNodeState)

    } else {

      viewport.ViewPortStructuralFields(table = viewPort.table, columns = columns, filtAndSort = filtAndSort, filterSpec = filterSpec, groupBy = groupBy, viewPort.getTreeNodeState)
    }

    viewPort.changeStructure(structure)

    viewPort
  }

  def create(clientSession: ClientSessionId, outboundQ: PublishQueue[ViewPortUpdate], highPriorityQ: PublishQueue[ViewPortUpdate], table: RowSource,
             range: ViewPortRange, columns: List[Column], sort: SortSpec = SortSpec(List()), filterSpec: FilterSpec = FilterSpec(""), groupBy: GroupBy = NoGroupBy): ViewPort = {

    val id = createId(clientSession.user)

    val aSort = parseSort(sort, table)

    val aFilter = parseFilter(filterSpec)

    val filtAndSort = core.sort.UserDefinedFilterAndSort(aFilter, aSort)

    val aTable = if(groupBy == NoGroupBy){
        table
    }else{
      tableContainer.createGroupBySessionTable(table, clientSession)
    }

    val structural = viewport.ViewPortStructuralFields(aTable, columns, filtAndSort, filterSpec, groupBy, ClosedTreeNodeState)

    val viewPort = ViewPortImpl(id, clientSession, outboundQ, highPriorityQ, new AtomicReference[ViewPortStructuralFields](structural), new AtomicReference[ViewPortRange](range))

    viewPorts.put(id, viewPort)

    viewPort
  }

  def changeRange(clientSession: ClientSessionId, outboundQ: PublishQueue[ViewPortUpdate], vpId: String, range: ViewPortRange): ViewPort = {

    val vp = viewPorts.get(vpId)

    logger.info("VP Range [{}] {}->{}, was {}->{}", vpId, range.from, range.to, vp.getRange().from, vp.getRange().to)

    vp.setRange(range)

    vp
  }

  def openNode(viewPortId: String, treeKey: String): Unit = {

    logger.info(s"Had request to change vp ${viewPortId} node state $treeKey")

    val viewPort = viewPorts.get(viewPortId)

    viewPort.table match {
      case gbsTable: GroupBySessionTableImpl => gbsTable.openTreeKey(treeKey)
      case other => logger.info(s"Cannnot open node in non group by table ${other.name}")
    }
  }

  def closeNode(viewPortId: String, treeKey: String): Unit = {
    val viewPort = viewPorts.get(viewPortId)

    viewPort.table match {
      case gbsTable: GroupBySessionTableImpl => gbsTable.closeTreeKey(treeKey)
      case other => logger.info(s"Cannnot open node in non group by table ${other.name}")
    }
  }

  def changeSelection(clientSession: ClientSessionId, outboundQ: PublishQueue[ViewPortUpdate], vpId: String, selection: ViewPortSelection): ViewPort = {
    val viewPort = viewPorts.get(vpId)
    viewPort.setSelection(selection.indices)
    viewPort
  }

  def linkViewPorts(clientSession: ClientSessionId, outboundQ: PublishQueue[ViewPortUpdate], childVpId: String, parentVpId: String, childColumnName: String, parentColumnName: String) = {
    get(clientSession, childVpId) match {
      case Some(child) =>
        get(clientSession, parentVpId) match {
          case Some(parent) =>
            val parentColumn = parent.table.asTable.columnForName(parentColumnName)
            val childColumn = child.table.asTable.columnForName(childColumnName)
            child.setVisualLink(ViewPortVisualLink(child, parent, childColumn, parentColumn))
          case None =>
            throw new Exception("Could not find parent viewport" + parentVpId)
        }
      case None =>
        throw new Exception("Could not find child viewport" + childVpId)
    }
  }

  /**
    * Called by dedicated viewport runner thread to populate viewport keys.
    */
  def runOnce(): Unit = {

    val (millis, _ ) = timeIt {
      CollectionHasAsScala(viewPorts.values()).asScala.filter(vp => !vp.hasGroupBy && vp.isEnabled).foreach(vp => refreshOneViewPort(vp))
    }

    viewPorthistogram.update(millis)
  }

  /**
    * Called by dedicated groupby runner thread to build the trees for each groupby and
    * put the relevant tree keys back into the viewport
    */
  def runGroupByOnce(): Unit = {

    val (millis, _ ) = timeIt{
      CollectionHasAsScala(viewPorts.values()).asScala.filter( vp => vp.hasGroupBy && vp.isEnabled).foreach(vp => refreshOneGroupByViewPort(vp))
    }

    groupByhistogram.update(millis)
  }

  protected def refreshOneGroupByViewPort(viewPort: ViewPort) = {

    val table = viewPort.table.asTable

    logger.debug("Building tree for groupBy")

    table match {
      case tbl: GroupBySessionTableImpl =>

        val tree = GroupByTreeBuilder(tbl, viewPort.getGroupBy, viewPort.filterSpec, Option(tbl.getTree)).build()

        //CJS Always set tree first, otherwise it is null when trying to retrieve treekey to key mapping.
        tbl.setTree(tree)

        viewPort.setKeys(tree.toKeys())

      case tbl =>
        logger.error(s"GROUP-BY: table ${tbl.name} has a groupBy but doesn't have a groupBySessionTable associated. Going to ignore build request.")
    }

  }


  protected def refreshOneViewPort(viewPort: ViewPort) = {

    val keys = viewPort.table.primaryKeys

    val filterAndSort = viewPort.filterAndSort

    val sorted = filterAndSort.filterAndSort(viewPort.table, keys)

    viewPort.setKeys(sorted)
  }

  def removeForSession(clientSession: ClientSessionId) = {



    val viewports = SetHasAsScala(viewPorts.entrySet())
                      .asScala
                      .filter(entry => entry.getValue.session == clientSession).toArray

    logger.info(s"Removing ${viewports.length} on disconnect of $clientSession")

    viewports.foreach(entry => viewPorts.remove(entry.getKey))
  }

  def getViewPortVisualLinks(clientSession: ClientSessionId, vpId: String): List[(Link, ViewPort)] = {
    Option(viewPorts.get(vpId)) match {
      case Some(vp) =>
        val viewPorts = listViewPortsForSession(clientSession)
        val vpLinks = for(link <- vp.table.asTable.getTableDef.links.links ; vp <- viewPorts ;  if link.toTable == vp.table.linkableName) yield (link, vp)
        vpLinks
      case None =>
        List()
    }
  }

}
