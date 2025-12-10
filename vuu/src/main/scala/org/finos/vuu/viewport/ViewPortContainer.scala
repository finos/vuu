package org.finos.vuu.viewport

import com.codahale.metrics.{Histogram, Meter}
import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.jmx.{JmxAble, MetricsProvider}
import org.finos.toolbox.text.AsciiUtil
import org.finos.toolbox.thread.RunInThread
import org.finos.toolbox.time.TimeIt.{timeIt, timeItThen}
import org.finos.toolbox.time.{Clock, TimeIt}
import org.finos.vuu.api.{Link, ViewPortDef}
import org.finos.vuu.client.messages.ViewPortId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.filter.`type`.{AllowAllPermissionFilter, AntlrBasedFilter, BaseFilter, VisualLinkedFilter}
import org.finos.vuu.core.filter.{CompoundFilter, FilterOutEverythingFilter, FilterSpecParser, NoFilter, ViewPortFilter}
import org.finos.vuu.core.sort.*
import org.finos.vuu.core.table.{DataTable, SessionTable, TableContainer}
import org.finos.vuu.core.tree.TreeSessionTableImpl
import org.finos.vuu.feature.EmptyViewPortKeys
import org.finos.vuu.feature.inmem.InMemTablePrimaryKeys
import org.finos.vuu.net.rpc.{EditRpcHandler, RpcFunctionResult, RpcParams}
import org.finos.vuu.net.{ClientSessionId, FilterSpec, RequestContext, SortSpec}
import org.finos.vuu.plugin.PluginRegistry
import org.finos.vuu.provider.{Provider, ProviderContainer}
import org.finos.vuu.util.PublishQueue
import org.finos.vuu.viewport.tree.*
import org.finos.vuu.{core, viewport}

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicReference
import scala.jdk.CollectionConverters.{CollectionHasAsScala, IteratorHasAsScala, SetHasAsScala}
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

class ViewPortContainer(val tableContainer: TableContainer, val providerContainer: ProviderContainer, val pluginRegistry: PluginRegistry)(implicit timeProvider: Clock, metrics: MetricsProvider) extends RunInThread with StrictLogging with JmxAble with ViewPortContainerMBean {

  import org.finos.vuu.core.VuuServerMetrics.*

  private val viewPorthistogram = metrics.histogram(toJmxName("thread.viewport.cycleTime"))

  val viewPortHistograms = new ConcurrentHashMap[String, Histogram]()

  val treeToKeysHistograms = new ConcurrentHashMap[String, Histogram]()
  val treeSetKeysHistograms = new ConcurrentHashMap[String, Histogram]()
  val treeSetTreeHistograms = new ConcurrentHashMap[String, Histogram]()
  val treeDiffBranchesHistograms = new ConcurrentHashMap[String, Histogram]()
  val treeBuildHistograms = new ConcurrentHashMap[String, Histogram]()

  val filterSortHistograms = new ConcurrentHashMap[String, Histogram]()

