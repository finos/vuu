package org.finos.vuu.core.table

import org.slf4j.LoggerFactory

import java.util.concurrent.ConcurrentHashMap
import scala.jdk.CollectionConverters.MapHasAsScala

trait KeyedObservable[T] {
  def getObserversByKey(): Map[String, Array[KeyObserver[T]]]

  def addKeyObserver(key: String, observer: KeyObserver[T]): Boolean

  def removeKeyObserver(key: String, observer: KeyObserver[T]): Boolean

  def getObserversByKey(key: String): List[KeyObserver[T]]

  def isKeyObserved(key: String): Boolean

  def isKeyObservedBy(key: String, observer: KeyObserver[T]): Boolean

  def notifyObservers(key: String, observers: List[KeyObserver[T]], msg: T): Unit = {
    observers.foreach(_.onUpdate(msg))
  }

  def removeAllObservers(): Unit
}

trait KeyObserver[T] {
  def onUpdate(update: T): Unit
}

trait KeyedObservableHelper[T] extends KeyedObservable[T] {

  override def getObserversByKey(): Map[String, Array[KeyObserver[T]]] = {
    MapHasAsScala(observersByKey).asScala.toMap
  }

  private val logger = LoggerFactory.getLogger(getClass)

  private val observersByKey = new ConcurrentHashMap[String, Array[KeyObserver[T]]]()
  private val observersLock = new Object

  override def isKeyObservedBy(key: String, observer: KeyObserver[T]): Boolean = {

    val observers = observersLock.synchronized {
      if (key != null)
        observersByKey.get(key)
      else
        null
    }

    if (observers != null)
      observers.contains(observer)
    else
      false
  }

  override def addKeyObserver(key: String, observer: KeyObserver[T]): Boolean = {
    var first = false

    logger.trace("Adding observer:" + key + "->" + observer)

    //if(this.getClass.getSimpleName != "JoinTable")
    //logger.error("here2", new Throwable)

    observersLock.synchronized {

      val observers = if (observersByKey.containsKey(key)) observersByKey.get(key) else null

      if (observers == null) {
        observersByKey.put(key, Array(observer))
        first = true
      } else {
        val newObservers = new Array[KeyObserver[T]](observers.length + 1)
        System.arraycopy(observers, 0, newObservers, 0, observers.length)
        newObservers(observers.length) = observer
        observersByKey.put(key, newObservers)
        first = false
      }
    }
    first
  }

  override def removeKeyObserver(key: String, observer: KeyObserver[T]): Boolean = {

    var last = false

    observersLock.synchronized {

      val observers = if (key == null || !observersByKey.containsKey(key)) null else observersByKey.get(key)

      if (observers == null) {
        logger.debug(s"Trying to remove observer ${observer} on key which has no observers registered")
        last = true
      } else if (observers.length == 1) {
        if (observers(0) == observer) {
          observersByKey.remove(key)
          last = true
        } else {
          logger.warn("There was only one observer left, but it wasn't us, this looks bad")
        }

      }
      else {
        observers.find(o => o == observer) match {
          case Some(x: KeyObserver[T]) => {
            observersByKey.put(key, observers.filterNot(o => o == x));
            last = false
          }
          case None =>
            logger.warn(s"Couldn't find observer to remove in list of observers ${observer}")
        }
      }
    }
    last
  }

  override def getObserversByKey(key: String): List[KeyObserver[T]] = {
    observersLock.synchronized {
      val observersForKey = observersByKey.get(key)
      if (observersForKey == null) List[KeyObserver[T]]()
      else observersForKey.toList
    }
  }

  override def removeAllObservers(): Unit = {
    observersLock.synchronized {
      observersByKey.clear()
    }
  }

  override def isKeyObserved(key: String): Boolean = {
    observersLock.synchronized {
      observersByKey.containsKey(key)
    }
  }

}

