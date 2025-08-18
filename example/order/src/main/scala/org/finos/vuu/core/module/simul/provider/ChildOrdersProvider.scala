package org.finos.vuu.core.module.simul.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.module.simul.model.{ChildOrder, ParentOrder}
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.Provider

class ChildOrdersProvider(val table: DataTable, model: ParentChildOrdersModel)(implicit clock: Clock, lifecycleContainer: LifecycleContainer) extends Provider {

  lifecycleContainer(this)

  model.registerOrderListener(new OrderListener {
    override def onNewParentOrder(parentOrder: ParentOrder): Unit = {}

    override def onAmendParentOrder(parentOrder: ParentOrder): Unit = {}

    override def onCancelParentOrder(parentOrder: ParentOrder): Unit = {}

    override def onDeleteParentOrder(parentOrder: ParentOrder): Unit = {}

    override def onNewChildOrder(child: ChildOrder): Unit = {
      processUpsert(child)
    }

    override def onAmendChildOrder(child: ChildOrder): Unit = {
      processUpsert(child)
    }

    override def onCancelChildOrder(child: ChildOrder): Unit = {
      processUpsert(child)
    }
  })

  def processDelete(po: ChildOrder): Unit = {
    table.processDelete(po.id.toString)
  }

  def processUpsert(co: ChildOrder): Unit = {
    //id: Int, ric: String, price: Double, quantity: Int, side: String, account: String, exchange: String, ccy: String, algo: String, volLimit: Double, filledQty: Int, openQty: Int, averagePrice: Double, status: String
    table.processUpdate(co.id.toString, RowWithData(co.id.toString, Map("id" -> co.id.toString, "idAsInt" -> co.id, "ric" -> co.ric, "price" -> co.price, "quantity" -> co.quantity,
      "side" -> co.side, "parentOrderId" -> co.parentId, "exchange" -> co.exchange, "ccy" -> co.ccy,
      "strategy" -> co.strategy, "volLimit" -> co.volLimit, "filledQty" -> co.filledQty, "openQty" -> co.openQty,
      "averagePrice" -> co.averagePrice, "status" -> co.status, "lastUpdate" -> clock.now(), "account" -> co.account
    )))
  }

  override def subscribe(key: String): Unit = {
  }

  override def doStart(): Unit = {
  }

  override def doStop(): Unit = {
  }

  override def doInitialize(): Unit = {
  }

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "childOrdersProvider"
}
