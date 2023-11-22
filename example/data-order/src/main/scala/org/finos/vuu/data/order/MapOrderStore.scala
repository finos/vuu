package org.finos.vuu.data.order

import java.util.concurrent.ConcurrentHashMap

class MapOrderStore extends OrderStore {
  private val parentOrders = new ConcurrentHashMap[Int, ParentOrder]()
  private val childOrders = new ConcurrentHashMap[Int, List[ChildOrder]]()

  override def storeParentOrder(order: ParentOrder): Unit = {
    parentOrders.put(order.id, order)
  }

  override def storeChildOrder(parentOrder: ParentOrder,
                               childOrder: ChildOrder): Unit = {
    parentOrders.put(parentOrder.id, parentOrder)
    childOrders.get(parentOrder.id) match {
      case null => childOrders.put(parentOrder.id, List(childOrder))
      case children: List[ChildOrder] => childOrders.put(parentOrder.id, childOrder :: children)
    }
  }

  override def findParentOrderById(id: Int): ParentOrder = {
    parentOrders.get(id)
  }


  override def findChildOrderByParentId(parentId: Int): Iterable[ChildOrder] = {
    childOrders.get(parentId)
  }

  override def storeParentOrderWithChildren(parentOrder: ParentOrder, childOrders: Iterable[ChildOrder]): Unit = {
      parentOrders.put(parentOrder.id, parentOrder)
      childOrders.foreach(childOrder => this.storeChildOrder(parentOrder, childOrder))
  }
}
