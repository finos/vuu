/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 26/02/2016.

  */
package io.venuu.vuu.murmur.consensus.zk

import com.typesafe.scalalogging.StrictLogging
import io.venuu.vuu.murmur.consensus.{ClusterChangeListener, Election}
import org.apache.curator.framework.CuratorFramework
import org.apache.curator.framework.recipes.leader.{LeaderSelector, LeaderSelectorListener}
import org.apache.curator.framework.state.ConnectionState
import org.apache.zookeeper.{WatchedEvent, Watcher}

case class ZooKeeperElection(name: String, client: CuratorFramework, clusterName: String) extends Election with StrictLogging with LeaderSelectorListener with Watcher{

  //var client: CuratorFramework = _
  var selector: LeaderSelector = _
  var cache: ZooKeeperTreeCacheListener = _

  val internalClusterName: String = s"/$clusterName/cluster"
  val membershipPath: String = s"/$clusterName/members"

  override def process(watchedEvent: WatchedEvent): Unit = {
    val children = client.getChildren().usingWatcher(this).forPath(membershipPath);
//    val data = membership.getCurrentMembers.map({ case(key, value) => s"\t $key + ${new String(value)}"}).mkString("\n")
//    println(name)
//    println(data)
    logger.info(s"$name ${if(selector.hasLeadership) selector.getLeader.getId else "no-leader"} Group members: " + children);
  }

  override def takeLeadership(curator: CuratorFramework): Unit = {
    if(canIBeMaster){
      logger.info(s"[CLUSTER] $name taken leadership: $name ")
      Thread.currentThread().join()
    }
  }

  override def stateChanged(curatorFramework: CuratorFramework, connectionState: ConnectionState): Unit = {
    logger.info(s"$name connection state: $connectionState")// + selector.getParticipants.map(p => s"name=${p.getId} isleader=${p.isLeader}").mkString("\n") )
  }

  protected def canIBeMaster : Boolean = {
    name.startsWith("ems")
  }

  def connect(): Election = {
    //client = CuratorFrameworkFactory.newClient(connectionString, new RetryNTimes(10, 300))

//    client.start()
    selector = new LeaderSelector(client, internalClusterName, this)
    selector.setId(name)
    selector.autoRequeue()
    selector.start()

    cache = new ZooKeeperTreeCacheListener(name, client, internalClusterName)
    cache.connect()
    this
  }

  override def disconnect(): Unit = {
    selector.close()
    //membership.close()
    //client.close()
  }

  override def addListener(listener: ClusterChangeListener): Unit = ???
}
