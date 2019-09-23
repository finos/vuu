/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.

 * Created by chris on 02/01/15.

 */
package io.venuu.vuu.viewport

import java.util
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicReference

import com.typesafe.scalalogging.LazyLogging
import io.venuu.toolbox.{ImmutableArray, NiaiveImmutableArray}
import io.venuu.toolbox.time.TimeProvider
import io.venuu.vuu.core.sort.FilterAndSort
import io.venuu.vuu.core.table.{Column, KeyObserver, RowKeyUpdate}
import io.venuu.vuu.net.{ClientSessionId, FilterSpec}
import io.venuu.vuu.util.PublishQueue

//trait ClientSession{
//  def id: String
//  def user: String
//}
//
//class ClientSessionImpl(val id: String, val user: String) extends ClientSession{
//
//}

class ViewPortUpdateType
case object RowUpdateType extends ViewPortUpdateType
case object SizeUpdateType extends ViewPortUpdateType

object DefaultRange extends ViewPortRange(0, 123)

case class ViewPortRange(from: Int, to: Int){
  def contains(i: Int): Boolean = {
    i >= from && i < to
  }
}

case class ViewPortUpdate(vp: ViewPort, table: RowSource, key: RowKeyUpdate, index: Int, vpUpdate: ViewPortUpdateType, ts: Long)

trait ViewPort {
  def hasGroupBy: Boolean = getGroupBy != NoGroupBy
  def size: Int
  def id: String
  def filterAndSort: FilterAndSort
  def session: ClientSessionId
  def table: RowSource
  def setRange(range: ViewPortRange)
  def getRange(): ViewPortRange
  def setKeys(keys: ImmutableArray[String])
  def getKeys() : ImmutableArray[String]
  def getKeysInRange() : ImmutableArray[String]
  def outboundQ: PublishQueue[ViewPortUpdate]
  def highPriorityQ: PublishQueue[ViewPortUpdate]
  def getColumns: List[Column]
  def getRowKeyMappingSize_ForTest: Int
  def getGroupBy: GroupBy
  def combinedQueueLength = highPriorityQ.length + outboundQ.length
  def filterSpec: FilterSpec
  def changeStructure(newStructuralFields: ViewPortStructuralFields): Unit
  def getTreeNodeState: TreeNodeState
  def getStructure: ViewPortStructuralFields
  def ForTest_getSubcribedKeys: ConcurrentHashMap[String, String]
  def ForTest_getRowKeyToRowIndex: ConcurrentHashMap[String, Integer]
}

//when we make a structural change to the viewport, it is via one of these fields
case class ViewPortStructuralFields(table: RowSource, columns: List[Column], filtAndSort: FilterAndSort, filterSpec: FilterSpec, groupBy: GroupBy, theTreeNodeState: TreeNodeState)

