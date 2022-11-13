package org.finos.vuu.core.module.simul.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.Clock

import java.util.concurrent.{ConcurrentHashMap, DelayQueue, Delayed, TimeUnit}

case class ParentOrder(id: Int, ric: String, price: Double, quantity: Int, side: String, account: String, exchange: String, ccy: String, algo: String, volLimit: Double, filledQty: Int, openQty: Int, averagePrice: Double, status: String, remainingQty: Int, activeChildren: Int)

case class ChildOrder(parentId: Int, id: Int, ric: String, price: Double, quantity: Int, side: String, account: String, strategy: String, exchange: String, ccy: String, volLimit: Double, filledQty: Int, openQty: Int, averagePrice: Double, status: String)

trait OrderListener {
  def onNewParentOrder(parentOrder: ParentOrder)

  def onAmendParentOrder(parentOrder: ParentOrder)

  def onCancelParentOrder(parentOrder: ParentOrder)

  def onDeleteParentOrder(parentOrder: ParentOrder)

  def onNewChildOrder(child: ChildOrder)

  def onAmendChildOrder(child: ChildOrder)

  def onCancelChildOrder(child: ChildOrder)
}

trait DelayQueueAction extends Delayed {

  def timeToRun: Long

  def clock: Clock

  def remainingMillis(): Long = timeToRun - clock.now()

  override def getDelay(unit: TimeUnit): Long = {
    unit.convert(remainingMillis, TimeUnit.MILLISECONDS)
  }

  override def compareTo(o: Delayed): Int = {
    if (this.getDelay(TimeUnit.MILLISECONDS) > o.getDelay(TimeUnit.MILLISECONDS)) {
      1
    } else {
      0
    }
  }
}

case class InsertParent(parentOrder: ParentOrder, override val timeToRun: Long, override val clock: Clock) extends DelayQueueAction

case class AmendParent(parentOrder: ParentOrder, override val timeToRun: Long, override val clock: Clock) extends DelayQueueAction

case class CancelParent(parentOrder: ParentOrder, override val timeToRun: Long, override val clock: Clock) extends DelayQueueAction

case class DeleteParent(parentOrder: ParentOrder, override val timeToRun: Long, override val clock: Clock) extends DelayQueueAction

case class InsertChild(child: ChildOrder, parentOrder: ParentOrder, override val timeToRun: Long, override val clock: Clock) extends DelayQueueAction

case class AmendChild(child: ChildOrder, parentOrder: ParentOrder, override val timeToRun: Long, override val clock: Clock) extends DelayQueueAction

case class CancelChild(child: ChildOrder, parentOrder: ParentOrder, override val timeToRun: Long, override val clock: Clock) extends DelayQueueAction

case class DeleteChild(child: ChildOrder, parentOrder: ParentOrder, override val timeToRun: Long, override val clock: Clock) extends DelayQueueAction

case class Instrument(ric: String, exchange: String, ccy: String, seedPrice: Double)

case class Account(name: String)

case class Algo(name: String)

case class Strategy(name: String)

class ParentChildOrdersModel(implicit clock: Clock, lifecycleContainer: LifecycleContainer, randomNumbers: RandomNumbers) {

  private final val queue = new DelayQueue[DelayQueueAction]()
  private final var cycleNumber = 0l
  private var orderId = 0
  private var childOrderId = 0
  private final val MAX_ORDERS = 7000
  private var parentOrderCount = 0;

  private final val MAX_EVENTS_PER_CYCLE = 100


  private val activeOrders = new ConcurrentHashMap[Int, ParentOrder]()
  private val activeChildrenByParentId = new ConcurrentHashMap[Int, List[ChildOrder]]()

  private var listeners: List[OrderListener] = List()

  private final val instruments = List(
    Instrument("BT.L", "XLON", "GBp", 147.53),
    Instrument("BP.L", "XLON", "GBp", 190.45),
    Instrument("RDSA.AS", "XAMS", "EUR", 16.25),
    Instrument("VOD.L", "XAMS", "EUR", 16.25),
    Instrument("BNPP.PA", "XPAR", "EUR", 48.06),
    Instrument("AAPL", "NYSE", "USD", 130.12),
    Instrument("MSFT", "NYSE", "USD", 130.12),
    Instrument("TWTR", "NYSE", "USD", 74.65),
    Instrument("GS", "NYSE", "USD", 312.39),
  )

