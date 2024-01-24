package org.finos.vuu.core.module.simul.model

trait OrderStore {
  def storeParentOrder(order: ParentOrder): Unit

  def storeChildOrder(parentOrder: ParentOrder, childOrder: ChildOrder): Unit

  def storeParentOrderWithChildren(parentOrder: ParentOrder, childOrders: Iterable[ChildOrder]): Unit

  def findParentOrderById(id: Int): ParentOrder

  def findChildOrderByParentId(parentId: Int): Iterable[ChildOrder]
}
