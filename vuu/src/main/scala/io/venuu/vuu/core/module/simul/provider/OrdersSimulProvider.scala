package io.venuu.vuu.core.module.simul.provider

import java.util
import java.util.Random
import java.util.concurrent.atomic.AtomicInteger

import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.thread.LifeCycleRunner
import io.venuu.toolbox.time.TimeProvider
import io.venuu.vuu.core.table.{DataTable, RowWithData}
import io.venuu.vuu.provider.Provider

class SeededRandom(seed: Long){

  val random = new Random(seed)

  def seededRand(low: Int, high: Int): Int = {
    random.nextInt(high-low) + low;
  }

}

case class Curve(points: Array[(Long, Int)])

case class OrderDetail(orderId: String, side: Char, ccy: String, ric: String,
                       location: String, quantity: Double, trader: String, filledQuantity: Double, lastUpdate: Long, created: Long)

class OrderSimulator(table: DataTable)(implicit time: TimeProvider){

  private val orders = new util.Hashtable[String, OrderDetail]()
  private val orderCount = new AtomicInteger(0)
  private val seededRandom = new SeededRandom(time.now())

  def createOrderNyc(i: Int) = {
    createOrder(i, "NYC", "USD","AAPL.N")
  }

  def createOrderLdn(i: Int) = {
    createOrder(i, "LDN", "GBp", "VOD.L")
  }

  def createOrder(i: Int, location: String, currency: String, symbol: String) = {

    val orderNum = orderCount.incrementAndGet()

    val pad = ("0".padTo(6 - orderNum.toString.length, "0").mkString("")).toString()

    val orderId = s"$location-" + pad + orderNum

    val side: Char = seededRandom.seededRand(1, 2) match {
      case 1 => 'B'
      case 2 => 'S'
    }

    val ccy = currency

    val quantity  = seededRandom.seededRand(100, 100000)

    val od        = OrderDetail(orderId, side, ccy, symbol, location, quantity, "stevchrs", 0, time.now(), time.now())

    orders.put(od.orderId, od)

    val asMap     = toMap(od)

    table.processUpdate(od.orderId, RowWithData(od.orderId, asMap), time.now())


  }



  private def toMap(od: OrderDetail): Map[String, Any] = {

    def objToMap(cc: AnyRef) =
      (Map[String, Any]() /: cc.getClass.getDeclaredFields) {(a, f) =>
        f.setAccessible(true)
        a + (f.getName -> f.get(cc))
      }

    objToMap(od)
  }

  def fillOrder(od: OrderDetail): Unit = {

    val shapes: Int = seededRandom.seededRand(1, 10)

    val secsPerFill = seededRandom.seededRand(1, 2)

    val fillPerQty = od.quantity / shapes

    val asMap     = toMap(od)

    var filledQty: Double = 0

    while(filledQty < od.quantity){

      filledQty += fillPerQty

      val upMap = asMap ++ Map("filledQuantity" -> filledQty)

      table.processUpdate(od.orderId, RowWithData(od.orderId, upMap), time.now())

      time.sleep(secsPerFill * 300)
    }
  }

  def fillOrders() = {

    val enum = orders.elements()

    while(enum.hasMoreElements) {
      val next = enum.nextElement()
      fillOrder(next)
    }

  }

  def deleteOrders() = {

    import scala.collection.JavaConversions._

    val entries = orders.elements().toList

    val deletePerSec = seededRandom.seededRand(1 ,2)

    entries.foreach(od => {

      table.processDelete(od.orderId)

      orders.remove(od.orderId)

      time.sleep(deletePerSec * 200)
    } )

  }


  def runOnce: Unit = {

    //1.
    //allocate a quantity of orders to create
    val quantity = 10

    val ratePerSecond = 0.5

    val sleepInterval: Long = (1 / ratePerSecond).toLong

    (0 to quantity).foreach( i => { createOrderNyc(i); time.sleep(sleepInterval * 100) })

    (0 to quantity).foreach( i => { createOrderLdn(i); time.sleep(sleepInterval * 100) })

    time.sleep(1000)

    fillOrders()

    time.sleep(1000)

    deleteOrders()

    time.sleep(1000)

  }

}



/**
  * Created by chris on 11/09/2016.
  */
class OrdersSimulProvider(table: DataTable)(implicit timeProvider: TimeProvider, lifecycleContainer: LifecycleContainer) extends Provider {

  private val simulator = new OrderSimulator(table)
  private val runner = new LifeCycleRunner("ordersSimulProvider", () => simulator.runOnce )

  lifecycleContainer(this).dependsOn(runner)

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "ordersSimulProvider"
}