  private final val accounts = List(
    Account("Big Corp."),
    Account("Fast Hedgy Ltd"),
    Account("Slowly Pensions Co."),
    Account("RobynHood MM")
  )

  private final val algos = List(
    Algo("VWAP"),
    Algo("TWAP"),
    Algo("DARKLIQ"),
    Algo("LITLIQ"),
    Algo("SURESHOT"),
    Algo("IS"),
    Algo("DIRECT"),
  )

  private final val strategies = List(
    Strategy("LitSweep"),
    Strategy("DarkSweep"),
    Strategy("DarkCond"),
    Strategy("Iceberg"),
    Strategy("")
  )

  def registerOrderListener(listener: OrderListener) = {
    listeners = listeners ++ List(listener)
  }

  def notifyOnParentInsert(parentOrder: ParentOrder) = {
    listeners.foreach(l => l.onNewParentOrder(parentOrder))
  }

  def notifyOnChildInsert(childOrder: ChildOrder) = {
    listeners.foreach(l => l.onNewChildOrder(childOrder))
  }

  def notifyOnChildAmend(childOrder: ChildOrder) = {
    listeners.foreach(l => l.onAmendChildOrder(childOrder))
  }

  def notifyOnChildCancel(childOrder: ChildOrder) = {
    listeners.foreach(l => l.onCancelChildOrder(childOrder))
  }

  def notifyOnParentAmend(parentOrder: ParentOrder) = {
    listeners.foreach(l => l.onAmendParentOrder(parentOrder))
  }

  def notifyOnParentCancel(parentOrder: ParentOrder) = {
    listeners.foreach(l => l.onCancelParentOrder(parentOrder))
  }

  def notifyOnParentDelete(parentOrder: ParentOrder) = {
    listeners.foreach(l => l.onDeleteParentOrder(parentOrder))
  }

  def runOnce(): Unit = {

    if (parentOrderCount < MAX_ORDERS) {
      createParents()
    }

    processQueue(MAX_EVENTS_PER_CYCLE)

    cycleNumber += 1
  }

  def processQueue(maxEvents: Int) = {

    var i = 0;

    var entry = queue.poll()

    while (entry != null && i < maxEvents) {
      processOneAction(entry)
      entry = queue.poll()
      i += 1
    }
  }

  def processOneAction(action: DelayQueueAction) = {
    action match {
      case InsertParent(parent, _, _) =>
        notifyOnParentInsert(parent)
        activeOrders.put(parent.id, parent)
        val timeToAmend = randomNumbers.seededRand(1000, 10000)
        val timeToCancel = randomNumbers.seededRand(10000, 120000)
        //queue.offer(AmendParent(parent, clock.now() + timeToAmend, clock))
        //queue.offer(CancelParent(parent, clock.now() + timeToCancel, clock))

        var timeToCreateChild = randomNumbers.seededRand(1000, 3000)
        val childrenToCreate = randomNumbers.seededRand(100, 250)

        (0 to childrenToCreate - 1).foreach(i => {
          queue.offer(InsertChild(createChild(parent), parent, clock.now() + timeToCreateChild, clock))
          timeToCreateChild = randomNumbers.seededRand(1000, 5000)
        })

      case DeleteParent(parent, _, _) =>
      //        if(activeOrders.size() < MAX_ORDERS){
      //          val timeToDelete = 5000
      //          queue.offer(DeleteParent(parent, clock.now() + timeToDelete, clock))
      //        }else{
      //          notifyOnParentDelete(parent)
      //          activeOrders.remove(parent.id)
      //        }
      case AmendParent(parent, _, _) =>
      //        if(activeOrders.get(parent.id) != null){
      //          val amended = amendParent(parent)
      //
      //          activeChildrenByParentId.get(parent.id) match {
      //            case null =>
      //            case children: List[ChildOrder] =>
      //              children.foreach(child => {
      //                val timeToAmend = randomNumbers.seededRand(1000, 10000)
      //                queue.offer(AmendChild(amendChild(child), parent, clock.now + timeToAmend, clock))
      //              })
      //          }
      //
      //          activeOrders.put(parent.id, amended)
      //          notifyOnParentAmend(amended)
      //          randomNumbers.seededRand(0, 10) match {
      //            case i: Int =>
      //              val timeToAmend = randomNumbers.seededRand(3000, 10000)
      //              queue.offer(AmendParent(amended, clock.now() + timeToAmend, clock))
      //          }
      //        }else{
      //          //order dead, no more amends
      //        }

      case CancelParent(parent, _, _) =>
      //        val cancelled = parent.copy(status = "CXLD")
      //        activeOrders.put(parent.id, cancelled)
      //        notifyOnParentCancel(cancelled)
      //        val timeToDelete = 5000
      //        queue.offer(DeleteParent(cancelled, clock.now() + timeToDelete, clock))

      case InsertChild(child, parent, _, _) =>
        notifyOnChildInsert(child)
        val updatedParent = parent.copy(activeChildren = parent.activeChildren + 1, remainingQty = parent.remainingQty - child.quantity)
        activeOrders.put(updatedParent.id, updatedParent)
        activeChildrenByParentId.get(parent.id) match {
          case null =>
            activeChildrenByParentId.put(parent.id, List(child))
          case children: List[ChildOrder] =>
            activeChildrenByParentId.put(parent.id, List(child) ++ children)
        }

      case AmendChild(child, parent, _, _) =>
      //notifyOnChildAmend(child)
    }
  }

