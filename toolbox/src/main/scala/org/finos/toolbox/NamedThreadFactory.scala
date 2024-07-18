package org.finos.toolbox

import java.util.concurrent.ThreadFactory
import java.util.concurrent.atomic.AtomicInteger

object NamedThreadFactory  {
  val map = new java.util.HashMap[String, AtomicInteger]()

  def nextName(name: String): String  = {
    if (!map.containsKey(name)) {
      map.put(name, new AtomicInteger())
     }

    name + map.get(name).incrementAndGet()
   }
}

class NamedThreadFactory(name: String) extends ThreadFactory  {
  override def newThread(r: Runnable): Thread  = {
    val threadName  = NamedThreadFactory.nextName(name)
    new Thread(r, threadName)
   }
}
