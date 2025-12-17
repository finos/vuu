package org.finos.vuu.core.filter.`type`

import org.finos.toolbox.collection.array.ImmutableArray
import org.finos.toolbox.time.TestFriendlyClock
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.sort.FilterAndSortFixture.{row, setupTable}
import org.finos.vuu.core.sort.{FilterAndSort, Sort}
import org.finos.vuu.core.table.datatype.EpochTimestamp
import org.finos.vuu.core.table.{DataType, SimpleColumn}
import org.finos.vuu.feature.ViewPortKeys
import org.finos.vuu.net.{ClientSessionId, FilterSpec, SortSpec}
import org.finos.vuu.util.PublishQueue
import org.finos.vuu.viewport.*
import org.finos.vuu.viewport.tree.TreeNodeState
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util.concurrent.ConcurrentHashMap

/**
 * Create visual link for 2 view ports of the same table on a specific column.
 * When a row is selected on parent view port, we expect the filter to return filtered rows for the child view port.
 */
class VisualLinkedFilterTest extends AnyFeatureSpec with Matchers {

  Feature("Applying visual linked filters") {
    val clock = new TestFriendlyClock(1000L)

    Scenario("Visual linked filter on indexed column") {
      val table = {
        setupTable(List("orderId"),
          row("tradeTime" -> 5L, "quantity" -> 500, "price" -> 283.10, "side" -> 'B', "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
          row("tradeTime" -> 2L, "quantity" -> 100, "price" -> 94.12, "side" -> 'S', "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
          row("tradeTime" -> 1L, "quantity" -> 100, "price" -> 180.50, "side" -> 'B', "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD")
        )(using clock)
      }
      val parentVp = new DummyViewPort("parentVpId", "parentVp", Set("LDN-0001"), table)
      val filter = VisualLinkedFilter(ViewPortVisualLink(null, parentVp, SimpleColumn("orderId", 0, DataType.StringDataType), SimpleColumn("orderId", 0, DataType.StringDataType)))
      val results = filter.doFilter(table, table.primaryKeys, null, true)
      results.length shouldEqual 1
      results.toSet shouldEqual Set("LDN-0001")
    }

    Scenario("Visual linked filter on non-indexed column") {
      val table = {
        setupTable(List.empty,
          row("tradeTime" -> 5L, "quantity" -> 500, "price" -> 283.10, "side" -> 'B', "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
          row("tradeTime" -> 2L, "quantity" -> 100, "price" -> 94.12, "side" -> 'S', "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
          row("tradeTime" -> 1L, "quantity" -> 100, "price" -> 180.50, "side" -> 'B', "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD")
        )(using clock)
      }
      val parentVp = new DummyViewPort("parentVpId", "parentVp", Set("LDN-0001"), table)
      val filter = VisualLinkedFilter(ViewPortVisualLink(null, parentVp, SimpleColumn("orderId", 0, DataType.StringDataType), SimpleColumn("orderId", 0, DataType.StringDataType)))
      val results = filter.doFilter(table, table.primaryKeys, null, true)
      results.length shouldEqual 1
      results.toSet shouldEqual Set("LDN-0001")
    }

    Scenario("Visual linked filter on non-indexed column with null value") {
      val table = {
        setupTable(List.empty,
          row("tradeTime" -> 5L, "quantity" -> 500, "price" -> 283.10, "side" -> 'B', "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
          row("tradeTime" -> 2L, "quantity" -> 100, "price" -> 94.12, "side" -> 'S', "ric" -> "VOD.L", "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
          row("tradeTime" -> 1L, "quantity" -> 100, "price" -> 180.50, "side" -> 'B', "ric" -> null, "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD")
        )(using clock)
      }
      val parentVp = new DummyViewPort("parentVpId", "parentVp", Set("LDN-0001"), table)
      val filter = VisualLinkedFilter(ViewPortVisualLink(null, parentVp, SimpleColumn("ric", 2, DataType.StringDataType), SimpleColumn("ric", 2, DataType.StringDataType)))
      val results = filter.doFilter(table, table.primaryKeys, null, true)
      results.length shouldEqual 1
      results.toSet shouldEqual Set("LDN-0001")
    }

    Scenario("Visual linked filter on non-indexed column when selected row has null value") {
      val table = {
        setupTable(List.empty,
          row("tradeTime" -> 5L, "quantity" -> 500, "price" -> 283.10, "side" -> 'B', "ric" -> "AAPL.L", "orderId" -> "NYC-0004", "onMkt" -> false, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
          row("tradeTime" -> 2L, "quantity" -> 100, "price" -> 94.12, "side" -> 'S', "ric" -> null, "orderId" -> "LDN-0001", "onMkt" -> true, "trader" -> "chris", "ccyCross" -> "GBPUSD"),
          row("tradeTime" -> 1L, "quantity" -> 100, "price" -> 180.50, "side" -> 'B', "ric" -> "BT.L", "orderId" -> "LDN-0002", "onMkt" -> true, "trader" -> "steve", "ccyCross" -> "GBPUSD")
        )(using clock)
      }
      val parentVp = new DummyViewPort("parentVpId", "parentVp", Set("LDN-0001"), table)
      val filter = VisualLinkedFilter(ViewPortVisualLink(null, parentVp, SimpleColumn("ric", 2, DataType.StringDataType), SimpleColumn("ric", 2, DataType.StringDataType)))
      val results = filter.doFilter(table, table.primaryKeys, null, true)
      results.length shouldEqual 1
      results.toSet shouldEqual Set("LDN-0001")
    }
  }

  private class DummyViewPort(val id: String,
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

    override def ForTest_getSubcribedKeys: ConcurrentHashMap[String, String] = ???

    override def ForTest_getRowKeyToRowIndex: ConcurrentHashMap[String, Int] = ???

    override def delete(): Unit = ???

    override def keyBuildCount: Long = ???

    override def setLastHashAndUpdateCount(lastHash: Int, lastUpdateCount: Long): Unit = ???

    override def getLastHash(): Int = ???

    override def getLastUpdateCount(): Long = ???

    override def setPermissionFilter(filter: PermissionFilter): Unit = ???

    override def getPermissionFilter: PermissionFilter = ???
  }

}
