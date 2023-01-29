package org.finos.vuu.viewport

import com.codahale.metrics.Histogram
import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.time.TimeIt.timeIt
import org.finos.vuu.api.{Link, NoViewPortDef, ViewPortDef}
import org.finos.vuu.client.messages.ViewPortId
import org.finos.vuu.core.filter.{Filter, FilterSpecParser, NoFilter}
import org.finos.vuu.core.tree.TreeSessionTableImpl
import org.finos.vuu.core.sort._
import org.finos.vuu.core.table.{Column, DataTable, TableContainer}
import org.finos.vuu.net.{ClientSessionId, FilterSpec, SortSpec}
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.util.PublishQueue
import org.finos.vuu.{core, viewport}
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.jmx.{JmxAble, MetricsProvider}
import org.finos.toolbox.text.AsciiUtil
import org.finos.toolbox.thread.RunInThread
import org.finos.toolbox.time.{Clock, TimeIt}

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicReference
import scala.jdk.CollectionConverters.{CollectionHasAsScala, IteratorHasAsScala, SetHasAsScala}
import scala.jdk.javaapi.CollectionConverters
import scala.util.{Failure, Success, Try}

trait ViewPortContainerMBean {
  def listViewPorts: String

  def listViewPortsForSession(clientSession: ClientSessionId): List[ViewPort]

  def listActiveViewPortsForSession(clientSession: ClientSessionId): List[ViewPort]

  def toAscii(vpId: String): String

  def subscribedKeys(vpId: String): String

  def setRange(vpId: String, start: Int, end: Int): String

  def openGroupByKey(vpId: String, treeKey: String): String

  def closeGroupByKey(vpId: String, treeKey: String): String
}

class ViewPortContainer(val tableContainer: TableContainer, val providerContainer: ProviderContainer)(implicit timeProvider: Clock, metrics: MetricsProvider) extends RunInThread with StrictLogging with JmxAble with ViewPortContainerMBean {

  private val groupByhistogram = metrics.histogram("io.venuu.vuu.thread.groupby.cycleTime")
  private val viewPorthistogram = metrics.histogram("io.venuu.vuu.thread.viewport.cycleTime")

  val groupByHistograms = new ConcurrentHashMap[String, Histogram]()
  val viewPortHistograms = new ConcurrentHashMap[String, Histogram]()

  val viewPortDefinitions = new ConcurrentHashMap[String, (DataTable, Provider, ProviderContainer) => ViewPortDef]()

  def getViewPorts() = CollectionHasAsScala(viewPorts.values()).asScala.toList

  def callRpcCell(vpId: String, rpcName: String, session: ClientSessionId, rowKey: String, field: String, singleValue: Object): ViewPortAction = {

    val viewPort = this.getViewPortById(vpId)
    val viewPortDef = viewPort.getStructure.viewPortDef
    val asMap = viewPortDef.service.menuMap

    asMap.get(rpcName) match {
      case Some(menuItem) =>
        menuItem match {
          case cell: CellViewPortMenuItem => cell.func(rowKey, field, singleValue, session)
        }
      case None =>
        throw new Exception(s"No RPC Call for $rpcName found in viewPort $vpId")
    }
  }

  def callRpcSession(vpId: String, rpcName: String, session: ClientSessionId): ViewPortAction = {

    val viewPort = this.getViewPortById(vpId)
    val viewPortDef = viewPort.getStructure.viewPortDef
    val asMap = viewPortDef.service.menuMap

    asMap.get(rpcName) match {
      case Some(menuItem) =>
        menuItem match {
          case selection: SelectionViewPortMenuItem => selection.func(ViewPortSelection(viewPort.getSelection), session)
        }
      case None =>
        throw new Exception(s"No RPC Call for $rpcName found in viewPort $vpId")
    }
  }

  def callRpcTable(vpId: String, rpcName: String, session: ClientSessionId): ViewPortAction = {

    val viewPort = this.getViewPortById(vpId)
    val viewPortDef = viewPort.getStructure.viewPortDef
    val asMap = viewPortDef.service.menuMap

    asMap.get(rpcName) match {
      case Some(menuItem) =>
        menuItem match {
          case table: TableViewPortMenuItem => table.func(session)
        }
      case None =>
        throw new Exception(s"No RPC Call for $rpcName found in viewPort $vpId")
    }
  }

