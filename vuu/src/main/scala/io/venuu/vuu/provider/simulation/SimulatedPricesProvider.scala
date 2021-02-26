/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 18/11/2015.

  */
package io.venuu.vuu.provider.simulation

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.lifecycle.LifecycleContainer
import io.venuu.toolbox.thread.{LifeCycleRunner, RunInThread}
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.core.table.{DataTable, RowWithData}
import io.venuu.vuu.provider.Provider

import java.util.Random
import java.util.concurrent.ConcurrentHashMap
import scala.jdk.CollectionConverters._

trait SimulationMode{
  def asCode: Int
}

case class Simulation(val mode: SimulationMode, beganAt: Long, endAt: Long)

case object TakeAWalk extends SimulationMode{
  override def asCode: Int = 1
}

case object WidenBidAsk extends SimulationMode{
  override def asCode: Int = 2
}

case object FastTick extends SimulationMode{
  override def asCode: Int = 3
}

case object NoOp extends SimulationMode{
  override def asCode: Int = 4
}

object PricesFields{
  final val Ric = "ric"
  final val Bid = "bid"
  final val Ask = "ask"
  final val BidSize = "bidSize"
  final val AskSize = "askSize"
  final val LastTick = "lastTick"
  final val Scenario = "scenario"
}

class SimulatedPricesProvider(val table: DataTable, maxSleep: Int = 200)(implicit val timeProvider: Clock, lifecycle:  LifecycleContainer) extends Provider with StrictLogging with RunInThread {
  private val currentModes = new ConcurrentHashMap[String, Simulation]()
  private val states = new ConcurrentHashMap[String, Map[String, Any]]()

  val runner = new LifeCycleRunner("pricesProvider", () => runOnce() )

  lifecycle(this).dependsOn(runner)

  override def subscribe(key: String): Unit = {
    //logger.info(s"Prices Subscribe Called: ${key}")
    val began = timeProvider.now()
    val end = began + seededRand(began, 100, 1000)
    currentModes.put(key, Simulation(NoOp, began, end))
  }

  private def seededRand(seed: Long, low: Int, high: Int): Int = {
    val r = new Random(seed);
    r.nextInt(high-low) + low;
  }

  override def runOnce(): Unit = {

    val entrySet = SetHasAsScala(currentModes.entrySet()).asScala

    entrySet.foreach(me => {
      processOne(me.getKey, me.getValue)
    })

    timeProvider.sleep(seededRand(timeProvider.now(), 0, maxSleep))
  }

  protected def processOne(ric: String, simulation: Simulation): Unit = {
    val newRow = if(simulation.endAt <= timeProvider.now())
      assignNewSimulation(ric)
    else{
      simulation.mode match {
        case NoOp => doNoOp(ric)
        case TakeAWalk => doTakeAWalk(ric)
        case WidenBidAsk => doWidenBidAndAsk(ric)
        case FastTick => doFastTick(ric)
      }
    }
    setState(ric, newRow)

    table.processUpdate(ric, RowWithData(ric, newRow), timeProvider.now())
  }

  private def getState(ric: String): Option[Map[String, Any]] = {
    val theState = states.get(ric)
    Option(theState)
  }

  private def setState(ric: String, row: Map[String, Any]): Unit = {
    states.put(ric, row)
  }

  protected def doTakeAWalk(ric: String): Map[String, Any] = {
    val smallInc = seededRand(timeProvider.now, 0, 100)

    val newRow = getState(ric) match {
      case Some(row) => mergeLeft(row, walkBidAndAsk(row))
      case None => buildSampleRow(ric)
    }
    newRow
  }

  val f = PricesFields

  private def walkBidAndAsk(existing: Map[String, Any]) = {
    if(!existing.contains(f.Bid))
      buildSampleRow(existing.get(f.Ric).get.asInstanceOf[String])
    else{
      val bid = existing.get(f.Bid).get.asInstanceOf[Double]
      val ask = existing.get(f.Ask).get.asInstanceOf[Double]
      val diff = ask - bid
      val inc = seededRand(timeProvider.now(), 0, 50)
      val delta = (inc / 100).asInstanceOf[Double]

      Map(f.Bid -> (bid + delta), f.Ask -> (ask + delta), f.Scenario -> "walkBidAsk" )
    }
  }

  protected def mergeLeft(existing: Map[String, Any], newMap: Map[String, Any]): Map[String, Any] = {
    existing ++ newMap
  }

  protected def buildSampleRow(ric: String): Map[String, Any] = {
    val basePrice = seededRand(timeProvider.now(), 0, 10000)
    val adjusted = (basePrice / 100).asInstanceOf[Double]
    val spread = seededRand(timeProvider.now(), 0, 100)
    val adjustedSpread = (spread / 100).asInstanceOf[Double]
    val askSize = seededRand(timeProvider.now(), 0, 1000)
    val bidSize = seededRand(timeProvider.now(), 0, 2000)

    Map(f.Ric -> ric, f.Ask -> (adjusted + adjustedSpread), f.Bid -> (adjusted - adjustedSpread), f.AskSize -> askSize, f.BidSize -> bidSize)
  }

  final val MaxSpread = 100

  protected def doWidenBidAndAsk(ric: String): Map[String, Any] = {
    if(!states.get(ric).contains(ric)){
      seedStartValues(ric)
    }else{
      val spread = seededRand(timeProvider.now(), 1, 567)
      getState(ric) match {
        case Some(state) =>
          val bid     = state.get(f.Bid).get.asInstanceOf[Double]
          val ask     = state.get(f.Ask).get.asInstanceOf[Double]
          val spread  = (ask - bid)
          val activeSpread = if(spread > MaxSpread)
            0.0
          else
            spread

          val newBid = bid - activeSpread
          val newAsk = ask + activeSpread

          Map(f.Ask -> newAsk, f.Bid -> newBid, f.Scenario -> "widenBidAndAsk")
        case None => throw new Exception("shouldn't get here")
      }
    }
  }



  protected def doFastTick(ric: String): Map[String, Any] = {

    if(!states.get(ric).contains(f.Bid))
      seedStartValues(ric)
    else{
      val bidAdjust = seededRand(timeProvider.now(), 0, 10)
      val askAdjust = seededRand(timeProvider.now(), 0, 20)
      val bid     = states.get(ric).get(f.Bid).get.asInstanceOf[Double] + bidAdjust
      val ask     = states.get(ric).get(f.Ask).get.asInstanceOf[Double] + askAdjust
      Map(f.Ask -> ask, f.Bid -> bid, f.Scenario -> "fastTick")
    }
  }

  protected def seedStartValues(ric: String): Map[String, Any] = {
    val bid: Double = seededRand(timeProvider.now(), 0, 1000)
    val ask: Double = bid + (bid / 100)
    val bidSize = seededRand(timeProvider.now(), 0, 1000)
    val askSize = seededRand(timeProvider.now(), 0, 1000)
    Map(f.Ric -> ric, f.Ask -> ask, f.Bid -> bid, f.BidSize -> bidSize, f.AskSize -> askSize)
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
    if(existing == null)
      buildSampleRow(ric)
    else
      existing
  }

  //no epxlicit doStop or doDestroy required as is handled by running in thread.
  override def doStop(): Unit = {
    //runner.stop()
  }

  //var runner: LifeCycleRunner = null

  override def doStart(): Unit = {



  }

  override def doInitialize(): Unit = {}

  override def doDestroy(): Unit = {}

  override val lifecycleId: String = "simulationPrices"
}
