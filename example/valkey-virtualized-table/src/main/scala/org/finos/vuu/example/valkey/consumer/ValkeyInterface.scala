package org.finos.vuu.example.valkey.consumer

import org.finos.vuu.example.valkey.client.ValkeyClient
import org.finos.vuu.example.valkey.common.ShardRouter
import org.finos.vuu.net.{FilterSpec, SortSpec}

import java.util
import java.util.concurrent.{CompletableFuture, Executors}

trait ValkeyInterface {

  def getRow(table: String, key: String): Option[java.util.Map[String, String]]

  def getKeys(table: String, filterSpec: FilterSpec, sortSpec: SortSpec): IndexedSeq[String]

}

object ValkeyInterface {

  def apply(client: ValkeyClient): ValkeyInterface = ValkeyInterfaceImpl(client)

}

private case class ValkeyInterfaceImpl(client: ValkeyClient) extends ValkeyInterface {

  private val executor = Executors.newFixedThreadPool(4)
  
  override def getRow(table: String, key: String): Option[util.Map[String, String]] = {
      val shardedKey = ShardRouter.shardedKey(table, key)
      //client.getClient.map(f => f.hgetAll(shardedKey))
      None
  }

  override def getKeys(table: String, filterSpec: FilterSpec, sortSpec: SortSpec): IndexedSeq[String] = {
    
//    val futures = ShardRouter.getShardTags.map { tag =>
//      CompletableFuture.supplyAsync(() => {
//        // Construct keys: idx-orders:{sX}:ric:VOD.L and idx-orders:{sX}:sort:quantity
//        val filterKey = concat(Prefix, tag, RicPart, ricBytes)
//        val sortKey = concat(Prefix, tag, SortPart)
//
//        // Valkey-Java Binary API: ZINTER on 2 keys
//        // Returns a Set[Tuple] (Member as Array[Byte], Score as Double)
//        // We ask for 'limit' from each shard to be safe
//        client.getClient.map(f => f.zinterWithScores(filterKey, sortKey).asScala)
//      }, executor)
//    }
//        
    Vector[String]()
  }

  //private val Prefix = "idx-orders".getBytes(StandardCharsets.UTF_8)
  //  private val RicPart = ":ric:".getBytes(StandardCharsets.UTF_8)
  //  private val SortPart = ":sort:quantity".getBytes(StandardCharsets.UTF_8)
  
  //// 2. Gather Phase: Wait for all shards to report back
  //    val allShardResults = CompletableFuture.allOf(futures: _*)
  //      .thenApply(_ => futures.flatMap(_.join()))
  //      .get()
  //
  //    // 3. Reduce Phase: Efficient Global Top-N extraction
  //    // Use a Min-Heap (PriorityQueue) of size 'limit' to find Top 100k in O(N log K)
  //    val pq = new PriorityQueue[Tuple]((a, b) => java.lang.Double.compare(a.getScore, b.getScore))
  //
  //    allShardResults.foreach { tuple =>
  //      pq.offer(tuple)
  //      if (pq.size() > limit) {
  //        pq.poll() // Remove the smallest element to keep only the top ones
  //      }
  //    }
  //
  //    // 4. Convert back to sorted List (Min-heap returns smallest first, so we reverse)
  //    val result = new scala.collection.mutable.ListBuffer[Array[Byte]]()
  //    while (!pq.isEmpty) {
  //      result.prepend(pq.poll().getBinaryElement)
  //    }
  //    result.toList
  //  }
  //
  //  // High-performance byte concatenation for the hot path
  //  private def concat(parts: Array[Byte]*): Array[Byte] = {
  //    val totalLen = parts.map(_.length).sum
  //    val res = new Array[Byte](totalLen)
  //    var destPos = 0
  //    parts.foreach { p =>
  //      System.arraycopy(p, 0, res, destPos, p.length)
  //      destPos += p.length
  //    }
  //    res
  //  }
  //}

}