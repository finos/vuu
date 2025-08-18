package org.finos.vuu.provider.simulation

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.logging.LogAtFrequency
import org.finos.toolbox.thread.{LifeCycleRunner, RunInThread}
import org.finos.toolbox.time.Clock
import org.finos.vuu.core.table.{DataTable, RowWithData}
import org.finos.vuu.provider.Provider

import java.util.Random
import java.util.concurrent.ConcurrentHashMap
import scala.jdk.CollectionConverters._

trait SimulationMode {
  def asCode: Int
}

case class Simulation(mode: SimulationMode, beganAt: Long, endAt: Long)

case object TakeAWalk extends SimulationMode {
  override def asCode: Int = 1
}

case object WidenBidAsk extends SimulationMode {
  override def asCode: Int = 2
}

case object FastTick extends SimulationMode {
  override def asCode: Int = 3
}

case object NoOp extends SimulationMode {
  override def asCode: Int = 4
}

case object Close extends SimulationMode {
  override def asCode: Int = 5
}

case object Open extends SimulationMode {
  override def asCode: Int = 6
}

object PricesFields {
  final val Ric = "ric"
  final val Bid = "bid"
  final val Ask = "ask"
  final val BidSize = "bidSize"
  final val AskSize = "askSize"
  final val Last = "last"
  final val Close = "close"
  final val Open = "open"
  final val Scenario = "scenario"
  final val Phase = "phase"
}

class SimulatedPricesProvider(val table: DataTable, @volatile var maxSleep: Int = 400)(implicit val timeProvider: Clock, lifecycle: LifecycleContainer) extends Provider with StrictLogging with RunInThread {
  def maxAsk(bid: Double, ask: Double, spreadMultipler: Double, priceMaxDelta: Double) = {
    val spread = ask - bid
    Math.min(ask + spreadMultipler * spread, spread / 2 + bid + priceMaxDelta)
  }

  def minAsk(bid: Double, ask: Double, spreadMultipler: Double, priceMaxDelta: Double) = {
    Math.max(bid + 1, (ask - bid) / 2 + bid)
  }

  def maxBid(bid: Double, ask: Double, spreadMultipler: Double, priceMaxDelta: Double) = {
    val result = Math.min(ask - 1, (ask - bid) / 2 + bid)
    if (result < 1) bid + 1 else result
  }

  def minBid(bid: Double, ask: Double, spreadMultipler: Double, priceMaxDelta: Double) = {
    val spread = ask - bid
    val mid = spread / 2 + bid
    val result = Math.max(bid - Math.min(spreadMultipler * spread, 10), mid - priceMaxDelta)
    if (result < 0) bid else result
  }

  def nextRandomDouble(min: Double, max: Double) = {
    val r = new Random()
    min + (max - min) * r.nextDouble
  }

  def generateNextBidAsk(bid: Double, ask: Double, spreadMultipler: Double, priceMaxDelta: Double, nextRandomDouble: (Double, Double) => Double) = {
    var tempAsk = ask
    if ((bid - ask).abs <= 1) tempAsk = ask + 1
    val minBidValue = minBid(bid, tempAsk, spreadMultipler, priceMaxDelta)
    val maxBidValue = maxBid(bid, tempAsk, spreadMultipler, priceMaxDelta)
    val minAskValue = minAsk(bid, tempAsk, spreadMultipler, priceMaxDelta)
    val maxAskValue = maxAsk(bid, tempAsk, spreadMultipler, priceMaxDelta)
    val newBid = round(nextRandomDouble(minBidValue, maxBidValue))
    val newAsk = round(nextRandomDouble(minAskValue, maxAskValue))
    (newBid, newAsk)
  }


  private val currentModes = new ConcurrentHashMap[String, Simulation]()
  private val states = new ConcurrentHashMap[String, Map[String, Any]]()

  private var cycleCount = 0

  val runner = new LifeCycleRunner("pricesProvider", () => runOnce())

  lifecycle(this).dependsOn(runner)

  val logAt = new LogAtFrequency(10_000)

  val doEvery5Mins = new LogAtFrequency(1000 * 60 * 3)

  def setSpeed(maxSpeed: Int): Unit = {
    this.maxSleep = maxSpeed
  }

  override def subscribe(key: String): Unit = {
    //logger.info(s"Prices Subscribe Called: ${key}")
    val began = timeProvider.now()
    val end = began + seededRand(began, 100, 1000)
    currentModes.put(key, Simulation(NoOp, began, end))
  }

  private def seededRand(seed: Long, low: Int, high: Int): Int = {
    val r = new Random(seed)
    r.nextInt(high - low) + low
  }

