package io.venuu.vuu.viewport

import io.venuu.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.TestFriendlyClock
import io.venuu.vuu.net.ClientSessionId
import io.venuu.vuu.util.OutboundRowPublishQueue
import io.venuu.vuu.util.table.TableAsserts.assertVpEq
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class GroupByOnOffTest extends AnyFeatureSpec with Matchers with ViewPortSetup {

  def addGroupBy(session: ClientSessionId, vpContainer: ViewPortContainer, vpRange: ViewPortRange,
                 viewPort: ViewPort, groupByClause: GroupBy): ViewPort = {
    val columns = viewPort.table.asTable.getTableDef.columns.toList
    val viewport = vpContainer.change(session, viewPort.id, vpRange, columns, groupBy = groupByClause)
    viewport
  }

  def removeGroupBy(session: ClientSessionId, vpContainer: ViewPortContainer, vpRange: ViewPortRange, viewPort: ViewPort)= {
    val columns = viewPort.table.asTable.getTableDef.columns.toList
    val viewport = vpContainer.change(session, viewPort.id, vpRange, columns, groupBy = NoGroupBy)
    viewport
  }

  Feature("create a groupbys on vps multiple times") {

    Scenario("create groupby, remove, create, remove") {

      implicit val clock = new TestFriendlyClock(TestTimeStamp.EPOCH_DEFAULT)
      implicit val lifeCycle = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickInData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val queue = new OutboundRowPublishQueue()
      val highPriorityQueue = new OutboundRowPublishQueue()
      val session = ClientSessionId("A", "B")
      val columns = orderPrices.getTableDef.columns.toList
      val range = ViewPortRange(0, 20)
      val viewPort = viewPortContainer.create(session, queue, highPriorityQueue, orderPrices, range, columns)

      runContainersOnce(viewPortContainer, joinProvider)

      assertVpEq(filterByVpId(combineQs(viewPort), viewPort)) {
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1311544800000l,100       ,100       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1311544800000l,200       ,200       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800000l,300       ,300       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800000l,400       ,400       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800000l,500       ,500       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0006","steve"   ,"VOD.L"   ,1311544800000l,600       ,600       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0007","steve"   ,"BT.L"    ,1311544800000l,1000      ,1000      ,500.0     ,501.0     ,null      ,null      ,null      ),
          ("NYC-0008","steve"   ,"BT.L"    ,1311544800000l,500       ,500       ,500.0     ,501.0     ,null      ,null      ,null      )
        )
      }

      emptyQueues(viewPort)

      addGroupBy(session, viewPortContainer,  range, viewPort,
              GroupBy(orderPrices,"trader", "ric")
              .withSum("quantity")
              .withCount("trader")
              .asClause())

      runContainersOnce(viewPortContainer, joinProvider)

      assertVpEq(filterByVpId(combineQs(viewPort), viewPort)) {
        Table(
          ("_isOpen" ,"_depth"  ,"_treeKey","_isLeaf" ,"_childCount","_caption","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          (false     ,1         ,"$root/chris",false     ,1         ,"chris"   ,""        ,"[1]"     ,""        ,""        ,"Σ 1500.0",""        ,""        ,""        ,""        ,""        ),
          (false     ,1         ,"$root/steve",false     ,2         ,"steve"   ,""        ,"[1]"     ,""        ,""        ,"Σ 2100.0",""        ,""        ,""        ,""        ,""        )
        )
      }

      val viewPortNoGb = removeGroupBy(session, viewPortContainer,  range, viewPort)

      runContainersOnce(viewPortContainer, joinProvider)

      assertVpEq(filterByVpId(combineQs(viewPortNoGb), viewPortNoGb)) {
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1311544800000l,100       ,100       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1311544800000l,200       ,200       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800000l,300       ,300       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800000l,400       ,400       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800000l,500       ,500       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0006","steve"   ,"VOD.L"   ,1311544800000l,600       ,600       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0007","steve"   ,"BT.L"    ,1311544800000l,1000      ,1000      ,500.0     ,501.0     ,null      ,null      ,null      ),
          ("NYC-0008","steve"   ,"BT.L"    ,1311544800000l,500       ,500       ,500.0     ,501.0     ,null      ,null      ,null      )
        )
      }

      emptyQueues(viewPort)

      addGroupBy(session, viewPortContainer,  range, viewPortNoGb,
        GroupBy(orderPrices,"trader", "ric")
          .withSum("quantity")
          .withCount("trader")
          .asClause())

      runContainersOnce(viewPortContainer, joinProvider)

      assertVpEq(filterByVpId(combineQs(viewPort), viewPort)) {
        Table(
          ("_isOpen" ,"_depth"  ,"_treeKey","_isLeaf" ,"_childCount","_caption","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          (false     ,1         ,"$root/chris",false     ,1         ,"chris"   ,""        ,"[1]"     ,""        ,""        ,"Σ 1500.0",""        ,""        ,""        ,""        ,""        ),
          (false     ,1         ,"$root/steve",false     ,2         ,"steve"   ,""        ,"[1]"     ,""        ,""        ,"Σ 2100.0",""        ,""        ,""        ,""        ,""        )
        )
      }

    }

  }

}
