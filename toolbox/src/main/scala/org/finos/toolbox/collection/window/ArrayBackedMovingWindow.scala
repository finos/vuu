package org.finos.toolbox.collection.window

import org.finos.toolbox.collection.window.ArrayBackedMovingWindow.State

import scala.reflect.ClassTag

object ArrayBackedMovingWindow {
  private[window] case class State[D](range: WindowRange, data: Array[D])
}

class ArrayBackedMovingWindow[DATA <: AnyRef] private (
                                                        initialState: State[DATA]
                                                      )(implicit m: ClassTag[DATA]) extends MovingWindow[DATA] {

  @volatile private var state = initialState

  def this(initialSize: Int)(implicit m: ClassTag[DATA]) = {
    this(State(new WindowRange(0, initialSize), new Array[DATA](initialSize)))
  }

  override def setAtIndex(index: Int, data: DATA): Unit = {
    val currentState = state
    if (currentState.range.isWithin(index)) {
      currentState.data(index - currentState.range.from) = data
      state = currentState.copy()
    }
  }

  override def getAtIndex(index: Int): Option[DATA] = {
    val currentState = state
    if (currentState.range.isWithin(index)) {
      val data = currentState.data(index - currentState.range.from)
      Option(data)
    } else {
      None
    }
  }

  override def isWithinRange(index: Int): Boolean = {
    state.range.isWithin(index)
  }

  override def setRange(from: Int, to: Int): Unit = {
    val requestedSize = to - from
    val currentState = state

    val (overlapFrom, overlapTo) = currentState.range.overlap(from, to)

    val newData = new Array[DATA](requestedSize)

    (overlapFrom until overlapTo).foreach { i =>
      val data = currentState.data(i - currentState.range.from)
      if (data != null) {
        newData(i - from) = data
      }
    }

    state = State(WindowRange(from, to), newData)
  }

  override def bufferSize: Int = state.data.length

  override def getRange: WindowRange = state.range

  override def iterator: Iterator[DATA] = {
    state.data.clone().iterator
  }

  override def copy(): MovingWindow[DATA] = {
    val currentState = state
    new ArrayBackedMovingWindow[DATA](State(currentState.range, currentState.data.clone()))
  }
}