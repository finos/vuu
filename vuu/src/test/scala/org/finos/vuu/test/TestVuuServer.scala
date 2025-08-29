package org.finos.vuu.test

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.api.ViewPortDef
import org.finos.vuu.core.IVuuServer
import org.finos.vuu.core.auths.RowPermissionChecker
import org.finos.vuu.core.sort.ModelType.SortSpecInternal
import org.finos.vuu.core.sort.{FilterAndSort, Sort}
import org.finos.vuu.core.table.{DataTable, TableContainer}
import org.finos.vuu.feature.ViewPortKeys
import org.finos.vuu.net.{ClientSessionId, FilterSpec, RequestContext}
import org.finos.vuu.plugin.Plugin
import org.finos.vuu.provider.{MockProvider, Provider, ProviderContainer}
import org.finos.vuu.util.PublishQueue
import org.finos.vuu.viewport.tree.TreeNodeState
import org.finos.vuu.viewport.{GroupBy, RowSource, ViewPort, ViewPortColumns, ViewPortRange, ViewPortStructuralFields, ViewPortUpdate, ViewPortVisualLink}

import java.util.concurrent.ConcurrentHashMap

class TestViewPort(val viewPort: ViewPort) extends ViewPort {
  override def updateSpecificKeys(keys: ImmutableArray[String]): Unit = viewPort.updateSpecificKeys(keys)

  override def setRequestId(request: String): Unit = viewPort.setRequestId(request)

  override def getRequestId: String = viewPort.getRequestId

  override def setEnabled(enabled: Boolean): Unit = viewPort.setEnabled(enabled)

  override def isEnabled: Boolean = viewPort.isEnabled

  override def freeze(): Unit = viewPort.freeze()

  override def unfreeze(): Unit = viewPort.unfreeze()

  override def isFrozen: Boolean = viewPort.isFrozen

  override def viewPortFrozenTime: Option[Long] = viewPort.viewPortFrozenTime

  override def size: Int = viewPort.size

  override def id: String = viewPort.id

  override def filterAndSort: FilterAndSort = viewPort.filterAndSort

  override def session: ClientSessionId = viewPort.session

  override def table: RowSource = viewPort.table

  override def setRange(range: ViewPortRange): Unit = viewPort.setRange(range)

  override def setSelection(rowIndices: Array[Int]): Unit = viewPort.setSelection(rowIndices)

  override def setVisualLink(link: ViewPortVisualLink): Unit = viewPort.setVisualLink(link)

  override def removeVisualLink(): Unit = viewPort.removeVisualLink()

  override def getRange: ViewPortRange = viewPort.getRange

  override def setKeys(keys: ViewPortKeys): Unit = viewPort.setKeys(keys)

  override def setKeysAndNotify(key: String, keys: ViewPortKeys): Unit = viewPort.setKeysAndNotify(key, keys)

  override def getKeys: ViewPortKeys = viewPort.getKeys

  override def getKeysInRange: ViewPortKeys = viewPort.getKeysInRange

  override def getVisualLink: Option[ViewPortVisualLink] = viewPort.getVisualLink

  override def outboundQ: PublishQueue[ViewPortUpdate] = viewPort.outboundQ

  override def getColumns: ViewPortColumns = viewPort.getColumns

  override def getSelection: Map[String, Int] = viewPort.getSelection

  override def getRowKeyMappingSize_ForTest: Int = viewPort.getRowKeyMappingSize_ForTest

  override def getGroupBy: GroupBy = viewPort.getGroupBy

  override def getSort: Sort = viewPort.getSort

  override def filterSpec: FilterSpec = viewPort.filterSpec

  override def sortSpecInternal: SortSpecInternal = viewPort.sortSpecInternal

  override def changeStructure(newStructuralFields: ViewPortStructuralFields): Unit = viewPort.changeStructure(newStructuralFields)

  override def getTreeNodeStateStore: TreeNodeState = viewPort.getTreeNodeStateStore

  override def getStructure: ViewPortStructuralFields = viewPort.getStructure

  override def getStructuralHashCode(): Int = viewPort.getStructuralHashCode()

  override def getTableUpdateCount(): Long = viewPort.getTableUpdateCount()

  override def ForTest_getSubcribedKeys: ConcurrentHashMap[String, String] = viewPort.ForTest_getSubcribedKeys

  override def ForTest_getRowKeyToRowIndex: ConcurrentHashMap[String, Int] = viewPort.ForTest_getRowKeyToRowIndex

  override def delete(): Unit = viewPort.delete()

  override def keyBuildCount: Long = viewPort.keyBuildCount

  override def setLastHashAndUpdateCount(lastHash: Int, lastUpdateCount: Long): Unit = viewPort.setLastHashAndUpdateCount(lastHash, lastUpdateCount)

  override def getLastHash(): Int = viewPort.getLastHash()

  override def getLastUpdateCount(): Long = viewPort.getLastUpdateCount()

  override def setPermissionChecker(checker: Option[RowPermissionChecker]): Unit = viewPort.setPermissionChecker(checker)

  override def permissionChecker(): Option[RowPermissionChecker] = viewPort.permissionChecker()

}

trait TestVuuServer extends IVuuServer {
  def registerProvider(dataTable: DataTable, provider: Provider): Unit

  def registerPlugin(plugin: Plugin): Unit

  def login(user: String, token: String): Unit

  def getProvider(module: String, table: String): MockProvider

  def createViewPort(module: String, tableName: String): TestViewPort

  def createViewPort(module: String, tableName: String, viewPortRange: ViewPortRange): TestViewPort

  def session: ClientSessionId

  def runOnce(): Unit

  def overrideViewPortDef(table: String, vpDefFunc: (DataTable, Provider, ProviderContainer, TableContainer) => ViewPortDef): Unit

  def getViewPortRpcServiceProxy[TYPE: _root_.scala.reflect.ClassTag](viewport: ViewPort): TYPE

  def requestContext: RequestContext

  def tableContainer: TableContainer
}
