package io.venuu.toolbox

import java.util.concurrent.ThreadFactory

object NamedThreadFactory{

  private val map = new java.util.HashMap[String, Int]()

  def nextName(name: String): String = {

    map.synchronized {

      val index = if (map.containsKey(name)) {
        map.get(name) + 1
      } else {
        1
      }

      map.put(name, index)
      name + index
    }

  }
}

class NamedThreadFactory(name: String) extends ThreadFactory {
  override def newThread(r: Runnable): Thread = {
    val threadName = NamedThreadFactory.nextName(name)
    new Thread(r, threadName)
  }
}