  override def runOnce(): Unit = {

    val entrySet = SetHasAsScala(currentModes.entrySet()).asScala

    //    if(logAt.shouldLog()){
    //      logger.info("Cycle Count = " + cycleCount)
    //    }

    if (doEvery5Mins.shouldLog()) {
      val startOfOpen = timeProvider.now() + 5_000
      logger.debug("[PRICES] Moving into Closed Market...")
      entrySet.foreach(me => {
        closeMarket(me.getKey, startOfOpen)
      })
    }
    else {
      entrySet.foreach(me => {
        processOne(me.getKey, me.getValue)
      })
    }

    cycleCount += 1

    timeProvider.sleep(seededRand(timeProvider.now(), 10, maxSleep))
  }

  protected def closeMarket(ric: String, timeToOpen: Long): Unit = {
    val newRow = getState(ric) match {
      case Some(row) => mergeLeft(row, close(ric, row))
      case None => Map(f.Ric -> ric) //do nothing
    }

    currentModes.put(ric, Simulation(Close, this.timeProvider.now(), timeToOpen))

    setState(ric, newRow)
    table.processUpdate(ric, RowWithData(ric, newRow))
  }

  protected def processOne(ric: String, simulation: Simulation): Unit = {
    val newRow = if (simulation.endAt <= timeProvider.now()) {
      if (simulation.mode.equals(Close)) {
        assignSpecificSimulation(ric, Open)
      }
      else {
        assignNewSimulation(ric)
      }
    } else {
      simulation.mode match {
        case NoOp => doNoOp(ric)
        case TakeAWalk => doTakeAWalk(ric)
        case WidenBidAsk =>
          doWidenBidAndAsk(ric)
        case FastTick => doFastTick(ric)
        case Close => doCloseTick(ric)
        case Open => doOpenTick(ric)
      }
    }

    setState(ric, newRow)

    table.processUpdate(ric, RowWithData(ric, newRow))
  }

  private def getState(ric: String): Option[Map[String, Any]] = {
    val theState = states.get(ric)
    Option(theState)
  }

  private def setState(ric: String, row: Map[String, Any]): Unit = {
    states.put(ric, row)
  }

  protected def doTakeAWalk(ric: String): Map[String, Any] = {
    val newRow = getState(ric) match {
      case Some(row) => mergeLeft(row, walkBidAndAsk(ric, row))
      case None => buildSampleRow(ric)
    }
    newRow
  }

  val f: PricesFields.type = PricesFields

  private def close(ric: String, existing: Map[String, Any]): Map[String, Any] = {

    val price = existing.get(f.Bid) match {
      case Some(bid) => bid
      case None => existing.get(f.Ask) match {
        case Some(ask) => ask
        case None => existing.get(f.Last) match {
          case Some(last) => last
          case None => nextRandomDouble(0, 1000)
        }
      }
    }

    Map(f.Ric -> ric, f.Close -> price, f.Open -> null, f.Scenario -> "close", f.Phase -> "X")
  }

  private def walkBidAndAsk(ric: String, existing: Map[String, Any]) = {
    if (!existing.contains(f.Bid))
      buildSampleRow(existing(f.Ric).asInstanceOf[String])
    else {
      val bid = existing(f.Bid).asInstanceOf[Double]
      val ask = existing(f.Ask).asInstanceOf[Double]
      val (newBid:Double, newAsk:Double) = generateNextBidAsk(bid, ask, 10.0, 5.0, nextRandomDouble)
      Map(f.Ric -> ric, f.Bid -> newBid, f.Ask -> newAsk, f.Scenario -> "walkBidAsk", f.Phase -> "C")
    }
  }

  def BidAskSize(): Map[String, Any] = {
    val bidSize = seededRand(timeProvider.now(), 1, 20) * 100
    val askSize = seededRand(timeProvider.now(), 1, 20) * 100
    Map(f.BidSize -> bidSize, f.AskSize -> askSize)
  }

  def BidAskSizeNull(): Map[String, Any] = {
    Map(f.BidSize -> null, f.AskSize -> null)
  }

  protected def mergeLeft(existing: Map[String, Any], newMap: Map[String, Any]): Map[String, Any] = {
    existing ++ newMap
  }