  def callRpcRow(vpId: String, rpcName: String, session: ClientSessionId, rowKey: String, rowRecord: Map[String, Object] = Map()): ViewPortAction = {

    val viewPort = this.getViewPortById(vpId)
    val viewPortDef = viewPort.getStructure.viewPortDef
    val asMap = viewPortDef.service.menuMap

    asMap.get(rpcName) match {
      case Some(menuItem) =>
        menuItem match {
          case row: RowViewPortMenuItem => row.func(rowKey, rowRecord, session)
        }
      case None =>
        throw new Exception(s"No RPC Call for $rpcName found in viewPort $vpId")
    }
  }

  def addViewPortDefinition(table: String, vpDefFunc: (DataTable, Provider, ProviderContainer) => ViewPortDef): Unit = {
    viewPortDefinitions.put(table, vpDefFunc)
  }

  def getViewPortDefinition(table: String): (DataTable, Provider, ProviderContainer) => ViewPortDef = {
    viewPortDefinitions.get(table)
  }

  def getViewPortById(vpId: String): ViewPort = {
    this.viewPorts.get(vpId)
  }

  def removeViewPort(vpId: String): Any = {
    this.viewPorts.get(vpId) match {
      case null =>
        logger.error(s"Could not find viewport to remove $vpId")
      case vp: ViewPort =>
        logger.info(s"Removing $vpId from container")
        viewPortHistograms.remove(vpId)
        vp.delete()
        this.viewPorts.remove(vp.id)
    }
  }

  def disableViewPort(vpId: String): Unit = {
    this.viewPorts.get(vpId) match {
      case null =>
        logger.error(s"Could not find viewport to disable $vpId")
      case vp: ViewPort =>
        vp.setEnabled(false)
        logger.info(s"Disabled $vpId in container")
    }
  }

