/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.

 * Created by chris on 12/02/15.

 */
package io.venuu.vuu.core.table

import io.venuu.toolbox.jmx.MetricsProviderImpl
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.time.DefaultTimeProvider
import io.venuu.vuu.api.TableDef
import io.venuu.vuu.core.table.TableTestHelper._
import io.venuu.vuu.net.ClientSessionId
import io.venuu.vuu.provider.{JoinTableProviderImpl, MockProvider}
import io.venuu.vuu.util.OutboundRowPublishQueue
import io.venuu.vuu.viewport.{DefaultRange, ViewPortContainer}
import org.scalatest.{FeatureSpec, Matchers}

class DataTableTest extends FeatureSpec with Matchers {

  implicit val timeProvider = new DefaultTimeProvider

  feature("Test data table functionality"){

    scenario("When we tick a value through our mock provider, check it arrives in our listener"){

      implicit val lifecycle = new LifecycleContainer
      implicit val metrics = new MetricsProviderImpl

      val joinProvider   = new JoinTableProviderImpl()

      val tableContainer = new TableContainer(joinProvider)

      val outQueue          = new OutboundRowPublishQueue()
      val highPriorityQueue = new OutboundRowPublishQueue()

      val viewPortContainer = new ViewPortContainer(tableContainer)

      val pricesDef = TableDef("prices", "ric", Columns.fromNames("ric:String", "bid:Double", "ask:Double", "last:Double", "open:Double", "close:Double"), "ric")

      val table = new SimpleDataTable(pricesDef, joinProvider)

      val provider = new MockProvider(table)

      val session = new ClientSessionId("sess-01", "chris")

      val vpcolumns = List("ric", "bid", "ask").map(table.getTableDef.columnForName(_)).toList

      val viewPort = viewPortContainer.create(session, outQueue, highPriorityQueue, table, DefaultRange, vpcolumns)

      provider.tick("VOD.L", Map("ric" -> "VOD.L", "bid" -> 220, "ask" -> 223))

      table.primaryKeys.length should equal (1)

      viewPortContainer.runOnce()

      val viewPortUpdate = combineQs(viewPort)

      viewPortUpdate(1).key.key should equal( "VOD.L")
    }
  }

}