  def initBidAsk(priceMaxDelta: Double, nextRandomDouble: (Double, Double) => Double) = {
    val mid = nextRandomDouble(0, 1000)
    val tempBid = nextRandomDouble(mid - priceMaxDelta, mid - 1)
    val ask = nextRandomDouble(mid + 1, mid + priceMaxDelta)
    val bid = if (tempBid < 0) mid else tempBid
    val newBid = round(bid)
    val newAsk = round(ask)
    (newBid, newAsk)
  }
  protected def buildSampleRow(ric: String): Map[String, Any] = {
    val(bid: Double, ask:Double) = initBidAsk(5,nextRandomDouble)
    Map(f.Ric -> ric, f.Ask -> ask, f.Bid -> bid, f.Phase -> "C") ++ BidAskSize()
  }

  final val MaxSpread = 10

  protected def doWidenBidAndAsk(ric: String): Map[String, Any] = {
    if (!states.get(ric).contains(f.Bid)) {
      seedStartValues(ric)
    } else {
      getState(ric) match {
        case Some(state) =>
          val bid = state(f.Bid).asInstanceOf[Double]
          val ask = state(f.Ask).asInstanceOf[Double]
          val spread = ask - bid
          val activeSpread = if (spread > MaxSpread)
            0.0
          else
            spread

          val newBid = round(bid - activeSpread)
          val newAsk = round(ask + activeSpread)
          Map(f.Ric -> ric, f.Ask -> newAsk, f.Bid -> newBid, f.Scenario -> "widenBidAndAsk", f.Phase -> "C") ++ BidAskSize()
        case None => throw new Exception("shouldn't get here")
      }
    }
  }

  protected def doFastTick(ric: String): Map[String, Any] = {

    if (!states.get(ric).contains(f.Bid))
      seedStartValues(ric)
    else {
      val bid = states.get(ric)(f.Bid).asInstanceOf[Double]
      val ask = states.get(ric)(f.Ask).asInstanceOf[Double]
      val (newBid:Double, newAsk:Double) = generateNextBidAsk(bid, ask, 10, 5, nextRandomDouble)
      val last = round(ask + (newAsk - ask) / 2)
      Map(f.Ric -> ric, f.Ask -> newAsk, f.Bid -> newBid, f.Scenario -> "fastTick", f.Last -> last, f.Phase -> "C") ++ BidAskSize()
    }
  }

  private def round(value: Double): Double = {
    (value * 100).round / 100.0
  }

  protected def doOpenTick(ric: String): Map[String, Any] = {

    if (!states.get(ric).contains(f.Bid))
      seedStartValues(ric)
    else {
      val bid = states.get(ric)(f.Bid).asInstanceOf[Double]
      val ask = states.get(ric)(f.Ask).asInstanceOf[Double]
      val (newBid: Double, newAsk: Double) = generateNextBidAsk(bid, ask, 8, 4, nextRandomDouble)
      val open = round(ask + (newAsk - ask) / 2)
      Map(f.Ric -> ric, f.Scenario -> "open", f.Open -> open, f.Phase -> "O") ++ BidAskSize()
    }
  }

  protected def doCloseTick(ric: String): Map[String, Any] = {

    if (!states.get(ric).contains(f.Bid))
      seedStartValues(ric)
    else {
      Map(f.Ric -> ric, f.Scenario -> "close", f.Phase -> "X") ++ BidAskSizeNull()
    }
  }

  protected def seedStartValues(ric: String): Map[String, Any] = {
    val (bid:Double, ask:Double) = initBidAsk(5, nextRandomDouble)
    Map(f.Ric -> ric, f.Ask -> ask, f.Bid -> bid, f.Phase -> "C") ++ BidAskSize()
  }

  protected def doNoOp(ric: String): Map[String, Any] = {
    getState(ric) match {
      case Some(row) => mergeLeft(row, Map[String, Any](f.Scenario -> "noop"))
      case None => buildSampleRow(ric)
    }
  }

  protected def assignNewSimulation(ric: String): Map[String, Any] = {
    val strategy = seededRand(timeProvider.now(), 1, 4)
    val impl = strategy match {
      case 1 => TakeAWalk
      case 2 => WidenBidAsk
      case 3 => FastTick
      case 4 => NoOp
    }

    val begin = timeProvider.now()
    val end = seededRand(begin, 10, 10000)

    currentModes.put(ric, Simulation(impl, begin, begin + end))

    val existing = states.get(ric)
    if (existing == null)
      buildSampleRow(ric)
    else
      existing
  }

  protected def assignSpecificSimulation(ric: String, impl: SimulationMode): Map[String, Any] = {

    val begin = timeProvider.now()
    val end = seededRand(begin, 9_000, 10_000)

    currentModes.put(ric, Simulation(impl, begin, begin + end))

    val existing = states.get(ric)
    if (existing == null)
      buildSampleRow(ric)
    else
      existing
  }

  override def doStop(): Unit = {}

  override def doStart(): Unit = {}

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "simulationPrices"
}
