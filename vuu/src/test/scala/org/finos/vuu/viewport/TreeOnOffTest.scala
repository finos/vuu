package org.finos.vuu.viewport

import org.finos.toolbox.jmx.{MetricsProvider, MetricsProviderImpl}
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, TestFriendlyClock}
import org.finos.vuu.client.messages.RequestId
import org.finos.vuu.core.auths.VuuUser
import org.finos.vuu.core.table.ViewPortColumnCreator
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.util.OutboundRowPublishQueue
import org.finos.vuu.util.table.TableAsserts.assertVpEq
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers
import org.scalatest.prop.Tables.Table

class TreeOnOffTest extends AnyFeatureSpec with Matchers with ViewPortSetup {

  def addGroupBy(session: ClientSessionId, vpContainer: ViewPortContainer, vpRange: ViewPortRange,
                 viewPort: ViewPort, groupByClause: GroupBy): ViewPort = {
    val columns = viewPort.getStructure.columns
    val viewport = vpContainer.change(RequestId.oneNew(), session, viewPort.id, vpRange, columns, groupBy = groupByClause)
    viewport
  }

  def removeGroupBy(session: ClientSessionId, vpContainer: ViewPortContainer, vpRange: ViewPortRange, viewPort: ViewPort): ViewPort= {
    val columns = viewPort.getStructure.columns
    val viewport = vpContainer.change(RequestId.oneNew(), session, viewPort.id, vpRange, columns, groupBy = NoGroupBy)
    viewport
  }

  Feature("create a groupbys on vps multiple times") {

    Scenario("create groupby, remove, create, remove") {

      implicit val clock : Clock = new TestFriendlyClock(TestTimeStamp.EPOCH_DEFAULT)
      implicit val lifeCycle: LifecycleContainer = new LifecycleContainer
      implicit val metrics: MetricsProvider = new MetricsProviderImpl

      val (joinProvider, orders, prices, orderPrices, ordersProvider, pricesProvider, viewPortContainer) = setup()

      joinProvider.start()

      tickInData(ordersProvider, pricesProvider)

      joinProvider.runOnce()

      val queue = new OutboundRowPublishQueue()
      val user = VuuUser("B")
      val session = ClientSessionId("A", "B", "C")
      val columns = ViewPortColumnCreator.create(orderPrices, orderPrices.getTableDef.columns.map(_.name).toList)
      val range = ViewPortRange(0, 20)
      val viewPort = viewPortContainer.create(RequestId.oneNew(), user, session, queue, orderPrices, range, columns)

      runContainersOnce(viewPortContainer, joinProvider)

      assertVpEq(filterByVpId(combineQs(viewPort), viewPort)) {
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1311544800000L,100       ,100       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1311544800000L,200       ,200       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800000L,300       ,300       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800000L,400       ,400       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800000L,500       ,500       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0006","steve"   ,"VOD.L"   ,1311544800000L,600       ,600       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0007","steve"   ,"BT.L"    ,1311544800000L,1000      ,1000      ,500.0     ,501.0     ,null      ,null      ,null      ),
          ("NYC-0008","steve"   ,"BT.L"    ,1311544800000L,500       ,500       ,500.0     ,501.0     ,null      ,null      ,null      )
        )
      }

      emptyQueues(viewPort)

      addGroupBy(session, viewPortContainer,  range, viewPort,
          GroupBy(orderPrices, columns.getColumnForName("trader").get, columns.getColumnForName("ric").get)
              .withSum("quantity")
              .withCount("trader")
              .asClause())

      runContainersOnce(viewPortContainer, joinProvider)

      assertVpEq(filterByVpId(combineQs(viewPort), viewPort)) {
        Table(
          ("_isOpen" ,"_depth"  ,"_treeKey","_isLeaf" ,"_childCount","_caption","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          (false     ,1         ,"$root|chris",false     ,1         ,"chris"   ,""        ,1         ,""        ,""        ,1500.0    ,""        ,""        ,""        ,""        ,""        ),
          (false     ,1         ,"$root|steve",false     ,2         ,"steve"   ,""        ,1         ,""        ,""        ,2100.0    ,""        ,""        ,""        ,""        ,""        )
        )
      }

      val viewPortNoGb = removeGroupBy(session, viewPortContainer,  range, viewPort)

      runContainersOnce(viewPortContainer, joinProvider)

      assertVpEq(filterByVpId(combineQs(viewPortNoGb), viewPortNoGb)) {
        Table(
          ("orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          ("NYC-0001","chris"   ,"VOD.L"   ,1311544800000L,100       ,100       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0002","chris"   ,"VOD.L"   ,1311544800000L,200       ,200       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0003","chris"   ,"VOD.L"   ,1311544800000L,300       ,300       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0004","chris"   ,"VOD.L"   ,1311544800000L,400       ,400       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0005","chris"   ,"VOD.L"   ,1311544800000L,500       ,500       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0006","steve"   ,"VOD.L"   ,1311544800000L,600       ,600       ,220.0     ,222.0     ,null      ,null      ,null      ),
          ("NYC-0007","steve"   ,"BT.L"    ,1311544800000L,1000      ,1000      ,500.0     ,501.0     ,null      ,null      ,null      ),
          ("NYC-0008","steve"   ,"BT.L"    ,1311544800000L,500       ,500       ,500.0     ,501.0     ,null      ,null      ,null      )
        )
      }

      emptyQueues(viewPort)

      addGroupBy(session, viewPortContainer,  range, viewPortNoGb,
        GroupBy(orderPrices, columns.getColumnForName("trader").get, columns.getColumnForName("ric").get)
          .withSum("quantity")
          .withCount("trader")
          .asClause())

      runContainersOnce(viewPortContainer, joinProvider)

      assertVpEq(filterByVpId(combineQs(viewPort), viewPort)) {
        Table(
          ("_isOpen" ,"_depth"  ,"_treeKey","_isLeaf" ,"_childCount","_caption","orderId" ,"trader"  ,"ric"     ,"tradeTime","quantity","bid"     ,"ask"     ,"last"    ,"open"    ,"close"   ),
          (false     ,1         ,"$root|chris",false     ,1         ,"chris"   ,""        ,1         ,""        ,""        ,1500.0    ,""        ,""        ,""        ,""        ,""        ),
          (false     ,1         ,"$root|steve",false     ,2         ,"steve"   ,""        ,1         ,""        ,""        ,2100.0    ,""        ,""        ,""        ,""        ,""        )
        )
      }

    }

  }

}