  def enableViewPort(vpId: String): Unit = {
    this.viewPorts.get(vpId) match {
      case null =>
        logger.error(s"Could not find viewport to enable $vpId")
      case vp: ViewPort =>
        vp.setEnabled(true)
        logger.info(s"Enabled $vpId in container")
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
        s"No viewport found for id $vpId"
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
      .filter(vp => vp.session.equals(clientSession)).toList
  }


  override def listActiveViewPortsForSession(clientSession: ClientSessionId): List[ViewPort] = {
    IteratorHasAsScala(viewPorts.values().iterator())
      .asScala
      .filter(vp => vp.session.equals(clientSession) && vp.isEnabled).toList
  }

  override def listViewPorts: String = {

    val headers = Array("id", "table", "rangeFrom", "rangeTo")

    val data = SetHasAsScala(viewPorts.entrySet())
      .asScala
      .map(vp => Array[Any](vp.getKey, vp.getValue.table.name, vp.getValue.getRange.from, vp.getValue.getRange.to)).toArray[Array[Any]]

    AsciiUtil.asAsciiTable(headers, data)
  }

  override def toAscii(vpId: String): String = {
    viewPorts.get(vpId) match {
      case null => s"No viewport found for id $vpId"
      case vp: ViewPort =>
        val columns = vp.getColumns
        val keys = vp.getKeysInRange

        val rows = keys.toArray.map(key => vp.table.pullRowAsArray(key, columns))

        val headers = if (vp.hasGroupBy)
          Array[String]("depth", "isOpen", "key", "isLeaf") ++ columns.getColumns().map(_.name).toArray[String]
        else
          columns.getColumns().map(_.name).toArray

        AsciiUtil.asAsciiTable(headers, rows)
    }
  }

  private val viewPorts: ConcurrentHashMap[String, ViewPort] = new ConcurrentHashMap[String, ViewPort]()

  private def createId(user: String): String = {
    val id = user + "-" + ViewPortId.oneNew()
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
    if (sort.sortDefs.nonEmpty)
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

  def change(requestId: String, clientSession: ClientSessionId, id: String, range: ViewPortRange, columns: ViewPortColumns, sort: SortSpec = SortSpec(List()), filterSpec: FilterSpec = FilterSpec(""), groupBy: GroupBy = NoGroupBy): ViewPort = {

    val viewPort = viewPorts.get(id)

    if (viewPort == null) {
      throw new Exception(s"view port not found $id")
    }

    val aSort = parseSort(sort, viewPort.table)

    val aFilter = parseFilter(filterSpec)

    val filtAndSort = viewPort.getVisualLink match {
      case Some(visualLink) =>
        UserDefinedFilterAndSort(TwoStepCompoundFilter(VisualLinkedFilter(visualLink), aFilter), aSort)
      case None =>
        UserDefinedFilterAndSort(aFilter, aSort)
    }

    //we are not grouped by, but we want to change to a group by
    val structure = if (viewPort.getGroupBy == NoGroupBy && groupBy != NoGroupBy) {

      logger.info("[VP] was flat (or diff), now tree'd, building...")

      val sourceTable = viewPort.table

      val sessionTable = tableContainer.createGroupBySessionTable(sourceTable, clientSession)

      val tree = TreeBuilder.create(sessionTable, groupBy, filterSpec, columns, None, Some(aSort)).build()
      val keys = tree.toKeys()
      sessionTable.setTree(tree, keys)
      viewPort.setKeys(keys)

      logger.info("[VP] complete setKeys() " + keys.length)

      viewport.ViewPortStructuralFields(table = sessionTable,
        columns = columns,
        viewPort.getStructure.viewPortDef,
        filtAndSort = filtAndSort,
        filterSpec = filterSpec,
        groupBy = groupBy,
        viewPort.getTreeNodeState
      )



      //we are groupBy but we want to revert to no groupBy
    } else if (viewPort.getGroupBy != NoGroupBy && groupBy == NoGroupBy) {

      val groupByTable = viewPort.table.asTable.asInstanceOf[TreeSessionTableImpl]
      val sourceTable = viewPort.table.asTable.asInstanceOf[TreeSessionTableImpl].sourceTable
      //delete all observers and references
      groupByTable.delete()
      //then remove it from table container
      tableContainer.removeGroupBySessionTable(groupByTable)

      viewport.ViewPortStructuralFields(table = sourceTable,
        columns = columns,
        viewPort.getStructure.viewPortDef,
        filtAndSort = filtAndSort,
        filterSpec = filterSpec,
        groupBy = groupBy,
        viewPort.getTreeNodeState
      )

    }else if(viewPort.getGroupBy != NoGroupBy && groupBy != NoGroupBy && viewPort.getGroupBy.columns != groupBy.columns){

      logger.info("[VP] was tree'd, now tree'd also but differently, building...")

      val groupByTable = viewPort.table.asTable.asInstanceOf[TreeSessionTableImpl]
      val sourceTable = viewPort.table.asTable.asInstanceOf[TreeSessionTableImpl].sourceTable

      groupByTable.setTree(EmptyTree, ImmutableArray.empty)

      //delete all observers and references
      groupByTable.delete()
      //then remove it from table container
      tableContainer.removeGroupBySessionTable(groupByTable)

      val sessionTable = tableContainer.createGroupBySessionTable(sourceTable, clientSession)

      val tree = TreeBuilder.create(sessionTable, groupBy, filterSpec, columns, None, Some(aSort)).build()

      val keys = tree.toKeys()

      sessionTable.setTree(tree, keys)

      logger.info("[VP] complete setKeys() " + keys.length + "new group by table:" + sessionTable.name)

      val structure = viewport.ViewPortStructuralFields(table = sessionTable,
        columns = columns,
        viewPort.getStructure.viewPortDef,
        filtAndSort = filtAndSort,
        filterSpec = filterSpec,
        groupBy = groupBy,
        viewPort.getTreeNodeState
      )

      viewPort.setKeys(keys)

      structure

    } else {

      viewport.ViewPortStructuralFields(table = viewPort.table, columns = columns, viewPortDef = viewPort.getStructure.viewPortDef, filtAndSort = filtAndSort, filterSpec = filterSpec, groupBy = groupBy, viewPort.getTreeNodeState)
    }

    viewPort.setRequestId(requestId)
    viewPort.changeStructure(structure)

    viewPort
  }

  def create(requestId:String, clientSession: ClientSessionId, outboundQ: PublishQueue[ViewPortUpdate], highPriorityQ: PublishQueue[ViewPortUpdate], table: RowSource,
             range: ViewPortRange, columns: ViewPortColumns, sort: SortSpec = SortSpec(List()), filterSpec: FilterSpec = FilterSpec(""), groupBy: GroupBy = NoGroupBy): ViewPort = {

    val id = createId(clientSession.user)

    val aSort = parseSort(sort, table)

    val aFilter = parseFilter(filterSpec)

    val filtAndSort = core.sort.UserDefinedFilterAndSort(aFilter, aSort)

    val aTable = if (groupBy == NoGroupBy) {
      table
    } else {
      tableContainer.createGroupBySessionTable(table, clientSession)
    }

    val viewPortDefFunc = getViewPortDefinition(table.name);

    val viewPortDef = if (viewPortDefFunc == null) NoViewPortDef else viewPortDefFunc(table.asTable, table.asTable.getProvider, providerContainer)

    val structural = viewport.ViewPortStructuralFields(aTable, columns, viewPortDef, filtAndSort, filterSpec, groupBy, ClosedTreeNodeState)

    val viewPort = ViewPortImpl(id, clientSession, outboundQ, highPriorityQ, new AtomicReference[ViewPortStructuralFields](structural), new AtomicReference[ViewPortRange](range))

    viewPort.setRequestId(requestId)
    viewPorts.put(id, viewPort)

    viewPort
  }

  def changeRange(clientSession: ClientSessionId, outboundQ: PublishQueue[ViewPortUpdate], vpId: String, range: ViewPortRange): ViewPort = {

    val vp = viewPorts.get(vpId)
    val old = vp.getRange

    val (millis, _) = timeIt {
      vp.setRange(range)
    }

    logger.info("VP Change Range [{}] {}->{}, was {}->{}, took: {} millis", vpId, range.from, range.to, old.from, old.to, millis)

    vp
  }

  def openNode(viewPortId: String, treeKey: String): Unit = {

    logger.info(s"Had request to change vp $viewPortId node state $treeKey")

    val viewPort = viewPorts.get(viewPortId)

    viewPort.table match {
      case gbsTable: TreeSessionTableImpl =>
        gbsTable.openTreeKey(treeKey)
        viewPort.setKeysAndNotify(treeKey, gbsTable.getTree.toKeys())
      case other => logger.info(s"Cannnot open node in non group by table ${other.name}")
    }
  }

  def closeNode(viewPortId: String, treeKey: String): Unit = {
    val viewPort = viewPorts.get(viewPortId)

    viewPort.table match {
      case gbsTable: TreeSessionTableImpl =>
        gbsTable.closeTreeKey(treeKey)
        viewPort.setKeysAndNotify(treeKey, gbsTable.getTree.toKeys())
      case other => logger.info(s"Cannnot open node in non group by table ${other.name}")
    }
  }

  def changeSelection(clientSession: ClientSessionId, outboundQ: PublishQueue[ViewPortUpdate], vpId: String, selection: ViewPortSelectedIndices): ViewPort = {
    val viewPort = viewPorts.get(vpId)
    viewPort.setSelection(selection.indices)
    viewPort
  }

  def linkViewPorts(clientSession: ClientSessionId, outboundQ: PublishQueue[ViewPortUpdate], childVpId: String, parentVpId: String, childColumnName: String, parentColumnName: String): Unit = {
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

  def unlinkViewPorts(clientSession: ClientSessionId, outboundQ: PublishQueue[ViewPortUpdate], childVpId: String): Unit = {
    get(clientSession, childVpId) match {
      case Some(child) =>
        child.removeVisualLink()
      case None =>
        throw new Exception("Could not find child viewport" + childVpId)
    }
  }

  /**
   * Called by dedicated viewport runner thread to populate viewport keys.
   */
  def runOnce(): Unit = {

    val (millis, _) = timeIt {
      CollectionHasAsScala(viewPorts.values()).asScala.filter(vp => !vp.hasGroupBy).foreach(vp => {
        refreshOneViewPort(vp)
      })
    }

    viewPorthistogram.update(millis)
  }

  /**
   * Called by dedicated groupby runner thread to build the trees for each groupby and
   * put the relevant tree keys back into the viewport
   */
  def runGroupByOnce(): Unit = {

    val (millis, _) = timeIt {
      CollectionHasAsScala(viewPorts.values()).asScala.filter(vp => vp.hasGroupBy && vp.isEnabled).foreach(vp => refreshOneTreeViewPort(vp))
    }

    groupByhistogram.update(millis)
  }

  def refreshOneTreeViewPort(viewPort: ViewPort): Unit = {

    val table = viewPort.table.asTable

    logger.debug("Building tree for groupBy")

    table match {
      case tbl: TreeSessionTableImpl =>

        val oldTree      = tbl.getTree
        val oldNodeState = CollectionConverters.asScala(tbl.getTree.nodeState).toMap

        val (millis, tree) = timeIt {
          new TreeBuilderImpl(tbl, viewPort.getGroupBy, viewPort.filterSpec, viewPort.getColumns, Option(tbl.getTree), Option(viewPort.getStructure.filtAndSort.sort)).build()
        }

        val (millis2, keys) = timeIt {
          //CJS Always set tree first, otherwise it is null when trying to retrieve treekey to key mapping.
          tree.toKeys()
        }

        val (millis3, _) = timeIt {
          //CJS Always set tree first, otherwise it is null when trying to retrieve treekey to key mapping.
          tbl.setTree(tree, keys)
        }

        val (millis4, _) = timeIt {
          //CJS Always set tree first, otherwise it is null when trying to retrieve treekey to key mapping.
          viewPort.setKeys(keys)
        }

        val (millis5, _) = timeIt {

          val branchKeys = TreeUtils.diffOldVsNewBranches(oldTree, tree, oldNodeState)

          viewPort.updateSpecificKeys(branchKeys)
        }

        logger.debug(s"Tree Build: ${tbl.name}-${tbl.linkableName} build: $millis tree.toKeys: $millis2  setTree: $millis3 setKeys: $millis4")

        groupByHistograms.computeIfAbsent(viewPort.id, (s) => metrics.histogram("io.venuu.vuu.groupBy." + s)).update(millis)

      case tbl =>
        logger.error(s"GROUP-BY: table ${tbl.name} has a groupBy but doesn't have a groupBySessionTable associated. Going to ignore build request.")
    }

  }


  def refreshOneViewPort(viewPort: ViewPort): Unit = {

    if (viewPort.isEnabled) {
      val keys = viewPort.table.primaryKeys

      val filterAndSort = viewPort.filterAndSort

      val (millis, _) = TimeIt.timeIt {
        val sorted = filterAndSort.filterAndSort(viewPort.table, keys, viewPort.getColumns)
        viewPort.setKeys(sorted)
      }

      viewPortHistograms.computeIfAbsent(viewPort.id, (s) => metrics.histogram("io.venuu.vuu.groupBy." + s)).update(millis)
    } else {
      viewPort.setKeys(ImmutableArray.empty[String])
    }
  }

  def removeForSession(clientSession: ClientSessionId): Unit = {


    val viewports = SetHasAsScala(viewPorts.entrySet())
      .asScala
      .filter(entry => entry.getValue.session == clientSession).toArray

    logger.info(s"Removing ${viewports.length} on disconnect of $clientSession")

    viewports.foreach(entry => {
      this.removeViewPort(entry.getKey)
    })
  }

  def getViewPortVisualLinks(clientSession: ClientSessionId, vpId: String): List[(Link, ViewPort)] = {
    Option(viewPorts.get(vpId)) match {
      case Some(vp) =>
        val viewPorts = listActiveViewPortsForSession(clientSession)
        val vpLinks = for (link <- vp.table.asTable.getTableDef.links.links; vp <- viewPorts; if link.toTable == vp.table.linkableName) yield (link, vp)
        vpLinks
      case None =>
        List()
    }
  }

}
