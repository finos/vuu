/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 29/02/2016.

  */
package io.venuu.toolbox.consensus.zk

import java.nio.charset.StandardCharsets

import org.apache.curator.framework.CuratorFramework
import org.apache.curator.framework.recipes.cache.{TreeCache, TreeCacheEvent, TreeCacheListener}
import org.apache.curator.framework.recipes.locks.StandardLockInternalsDriver

import scala.collection.JavaConverters

object MasterOrdering extends Ordering[String]{

  private val lockName = "lock-"

  override def compare(x: String, y: String): Int = {
    StandardLockInternalsDriver.standardFixForSorting(x, lockName).compareTo(
      StandardLockInternalsDriver.standardFixForSorting(y, lockName)
    )
  }
}

class ZooKeeperTreeCacheListener(name: String, client: CuratorFramework, path: String) extends TreeCache(client, path) with TreeCacheListener {

  override def childEvent(client: CuratorFramework, event: TreeCacheEvent): Unit = {

    val children = this.getCurrentChildren(path)

    if(children == null){
        println("no cluster data yet")
    }
    else{
      val childrenMapped = JavaConverters.mapAsScalaMapConverter(children).asScala.map{
        case (p, childData) =>
          Option(childData.getData).map(new String(_, StandardCharsets.UTF_8)).getOrElse("")
      }

      val newLeader = childrenMapped.toList.sorted(MasterOrdering).headOption match {
        case Some(s) => s
        case None => "no leader"
      }

      println(s"listener : $name leader=$newLeader " + childrenMapped)
    }

  }

  def connect() = {
    this.getListenable.addListener(this)

    this.start()
  }

}
