package org.finos.vuu.core.module.simul.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.LifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.simul.model.{ChildOrder, ParentOrder}
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.Provider

class PermissionedOrdersProvider(val table: DataTable, val model: ParentChildOrdersModel)(implicit clock: Clock, lifecycleContainer: LifecycleContainer) extends Provider {

  private final val runner = new LifeCycleRunner("permissionedOrdersRunner", () => model.runOnce(), minCycleTime = 10)

  lifecycleContainer(this).dependsOn(runner)

  model.registerOrderListener(new OrderListener {
    override def onNewParentOrder(parentOrder: ParentOrder): Unit = processUpsert(parentOrder)

    override def onAmendParentOrder(parentOrder: ParentOrder): Unit = {
      processUpsert(parentOrder)
    }

    override def onCancelParentOrder(parentOrder: ParentOrder): Unit = processUpsert(parentOrder)

    override def onDeleteParentOrder(parentOrder: ParentOrder): Unit = processDelete(parentOrder)

    override def onNewChildOrder(child: ChildOrder): Unit = {}

    override def onAmendChildOrder(child: ChildOrder): Unit = {}

    override def onCancelChildOrder(child: ChildOrder): Unit = {}
  })

  def processDelete(po: ParentOrder): Unit = {
    table.processDelete(po.id.toString)
  }

  def processUpsert(po: ParentOrder): Unit = {
    //id: Int, ric: String, price: Double, quantity: Int, side: String, account: String, exchange: String, ccy: String, algo: String, volLimit: Double, filledQty: Int, openQty: Int, averagePrice: Double, status: String
    table.processUpdate(po.id.toString, RowWithData(po.id.toString, Map("id" -> po.id.toString, "idAsInt" -> po.id, "ric" -> po.ric, "price" -> po.price, "quantity" -> po.quantity,
      "side" -> po.side, "account" -> po.account, "exchange" -> po.exchange, "ccy" -> po.ccy,
      "algo" -> po.algo, "volLimit" -> po.volLimit, "filledQty" -> po.filledQty, "openQty" -> po.openQty,
      "averagePrice" -> po.averagePrice, "status" -> po.status, "lastUpdate" -> clock.now(), "owner" -> po.owner, "mask" -> po.permissionMask
    )))
  }

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "ParentOrdersProvider"
}