case class ViewPortImpl(id: String,
                        //table: RowSource,
                        session: ClientSessionId,
                        outboundQ: PublishQueue[ViewPortUpdate],
                        highPriorityQ: PublishQueue[ViewPortUpdate],
                        structuralFields: AtomicReference[ViewPortStructuralFields],
                        range: AtomicReference[ViewPortRange]
                       )(implicit timeProvider: TimeProvider) extends ViewPort with KeyObserver[RowKeyUpdate] with LazyLogging{

  override def table: RowSource = structuralFields.get().table

  override def getStructure: ViewPortStructuralFields = structuralFields.get()

  override def getTreeNodeState: TreeNodeState = structuralFields.get().theTreeNodeState

  private def onlyFilterOrSortChanged(newStructuralFields: ViewPortStructuralFields, current: ViewPortStructuralFields): Boolean = {
    newStructuralFields.table.asTable.name == current.table.asTable.name && newStructuralFields.groupBy == current.groupBy && newStructuralFields.columns == current.columns
  }

  def changeStructure(newStructuralFields: ViewPortStructuralFields): Unit = {

    val onlySortOrFilterChange = onlyFilterOrSortChanged(newStructuralFields, structuralFields.get())

    structuralFields.set(newStructuralFields)

    if(!onlySortOrFilterChange)
      sendUpdatesOnChange()
  }

  def setRange(newRange: ViewPortRange): Unit = {
    range.set(newRange)
    sendUpdatesOnChange()
  }

  //def setColumns(columns: List[Column])
  override def filterSpec: FilterSpec = structuralFields.get().filterSpec

  def sendUpdatesOnChange() = {

    val currentKeys = keys.toArray

    val currentRange = range.get()

    val from = currentRange.from
    val to = currentRange.to

    val inrangeKeys = currentKeys.drop(from).take(to - from)

    inrangeKeys.zip((from to to)).foreach({ case(key, index) => publishUpdate(key, index)})
  }

  override def getColumns: List[Column] = structuralFields.get().columns

  override def getRange(): ViewPortRange = range.get()

  override def getGroupBy: GroupBy = structuralFields.get().groupBy

  override def size: Int = keys.length

  override def getRowKeyMappingSize_ForTest: Int = rowKeyToIndex.size()

  override def filterAndSort: FilterAndSort = structuralFields.get().filtAndSort

  @volatile
  private var keys : ImmutableArray[String] = new NiaiveImmutableArray[String](new Array[String](0))

  private val subscribedKeys = new ConcurrentHashMap[String, String]()
  private val rowKeyToIndex = new ConcurrentHashMap[String, Integer]()

  override def ForTest_getSubcribedKeys = subscribedKeys
  override def ForTest_getRowKeyToRowIndex = rowKeyToIndex

  override def getKeys(): ImmutableArray[String] = keys

  override def getKeysInRange(): ImmutableArray[String] = {
    val currentKeys = keys.toArray

    val activeRange = range.get()

    val from = activeRange.from
    val to = activeRange.to

    val inrangeKeys = currentKeys.drop(from).take(to - from)

    ImmutableArray.from(inrangeKeys)
  }

  override def setKeys(newKeys: ImmutableArray[String]): Unit = {

    //add logic to denote a view port size change
    if(newKeys.length != keys.length){
      highPriorityQ.push(new ViewPortUpdate(this, null, new RowKeyUpdate("SIZE", null), -1, SizeUpdateType, timeProvider.now()))
    }

    //send ViewPort
    removeNoLongerSubscribedKeys(newKeys)

    subscribeToNewKeys(newKeys)

    keys = newKeys
  }

  override def onUpdate(update: RowKeyUpdate): Unit = {
    val index = rowKeyToIndex.get(update.key)

    if(index != null && isInRange(index)){
      outboundQ.push(new ViewPortUpdate(this, update.source, new RowKeyUpdate(update.key, update.source, update.isDelete), index, RowUpdateType, timeProvider.now()))
    }

  }

  protected def isInRange(i: Int) = range.get().contains(i)

  protected def isObservedAlready(key: String): Boolean = subscribedKeys.put(key, "-") != null

  protected def hasChangedIndex(oldIndex: Int, newIndex: Int) = oldIndex != newIndex

  protected def subscribeToNewKeys(newKeys: ImmutableArray[String]) = {

    var index = 0

    var newlyAddedObs = 0

    while(index < newKeys.length){

      val key = newKeys(index)

      val oldIndex = rowKeyToIndex.put(key, index)

      if(isInRange(index)){

        if(!isObservedAlready(key)){

          addObserver(key)

          newlyAddedObs += 1

          publishUpdate(key, index)

        }else if(hasChangedIndex(oldIndex, index)){
          publishUpdate(key, index)
        }

      }else{
        removeObserver(key)
      }

      index += 1
    }

    if(newlyAddedObs > 0 )
      logger.info(s"[VP] ${this.id} Added $newlyAddedObs observers on key change to ${this.table}")

  }


  protected def removeNoLongerSubscribedKeys(newKeys: ImmutableArray[String]) = {
    val newKeySet = new util.HashSet[String]()

    var i = 0

    while(i < newKeys.length){

      newKeySet.add(newKeys(i))

      i += 1
    }

    val iterator = subscribedKeys.entrySet().iterator()

    while(iterator.hasNext){

      val oldEntry = iterator.next()

      val oldKey = oldEntry.getKey

      if(!newKeySet.contains(oldKey)){
        subscribedKeys.remove(oldKey)
        rowKeyToIndex.remove(oldKey)
        removeObserver(oldKey)
      }

    }

  }

  def publishUpdate(key: String, index: Int) = {
    logger.trace(s"publishing update ${key}")
    highPriorityQ.push(new ViewPortUpdate(this, table, new RowKeyUpdate(key, table), index, RowUpdateType, timeProvider.now))
  }

  private def addObserver(key: String) = {
    table.addKeyObserver(key, this)
  }

  private def removeObserver(oldKey: String) = {
    if(table.isKeyObservedBy(oldKey, this))
      table.removeKeyObserver(oldKey, this)
  }

}
