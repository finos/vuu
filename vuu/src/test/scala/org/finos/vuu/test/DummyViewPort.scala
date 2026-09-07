package org.finos.vuu.test

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.filter.`type`.PermissionFilter
import org.finos.vuu.core.sort.{FilterAndSort, Sort}
import org.finos.vuu.core.table.datatype.EpochTimestamp
import org.finos.vuu.feature.ViewPortKeys
import org.finos.vuu.net.{ClientSessionId, FilterSpec, SortSpec}
import org.finos.vuu.util.PublishQueue
import org.finos.vuu.viewport.{GroupBy, RowSource, ViewPort, ViewPortColumns, ViewPortRange, ViewPortStructuralFields, ViewPortUpdate, ViewPortVisualLink}
import org.finos.vuu.viewport.tree.TreeNodeState

import java.util
import java.util.concurrent.ConcurrentHashMap

class DummyViewPort(val id: String,
                    val name: String,
                    val selection: Set[String],
                    val table: RowSource
                   ) extends ViewPort {

  override def updateSpecificKeys(keys: ImmutableArray[String]): Unit = ???

  override def setRequestId(request: String): Unit = ???

  override def getRequestId: String = ???

  override def setEnabled(enabled: Boolean): Unit = ???

  override def freeze(): Unit = ???

  override def unfreeze(): Unit = ???

  override def isEnabled: Boolean = ???

  override def isFrozen: Boolean = ???

  override def viewPortFrozenTime: Option[EpochTimestamp] = ???

  override def size: Int = ???

  override def filterAndSort: FilterAndSort = ???

  override def user: VuuUser = ???

  override def session: ClientSessionId = ???

  override def setRange(range: ViewPortRange): Unit = ???

  override def selectRow(rowKey: String, preserveExistingSelection: Boolean): Unit = ???

  override def deselectRow(rowKey: String, preserveExistingSelection: Boolean): Unit = ???

  override def selectRowRange(fromRowKey: String, toRowKey: String, preserveExistingSelection: Boolean): Unit = ???

  override def selectAll(): Unit = ???

  override def deselectAll(): Unit = ???

  override def setVisualLink(link: ViewPortVisualLink): Unit = ???

  override def removeVisualLink(): Unit = ???

  override def getRange: ViewPortRange = ???

  override def setKeys(keys: ViewPortKeys): Unit = ???

  override def setKeysAndNotify(key: String, keys: ViewPortKeys): Unit = ???

  override def getKeys: ViewPortKeys = ???

  override def getKeysInRange: ViewPortKeys = ???

  override def getVisualLink: Option[ViewPortVisualLink] = ???

  override def outboundQ: PublishQueue[ViewPortUpdate] = ???

  override def getColumns: ViewPortColumns = ???

  override def getSelection: Set[String] = selection

  override def getRowKeyMappingSize_ForTest: Int = ???

  override def getGroupBy: GroupBy = ???

  override def getSort: Sort = ???

  override def filterSpec: FilterSpec = ???

  override def sortSpec: SortSpec = ???

  override def changeStructure(newStructuralFields: ViewPortStructuralFields): Unit = ???

  override def getTreeNodeStateStore: TreeNodeState = ???

  override def getStructure: ViewPortStructuralFields = ???

  override def getStructuralHashCode(): Int = ???

  override def getTableUpdateCount(): Long = ???

  override def ForTest_getSubcribedKeys: util.Set[String] = ???

  override def ForTest_getRowKeyToRowIndex: ConcurrentHashMap[String, Int] = ???

  override def delete(): Unit = ???

  override def keyBuildCount: Long = ???

  override def setLastHashAndUpdateCount(lastHash: Int, lastUpdateCount: Long): Unit = ???

  override def getLastHash(): Int = ???

  override def getLastUpdateCount(): Long = ???

  override def setPermissionFilter(filter: PermissionFilter): Unit = ???

  override def getPermissionFilter: PermissionFilter = ???
}