  private val viewPortDefinitions = new ConcurrentHashMap[String, (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef]()

  private val treeNodeStatesByVp = new ConcurrentHashMap[String, TreeNodeStateStore]()

  val totalTreeWorkHistogram: Meter = metrics.meter(toJmxName("viewport.work.tree"))
  val totalFlatWorkHistogram: Meter = metrics.meter(toJmxName("viewport.work.flat"))

  def getViewPorts: List[ViewPort] = CollectionHasAsScala(viewPorts.values()).asScala.toList

  def getTreeNodeStateByVp(vpId: String): TreeNodeStateStore = {
    treeNodeStatesByVp.get(vpId)
  }

  def handleRpcRequest(viewPortId: String, rpcName: String, params: Map[String, Any]) (ctx: RequestContext): RpcFunctionResult = {
    val viewPort = this.getViewPortById(viewPortId)

    if(viewPort == null)
      throw new Exception(s"No viewport $viewPortId found for RPC Call for $rpcName")

    val viewPortDef = viewPort.getStructure.viewPortDef

    viewPortDef.service.processRpcRequest(rpcName, new RpcParams(params, viewPort, ctx))
  }

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

  def callRpcEditFormClose(vpId: String, rpcName: String, session: ClientSessionId): ViewPortAction = {
    val viewPort = this.getViewPortById(vpId)
    val viewPortDef = viewPort.getStructure.viewPortDef
    val service = viewPortDef.service

    service match {
      case serv: EditRpcHandler => serv.onFormClose().func(viewPort, session)
      case _ =>
        throw new Exception(s"Service is not editable rpc")
    }
  }

  def callRpcEditDeleteCell(vpId: String, key: String, column: String, session: ClientSessionId): ViewPortAction = {
    val viewPort = this.getViewPortById(vpId)
    val viewPortDef = viewPort.getStructure.viewPortDef
    val service = viewPortDef.service

    service match {
      case serv: EditRpcHandler => serv.deleteCellAction().func(key, column, viewPort, session)
      case _ =>
        throw new Exception(s"Service is not editable rpc")
    }
  }

  def callRpcEditDeleteRow(vpId: String, key: String, session: ClientSessionId): ViewPortAction = {
    val viewPort = this.getViewPortById(vpId)
    val viewPortDef = viewPort.getStructure.viewPortDef
    val service = viewPortDef.service

    service match {
      case serv: EditRpcHandler => serv.deleteRowAction().func(key, viewPort, session)
      case _ =>
        throw new Exception(s"Service is not editable rpc")
    }
  }

  def callRpcAddRow(vpId: String, key: String,  data: Map[String, Any], session: ClientSessionId): ViewPortAction = {
    val viewPort = this.getViewPortById(vpId)
    val viewPortDef = viewPort.getStructure.viewPortDef
    val service = viewPortDef.service

    service match {
      case serv: EditRpcHandler => serv.addRowAction().func(key, data, viewPort, session)
      case _ =>
        throw new Exception(s"Service is not editable rpc")
    }
  }

  def callRpcEditFormSubmit(vpId: String, session: ClientSessionId): ViewPortAction = {
    val viewPort = this.getViewPortById(vpId)
    val viewPortDef = viewPort.getStructure.viewPortDef
    val service = viewPortDef.service

    service match {
      case serv: EditRpcHandler => serv.onFormSubmit().func(viewPort, session)
      case _ =>
        throw new Exception(s"Service is not editable rpc")
    }
  }

  def callRpcEditRow(vpId: String, key: String, data: Map[String, Any], session: ClientSessionId): ViewPortEditAction = {
    val viewPort = this.getViewPortById(vpId)
    val viewPortDef = viewPort.getStructure.viewPortDef
    val service = viewPortDef.service

    service match {
      case serv: EditRpcHandler => serv.editRowAction().func(key, data, viewPort, session)
      case _ =>
        throw new Exception(s"Service is not editable rpc")
    }
  }

  def callRpcEditCell(vpId: String, key: String, column: String, data: AnyRef, session: ClientSessionId): ViewPortEditAction = {
    val viewPort = this.getViewPortById(vpId)
    val viewPortDef = viewPort.getStructure.viewPortDef
    val service = viewPortDef.service

    service match {
      case serv: EditRpcHandler => serv.editCellAction().func(key, column, data, viewPort, session)
      case _ =>
        throw new Exception(s"Service is not editable rpc")
    }
  }

  def callRpcFormSubmit(vpId: String, session: ClientSessionId): ViewPortAction = {
    val viewPort = this.getViewPortById(vpId)
    val viewPortDef = viewPort.getStructure.viewPortDef
    val service = viewPortDef.service

    service match {
      case serv: EditRpcHandler => serv.onFormSubmit().func(viewPort, session)
      case _ =>
        throw new Exception(s"Service is not editable rpc")
    }
  }


  def callRpcSelection(vpId: String, rpcName: String, session: ClientSessionId): ViewPortAction = {

    val viewPort = this.getViewPortById(vpId)
    val viewPortDef = viewPort.getStructure.viewPortDef
    val asMap = viewPortDef.service.menuMap

    asMap.get(rpcName) match {
      case Some(rpcType) =>
        rpcType match {
          case selection: SelectionViewPortMenuItem => selection.func(ViewPortSelection(viewPort.getSelection, viewPort), session)
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

  def addViewPortDefinition(table: String, vpDefFunc: (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef): Unit = {
    viewPortDefinitions.put(table, vpDefFunc)
  }

  def getViewPortDefinition(table: DataTable): ViewPortDef = {
    val viewPortDefFunc = getViewPortDefinitionCreator(table)
    if (viewPortDefFunc == null)
      ViewPortDef.default(table.getTableDef.getColumns, tableContainer)
    else
      viewPortDefFunc(table.asTable, table.asTable.getProvider, providerContainer, tableContainer)
  }

  private def getViewPortDefinitionCreator(table: DataTable): (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef = {
    table match {
      case session: SessionTable =>
        viewPortDefinitions.get(table.getTableDef.name)
      case _ =>
        viewPortDefinitions.get(table.name)
    }
  }

  def getViewPortById(vpId: String): ViewPort = {
    this.viewPorts.get(vpId)
  }

  def removeViewPort(vpId: String): Any = {
    //stop updates to viewport
    disableViewPort(vpId)
    this.viewPorts.get(vpId) match {
      case null =>
        logger.error(s"Could not find viewport to remove $vpId")
      case vp: ViewPort =>
        logger.debug(s"Removing $vpId from container")
        viewPortHistograms.remove(vpId)
        vp.delete()
        this.viewPorts.remove(vp.id)
        logger.info(s"Removed viewport $vpId")
    }
  }

  def disableViewPort(vpId: String): Unit = {
    this.viewPorts.get(vpId) match {
      case null =>
        logger.error(s"Could not find viewport to disable $vpId")
      case vp: ViewPort =>
        vp.setEnabled(false)
        logger.debug(s"Disabled $vpId in container")
    }
  }

  def enableViewPort(vpId: String): Unit = {
    this.viewPorts.get(vpId) match {
      case null =>
        logger.error(s"Could not find viewport to enable $vpId")
      case vp: ViewPort =>
        vp.setEnabled(true)
        logger.debug(s"Enabled $vpId in container")
    }
  }

  def freezeViewPort(vpId: String): Unit = {
    this.viewPorts.get(vpId) match {
      case null =>
        throw new Exception(s"Could not find viewport to freeze $vpId")
      case vp: ViewPort =>
        if (vp.isFrozen) {
          throw new Exception(s"Could not freeze viewport $vpId because it's already frozen")
        } else {
          vp.freeze()
          logger.debug(s"Froze viewport $vpId in container")
        }
    }
  }

  def unfreezeViewPort(vpId: String): Unit = {
    this.viewPorts.get(vpId) match {
      case null =>
        throw new Exception(s"Could not find viewport to unfreeze $vpId")
      case vp: ViewPort =>
        if (vp.isFrozen) {
          vp.unfreeze()
          logger.debug(s"Unfroze viewport $vpId in container")
        } else {
          throw new Exception(s"Could not unfreeze viewport $vpId because it's not frozen")
        }
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

        val rows = keys.map(key => vp.table.pullRowAsArray(key, columns)).toArray

        val headers = if (vp.hasGroupBy)
          Array[String]("depth", "isOpen", "key", "isLeaf") ++ columns.getColumns.map(_.name).toArray[String]
        else
          columns.getColumns.map(_.name).toArray

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

  private def parseSort(sortSpec: SortSpec, vpColumns: ViewPortColumns, defaultSort: SortSpec): Sort = {
    if (sortSpec != null && sortSpec.sortDefs != null && sortSpec.sortDefs.nonEmpty) {
      Try(SortSpecParser.parse(sortSpec, vpColumns)) match {
        case Success(sort) =>
          logger.debug(s"Applying custom sort $sortSpec")
          sort
        case Failure(err) =>
          logger.error(s"Could not parse sort $sortSpec", err)
          NoSort
      }
    } else if (defaultSort != null && defaultSort.sortDefs != null && defaultSort.sortDefs.nonEmpty) {
      Try(SortSpecParser.parse(defaultSort, vpColumns)) match {
        case Success(sort) =>
          logger.debug(s"Applying default sort $defaultSort")
          sort
        case Failure(err) =>
          logger.error(s"Could not parse default sort $defaultSort", err)
          NoSort
      }
    } else {
      NoSort
    }
  }

  private def parseFilter(filterSpec: FilterSpec): ViewPortFilter = {
    if (filterSpec == null || filterSpec.filter == "")
      NoFilter
    else {
      Try(FilterSpecParser.parse(filterSpec.filter)) match {
        case Success(clause) =>
          AntlrBasedFilter(clause)
        case Failure(err) =>
          logger.error(s"could not parse filter ${filterSpec.filter}", err)
          FilterOutEverythingFilter
      }
    }
  }

  def change(requestId: String, clientSession: ClientSessionId, id: String, range: ViewPortRange, columns: ViewPortColumns, sort: SortSpec = SortSpec(List()), filterSpec: FilterSpec = FilterSpec(""), groupBy: GroupBy = NoGroupBy): ViewPort = {

    val viewPort = viewPorts.get(id)
    val permissionFilter = viewPort.getPermissionFilter
    val frozenTime = viewPort.viewPortFrozenTime

    if (viewPort == null) {
      throw new Exception(s"view port not found $id")
    }

    val aSort = parseSort(sort, columns, viewPort.table.asTable.getTableDef.defaultSort)

    val aFilter = parseFilter(filterSpec)

    val filtAndSort = viewPort.getVisualLink match {
      case Some(visualLink) =>
        UserDefinedFilterAndSort(CompoundFilter(VisualLinkedFilter(visualLink), aFilter), aSort)
      case None =>
        UserDefinedFilterAndSort(aFilter, aSort)
    }

    //update the viewport request id, to prevent any unwanted updates going out while we're changing the viewport
    viewPort.setRequestId(requestId)

    //we are not grouped by, but we want to change to a group by
    if (viewPort.getGroupBy == NoGroupBy && groupBy != NoGroupBy) {

      logger.trace("[VP] was flat (or diff), now tree'd, building...")

      val sourceTable = viewPort.table

      val sessionTable = tableContainer.createTreeSessionTable(sourceTable, clientSession)

      val keys = ImmutableArray.empty[String]; //tree.toKeys()
      viewPort.setKeys(EmptyViewPortKeys)
      sessionTable.setTree(EmptyTree, InMemTablePrimaryKeys(keys))

      val structure = viewport.ViewPortStructuralFields(table = sessionTable,
        columns = columns,
        viewPort.getStructure.viewPortDef,
        filtAndSort = filtAndSort,
        filterSpec = filterSpec,
        sortSpec = sort,
        groupBy = groupBy,
        viewPort.getTreeNodeStateStore,
        permissionFilter,
        frozenTime
      )

      viewPort.changeStructure(structure)

      //we are groupBy but we want to revert to no groupBy
    } else if (viewPort.getGroupBy != NoGroupBy && groupBy == NoGroupBy) {

      logger.trace("[VP] was tree'd, now not tree'd, removing tree info")

      val groupByTable = viewPort.table.asTable.asInstanceOf[TreeSessionTableImpl]
      val sourceTable = viewPort.table.asTable.asInstanceOf[TreeSessionTableImpl].sourceTable

      val structure = viewport.ViewPortStructuralFields(table = sourceTable,
        columns = columns,
        viewPort.getStructure.viewPortDef,
        filtAndSort = filtAndSort,
        filterSpec = filterSpec,
        sortSpec = sort,
        groupBy = groupBy,
        viewPort.getTreeNodeStateStore,
        permissionFilter,
        frozenTime
      )

      viewPort.changeStructure(structure)
      tableContainer.removeGroupBySessionTable(groupByTable)
      groupByTable.delete()

    } else if (viewPort.getGroupBy != NoGroupBy && groupBy != NoGroupBy && viewPort.getGroupBy.columns != groupBy.columns) {

      logger.trace("[VP] was tree'd, now tree'd also but differently, building...")

      val groupByTable = viewPort.table.asTable.asInstanceOf[TreeSessionTableImpl]
      val sourceTable = viewPort.table.asTable.asInstanceOf[TreeSessionTableImpl].sourceTable

      groupByTable.setTree(EmptyTree, InMemTablePrimaryKeys(ImmutableArray.empty))

      val sessionTable = tableContainer.createTreeSessionTable(sourceTable, clientSession)

      val keys = ImmutableArray.empty[String]

      viewPort.setKeys(EmptyViewPortKeys)
      sessionTable.setTree(EmptyTree, InMemTablePrimaryKeys(keys))

      logger.debug("[VP] complete setKeys() " + keys.length + "new group by table:" + sessionTable.name)

      val structure = viewport.ViewPortStructuralFields(table = sessionTable,
        columns = columns,
        viewPort.getStructure.viewPortDef,
        filtAndSort = filtAndSort,
        filterSpec = filterSpec,
        sortSpec = sort,
        groupBy = groupBy,
        viewPort.getTreeNodeStateStore,
        permissionFilter,
        frozenTime
      )

      //its important that the sequence of these operations is preserved, i.e. we should only remove the table after
      //the
      viewPort.setKeys(EmptyViewPortKeys)
      viewPort.changeStructure(structure)
      tableContainer.removeGroupBySessionTable(groupByTable)
      groupByTable.delete()

    } else {
      logger.trace("[VP] default else condition in change() call")
      val structure = viewport.ViewPortStructuralFields(table = viewPort.table,
        columns = columns,
        viewPortDef = viewPort.getStructure.viewPortDef,
        filtAndSort = filtAndSort,
        filterSpec = filterSpec,
        sortSpec = sort,
        groupBy = groupBy,
        viewPort.getTreeNodeStateStore,
        permissionFilter,
        frozenTime
      )
      //viewPort.setRequestId(requestId)
      viewPort.changeStructure(structure)
      //viewPort.setKeys(viewPort.getKeys)
    }

    viewPort
  }

  def create(requestId: String, user: VuuUser, clientSession: ClientSessionId, outboundQ: PublishQueue[ViewPortUpdate], table: RowSource,
             range: ViewPortRange, columns: ViewPortColumns, sort: SortSpec = SortSpec(List()), filterSpec: FilterSpec = FilterSpec(""), groupBy: GroupBy = NoGroupBy): ViewPort = {

    val id = createId(user.name)

    val aSort = parseSort(sort, columns, table.asTable.getTableDef.defaultSort)

    val aFilter = parseFilter(filterSpec)

    val filtAndSort = core.sort.UserDefinedFilterAndSort(aFilter, aSort)

    val aTable = pluginRegistry.withPlugin(table.asTable.getTableDef.pluginType){
        plugin => plugin.viewPortTableCreator.create(table, clientSession, groupBy, tableContainer)
    }

    val viewPortDef = getViewPortDefinition(table.asTable)

    val structural = viewport.ViewPortStructuralFields(aTable, columns, viewPortDef, filtAndSort, filterSpec,
      sort, groupBy, ClosedTreeNodeState, AllowAllPermissionFilter, None)

    val viewPort = new ViewPortImpl(id, user, clientSession, outboundQ, new AtomicReference[ViewPortStructuralFields](structural), new AtomicReference[ViewPortRange](range))

    val permissionFilter = table.asTable.getTableDef.permissionFilter(viewPort, tableContainer)

    viewPort.setPermissionFilter(permissionFilter)
    viewPort.setRequestId(requestId)
    viewPorts.put(id, viewPort)

    logger.info(s"Created viewport $id on table ${table.name} in session ${clientSession.sessionId}")
    viewPort
  }

  def changeRange(clientSession: ClientSessionId, outboundQ: PublishQueue[ViewPortUpdate], vpId: String, range: ViewPortRange): ViewPort = {

    val vp = viewPorts.get(vpId)
    val old = vp.getRange

    val (millis, _) = timeIt {
      vp.setRange(range)
    }

    logger.trace("VP Change Range [{}] {}->{}, was {}->{}, took: {} millis", vpId, range.from, range.to, old.from, old.to, millis)

    vp
  }

  def openNode(viewPortId: String, treeKey: String): Unit = {

    logger.debug(s"Had request to change vp $viewPortId node state $treeKey")

    val viewPort = viewPorts.get(viewPortId)
    val treeNodeStateStore = treeNodeStatesByVp.getOrDefault(viewPortId, TreeNodeStateStore(Map()))

    val newStateStore = treeNodeStateStore.open(treeKey)

    treeNodeStatesByVp.put(viewPortId, newStateStore)
  }

  def closeNode(viewPortId: String, treeKey: String): Unit = {
    logger.debug(s"Had request to change vp $viewPortId node state $treeKey")

    val viewPort = viewPorts.get(viewPortId)
    val treeNodeStateStore = treeNodeStatesByVp.getOrDefault(viewPortId, TreeNodeStateStore(Map()))

    val newStateStore = treeNodeStateStore.close(treeKey)

    treeNodeStatesByVp.put(viewPortId, newStateStore)
  }

  def selectRow(vpId: String, rowKey: String, preserveExistingSelection: Boolean): ViewPort = {
    val viewPort = viewPorts.get(vpId)
    viewPort.selectRow(rowKey, preserveExistingSelection)
    viewPort
  }

  def deselectRow(vpId: String, rowKey: String, preserveExistingSelection: Boolean): ViewPort = {
    val viewPort = viewPorts.get(vpId)
    viewPort.deselectRow(rowKey, preserveExistingSelection)
    viewPort
  }

  def selectRowRange(vpId: String, fromRowKey: String, toRowKey: String, preserveExistingSelection: Boolean): ViewPort = {
    val viewPort = viewPorts.get(vpId)
    viewPort.selectRowRange(fromRowKey, toRowKey, preserveExistingSelection)
    viewPort
  }

  def selectAll(vpId: String): ViewPort = {
    val viewPort = viewPorts.get(vpId)
    viewPort.selectAll()
    viewPort
  }

  def deselectAll(vpId: String): ViewPort = {
    val viewPort = viewPorts.get(vpId)
    viewPort.deselectAll()
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

  }

  //for trees there are two steps, 1 should we update the tree, and secondly, should we recalculate the keys
  def shouldRebuildTree(viewPort: ViewPort, currentStructureHash: Int, currentUpdateCount: Long): Boolean = {

    val table = viewPort.table.asTable

    val shouldRebuild = table match {
      case tbl: TreeSessionTableImpl =>
        val oldTree = Option(tbl.getTree)

        val (previousTreeBuildUpdateCount, previousHashcode, previousNodeStateHashCode) = oldTree match {
          case Some(tree) =>
            (tree.updateCounter, viewPort.getLastHash(), tree.nodeState.hashCode())
          case None =>
            (-1, -3, -4)
        }

        val tableUpdateCounter = table.asTable match {
          case treeTable: TreeSessionTableImpl =>
            treeTable.sourceTable.updateCounter
          case _ =>
            -2
        }

        //FIXME: Chris - there is a further optimization to be done here, where we check if the visual link selection has changed
        //but I have not done it yet
        //this code will force a rebuild if visual linking is setup
        val hasVisualLink = viewPort.getVisualLink match {
          case Some(link) => true
          case None => false
        }

        val shouldRebuild = previousTreeBuildUpdateCount != tableUpdateCounter || previousHashcode != currentStructureHash || hasVisualLink

        if (!shouldRebuild) {
          logger.debug(s"[TREE] Should rebuild tree $shouldRebuild, prevUpdateCounter=$previousTreeBuildUpdateCount updateCounter=$tableUpdateCounter, previousHashcode=$previousHashcode paramsHashcode=$currentStructureHash")
        }

        shouldRebuild
    }

    val lastStructureHash = viewPort.getLastHash()
    val lastUpdateCount = viewPort.getLastUpdateCount()

    shouldRebuild || currentStructureHash != lastStructureHash || currentUpdateCount != lastUpdateCount
  }

  def shouldRecalcKeys(latestNodeState: TreeNodeStateStore, previousNodeState: TreeNodeStateStore): Boolean = {
    latestNodeState.hashCode() != previousNodeState.hashCode()
  }

  def refreshOneTreeViewPort(viewPort: ViewPort): Unit = {
    val (millis, _) = timeIt{
      refreshOneTreeViewPortInternal(viewPort)
    }
    totalTreeWorkHistogram.mark(millis)
  }

  private def updateHistogram(vp: ViewPort, histograms: ConcurrentHashMap[String, Histogram], suffix: String, millis: Long): Unit = {
    histograms.computeIfAbsent(vp.id, s => metrics.histogram(toJmxName(suffix + s))).update(millis)
  }

  private def refreshOneTreeViewPortInternal(viewPort: ViewPort): Unit = {

    logger.debug("Building tree for groupBy")

    val table = viewPort.table.asTable
    val latestNodeState = treeNodeStatesByVp.getOrDefault(viewPort.id, TreeNodeStateStore(Map()))
    val currentUpdateCount = viewPort.table.asTable.updateCounter
    val currentStructureHash = viewPort.getStructuralHashCode()

    TreeBuildOptimizer.optimize(viewPort, latestNodeState) match {
      case action: BuildEntireTree =>
        val oldTree = action.table.getTree
        val tree = timeItThen[Tree](
          {
            TreeBuilder.create(action.table, viewPort.getGroupBy, viewPort.filterSpec, viewPort.getColumns, 
              latestNodeState, action.oldTreeOption, Option(viewPort.getStructure.filtAndSort.sort), 
              action, viewPort.getPermissionFilter, viewPort.viewPortFrozenTime).buildEntireTree()},
          (millis, tree) => { updateHistogram(viewPort, treeBuildHistograms, "tree.build.", millis)}
        )
        val keys = timeItThen[ImmutableArray[String]](
          {tree.toKeys()},
          (millis, _) => { updateHistogram(viewPort, treeToKeysHistograms, "tree.keys.", millis)}
        )
        timeItThen[Unit](
          {action.table.setTree(tree, InMemTablePrimaryKeys(keys))},
          (millis, _) => { updateHistogram(viewPort, treeSetTreeHistograms, "tree.settree.", millis)}
        )
        timeItThen[Unit](
          {viewPort.setKeys(viewPort.getKeys.create(InMemTablePrimaryKeys(keys)))},
          (millis, _) => {updateHistogram(viewPort, treeSetKeysHistograms, "tree.setkeys.", millis)}
        )
        timeItThen[Unit](
          {
            val branchKeys = TreeUtils.diffOldVsNewBranches(oldTree, tree, oldTree.nodeState)
            viewPort.updateSpecificKeys(branchKeys)
          },
          (millis, _) => {
            updateHistogram(viewPort, treeDiffBranchesHistograms, "tree.branchdiff.", millis)
          }
        )
        viewPort.setLastHashAndUpdateCount(currentStructureHash, currentUpdateCount)

      case CantBuildTreeErrorState =>
        logger.error(s"GROUP-BY: table ${table.name} has a groupBy but doesn't have a groupBySessionTable associated. Going to ignore build request.")
        viewPort.setLastHashAndUpdateCount(-1, 0)

      case action: FastBuildBranchesOfTree =>
        val oldTree = action.table.getTree
        val tree = timeItThen[Tree](
          {TreeBuilder.create(action.table, viewPort.getGroupBy, viewPort.filterSpec, viewPort.getColumns,
            latestNodeState, action.oldTreeOption, Option(viewPort.getStructure.filtAndSort.sort), action,
            viewPort.getPermissionFilter, viewPort.viewPortFrozenTime).buildOnlyBranches()},
          (millis, _) => { updateHistogram(viewPort, treeBuildHistograms, "tree.build.", millis)}
        )
        val keys = timeItThen[ImmutableArray[String]](
          {tree.toKeys()},
          (millis, _) => {updateHistogram(viewPort, treeToKeysHistograms, "tree.keys.", millis)}
        )
        timeItThen[Unit](
          {action.table.setTree(tree, InMemTablePrimaryKeys(keys))},
          (millis, _) => {updateHistogram(viewPort, treeSetTreeHistograms, "tree.settree.", millis)}
        )
        timeItThen[Unit]({viewPort.setKeys(viewPort.getKeys.create(InMemTablePrimaryKeys(keys)))},
          (millis, _) => {updateHistogram(viewPort, treeSetKeysHistograms, "tree.setkeys.", millis)}
        )
        timeItThen[Unit](
          {
            val branchKeys = TreeUtils.diffOldVsNewBranches(oldTree, tree, oldTree.nodeState)
            viewPort.updateSpecificKeys(branchKeys)
          },
          (millis, _) => {
            updateHistogram(viewPort, treeDiffBranchesHistograms, "tree.branchdiff.", millis)
          }
        )
        viewPort.setLastHashAndUpdateCount(currentStructureHash, currentUpdateCount)

      case action: OnlyRecalculateTreeKeys =>
        val oldTree = action.table.getTree
        val tree = action.table.getTree.applyNewNodeState(latestNodeState, action)
        val keys = tree.toKeys()
        timeItThen[Unit](
          {action.table.setTree(tree, InMemTablePrimaryKeys(keys))},
          (millis, _) => {updateHistogram(viewPort, treeSetTreeHistograms, "tree.settree.", millis)}
        )
        timeItThen[Unit](
          {viewPort.setKeys(viewPort.getKeys.create(InMemTablePrimaryKeys(keys)))},
          (millis, _) => {updateHistogram(viewPort, treeSetKeysHistograms, "tree.setkeys.", millis)}
        )
        timeItThen[Unit](
          {
            val branchKeys = TreeUtils.diffOldVsNewBranches(oldTree, tree, oldTree.nodeState)
            viewPort.updateSpecificKeys(branchKeys)
          },
          (millis, _) => {updateHistogram(viewPort, treeDiffBranchesHistograms, "tree.branchdiff.", millis)}
        )
        viewPort.setLastHashAndUpdateCount(currentStructureHash, currentUpdateCount)
    }

    //viewPort.setLastHashAndUpdateCount(currentStructureHash, currentUpdateCount)
  }

  def shouldCalculateKeys(viewPort: ViewPort, currentStructureHash: Int, currentUpdateCount: Long): Boolean = {

    val lastStructureHash = viewPort.getLastHash()
    val lastUpdateCount = viewPort.getLastUpdateCount()

    val hasVisualLink = viewPort.getVisualLink match {
      case Some(link) => true
      case None => false
    }

    currentStructureHash != lastStructureHash || currentUpdateCount != lastUpdateCount || hasVisualLink
  }

  def refreshOneViewPort(viewPort: ViewPort): Unit = {
    val (millis, _) = timeIt{
      refreshOneViewPortInternal(viewPort)
    }
    totalFlatWorkHistogram.mark(millis)
  }

  private def refreshOneViewPortInternal(viewPort: ViewPort): Unit = {

    if (viewPort.isEnabled) {

      val currentStructureHash = viewPort.getStructuralHashCode()
      val currentUpdateCount = viewPort.getTableUpdateCount()

      if (shouldCalculateKeys(viewPort, currentStructureHash, currentUpdateCount)) {

        val keys = viewPort.table.primaryKeys

        val filterAndSort = viewPort.filterAndSort

        val (millis, _) = TimeIt.timeIt {
          val baseFilter = BaseFilter(viewPort.getPermissionFilter, viewPort.viewPortFrozenTime)
          val sorted = filterAndSort.filterAndSort(viewPort.table, keys, viewPort.getColumns, baseFilter)
          viewPort.setKeys(viewPort.getKeys.create(sorted))
        }

        viewPortHistograms.computeIfAbsent(viewPort.id, s => metrics.histogram(toJmxName("vp.flat.cycle." + s))).update(millis)
        viewPort.setLastHashAndUpdateCount(currentStructureHash, currentUpdateCount)
      }

    } else {
      //do not set keys to empty
      //viewPort.setKeys(ImmutableArray.empty[String])
    }
  }

  def removeForSession(clientSession: ClientSessionId): Unit = {
    val viewports = SetHasAsScala(viewPorts.entrySet())
      .asScala
      .filter(entry => entry.getValue.session == clientSession).toArray

    logger.debug(s"Removing ${viewports.length} on disconnect of $clientSession")

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
