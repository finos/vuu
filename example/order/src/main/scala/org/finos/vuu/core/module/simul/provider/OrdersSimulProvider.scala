package org.finos.vuu.core.module.simul.provider

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.thread.LifeCycleRunner
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.Provider

import java.util
import java.util.Random
import java.util.concurrent.atomic.AtomicInteger
import scala.jdk.CollectionConverters._

trait RandomNumbers {
  def nextInt(): Int

  def seededRand(low: Int, high: Int): Int
}

class TestFriendlyRandomNumbers() extends RandomNumbers {
  private var nextInteger = 0

  def setNextInt(i: Int) = {
    nextInteger = i
  }

  override def nextInt(): Int = {
    nextInteger
  }

  override def seededRand(low: Int, high: Int): Int = {
    nextInteger
  }
}

class SeededRandomNumbers(seed: Long) extends RandomNumbers {

  val random = new Random(seed)

  override def nextInt(): Int = random.nextInt()

  def seededRand(low: Int, high: Int): Int = {
    random.nextInt(high - low) + low
  }

}

case class Curve(points: Array[(Long, Int)])

case class OrderDetail(orderId: String, side: Char, ccy: String, ric: String,
                       location: String, quantity: Double, trader: String, filledQuantity: Double, lastUpdate: Long, created: Long)

class OrderSimulator(table: DataTable)(implicit time: Clock) {

  private val orders = new util.Hashtable[String, OrderDetail]()
  private val orderCount = new AtomicInteger(0)
  private val seededRandom = new SeededRandomNumbers(time.now())
  private val ordersCount = new SeededRandomNumbers(time.now())

  val nycRICS: Array[String] = Array("AAPL", "GOOG", "TWTR", "AAL", "ABBV")
  val ldnRICS: Array[String] = Array("BT.L", "BP.L", "RDSh.L")

  def randomSymbolNyc(): String = {
    val index = seededRandom.seededRand(0, nycRICS.length)
    nycRICS(index)
  }

  def randomSymbolLdn(): String = {
    val index = seededRandom.seededRand(0, ldnRICS.length)
    ldnRICS(index)
  }

  def createOrderNyc(i: Int) = {
    createOrder(i, "NYC", "USD", randomSymbolNyc())
  }

  def createOrderLdn(i: Int) = {
    createOrder(i, "LDN", "GBp", randomSymbolLdn())
  }

  def createOrder(i: Int, location: String, currency: String, symbol: String) = {

    val orderNum = orderCount.incrementAndGet()

    val pad = "0".padTo(6 - orderNum.toString.length, "0").mkString("")

    val orderId = s"$location-" + pad + orderNum

    val side: Char = seededRandom.seededRand(1, 2) match {
      case 1 => 'B'
      case 2 => 'S'
    }

    val ccy = currency

    val quantity = seededRandom.seededRand(100, 100000)

    val od = OrderDetail(orderId, side, ccy, symbol, location, quantity, "stevchrs", 0, time.now(), time.now())

    orders.put(od.orderId, od)

    val asMap = toMap(od)

    table.processUpdate(od.orderId, RowWithData(od.orderId, asMap))
  }

  private def toMap(od: OrderDetail): Map[String, Any] = {

    def objToMap(cc: AnyRef): Map[String, Any] = {
      cc.getClass.getDeclaredFields.foldLeft(Map[String, Any]()) { (map, field) =>
        field.setAccessible(true)
        map + (field.getName -> field.get(cc))
      }
    }

    objToMap(od)
  }

  private def fillOrder(od: OrderDetail): Unit = {
    val numOfFills = seededRandom.seededRand(1, 10)
    val quantityPerFill = od.quantity / numOfFills
    val secsPerFill = seededRandom.seededRand(1, 2)
    val asMap = toMap(od)

    Range.inclusive(1, numOfFills)
      .map(_ * quantityPerFill)
      .map(v => asMap + ("filledQuantity" -> v))
      .foreach(m => {
        table.processUpdate(od.orderId, RowWithData(od.orderId, m))
        time.sleep(secsPerFill * 50)
      })
  }

  def fillOrders() = {

    val orderDetails = orders.elements()

    while (orderDetails.hasMoreElements) {
      val next = orderDetails.nextElement()
      fillOrder(next)
    }

  }

  def deleteOrders() = {

    val entries = EnumerationHasAsScala(orders.elements()).asScala.toList

    val deletePerSec = seededRandom.seededRand(1, 2)

    entries.foreach(od => {

      table.processDelete(od.orderId)

      orders.remove(od.orderId)

      time.sleep(deletePerSec * 100)
    })

  }


  def runOnce: Unit = {

    //1.
    //allocate a quantity of orders to create
    val quantityNY = ordersCount.seededRand(0, 50)

    val quantityLN = ordersCount.seededRand(0, 20)

    val ratePerSecond = 0.5

    val sleepInterval: Long = (1 / ratePerSecond).toLong

    (0 to quantityNY).foreach(i => {
      createOrderNyc(i); time.sleep(sleepInterval * 50)
    })

    (0 to quantityLN).foreach(i => {
      createOrderLdn(i); time.sleep(sleepInterval * 50)
    })

    time.sleep(1000)

    fillOrders()

    time.sleep(1000)

    deleteOrders()

    time.sleep(1000)

  }

}


class OrdersSimulProvider(table: DataTable)(implicit timeProvider: Clock, lifecycleContainer: LifecycleContainer) extends Provider {

  private val simulator = new OrderSimulator(table)
  private val runner = new LifeCycleRunner("ordersSimulProvider", () => simulator.runOnce)

  lifecycleContainer(this).dependsOn(runner)

  override def subscribe(key: String): Unit = {}

  override def doStart(): Unit = {}

  override def doStop(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "ordersSimulProvider"
}