  def randomIncrementPrice(childOrder: ChildOrder): ChildOrder = {
    val upDown = randomNumbers.seededRand(0, 100)
    val basisChange = randomNumbers.seededRand(1, 20)

    val change = (basisChange.toDouble / 100d)

    val newPrice = if (upDown < 90) {
      childOrder.price + (childOrder.price * change)
    } else {
      childOrder.price - (childOrder.price * change)
    }
    childOrder.copy(price = newPrice)
  }

  def randomIncrementPrice(parentOrder: ParentOrder): ParentOrder = {
    val upDown = randomNumbers.seededRand(0, 100)
    val basisChange = randomNumbers.seededRand(1, 20)

    val change = (basisChange.toDouble / 100d)

    val newPrice = if (upDown < 90) {
      parentOrder.price + (parentOrder.price * change)
    } else {
      parentOrder.price - (parentOrder.price * change)
    }
    parentOrder.copy(price = newPrice)
  }

  def createParent(): ParentOrder = {
    val instIdx = randomNumbers.seededRand(0, instruments.length - 1)
    val instrument = instruments(instIdx)
    val quantity = randomNumbers.seededRand(0, 30) * 100 + randomNumbers.seededRand(0, 100)
    val side = if (randomNumbers.seededRand(0, 10) > 8) "Buy" else "Sell"
    val account = accounts(randomNumbers.seededRand(0, accounts.length - 1))
    val algo = algos(randomNumbers.seededRand(0, algos.length - 1))
    val volLimit = randomNumbers.seededRand(0, 10) * 10
    val parentId = orderId
    orderId += 1
    ParentOrder(parentId, instrument.ric, instrument.seedPrice, quantity, side, account.name, instrument.exchange, instrument.ccy, algo.name, volLimit, 0, quantity, 0.0, "NEW", quantity, 0)

  }

  def createChild(parentOrder: ParentOrder): ChildOrder = {
    val childId = childOrderId
    childOrderId += 1
    val quantity = parentOrder.quantity
    val side = parentOrder.side
    val account = parentOrder.account
    val strategy = strategies(randomNumbers.seededRand(0, strategies.length - 1))
    val volLimit = parentOrder.volLimit
    ChildOrder(parentOrder.id, childId, parentOrder.ric, parentOrder.price, quantity, side, account, strategy.name, parentOrder.exchange, parentOrder.ccy, volLimit, 0, quantity, 0.0, "NEW")
  }


  def amendParent(parent: ParentOrder): ParentOrder = {
    randomIncrementPrice(parent).copy(status = "AMND")
  }

  def amendChild(child: ChildOrder): ChildOrder = {
    randomIncrementPrice(child).copy(status = "AMND")
  }

  def createParents(): Unit = {
    val ordersToCreate = if (cycleNumber % 10 == 0) {
      randomNumbers.seededRand(1, 5)
    } else {
      randomNumbers.seededRand(20, 50)
    }

    parentOrderCount += ordersToCreate

    (0 to ordersToCreate - 1).foreach(i => queue.offer(InsertParent(createParent(), clock.now() + randomNumbers.seededRand(100, 200), clock)))
  }

  def createChildOrders(parentOrder: ParentOrder): Unit = {

  }

  def amendChildOrders(parentOrder: ParentOrder): Unit = {

  }

  def deleteCompleteParentAndChildOrders(): Unit = {

  }

  def cancelParentAndChildOrders(): Unit = {

  }

}
