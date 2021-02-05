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
import io.venuu.toolbox.time.Clock
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

case class ViewPortSelection(indices: Array[Int])

case class ViewPortRange(from: Int, to: Int){
  def contains(i: Int): Boolean = {
    i >= from && i < to
  }

  def subtract(newRange: ViewPortRange): ViewPortRange ={
        var from = newRange.from
        var to = newRange.to

        if(newRange.from > this.from && newRange.from < this.to){
            from = this.to
            to = newRange.to
        }

        if(newRange.from < this.from && newRange.to < this.to && newRange.to > this.from){
            from = newRange.from
            to   = this.from
        }

        ViewPortRange(from, to)
  }

}

case class ViewPortUpdate(vp: ViewPort, table: RowSource, key: RowKeyUpdate, index: Int, vpUpdate: ViewPortUpdateType, size: Int, ts: Long)

trait ViewPort {
  def hasGroupBy: Boolean = getGroupBy != NoGroupBy
  def size: Int
  def id: String
  def filterAndSort: FilterAndSort
  def session: ClientSessionId
  def table: RowSource
  def setRange(range: ViewPortRange)
  def setSelection(rowIndices: Array[Int])
  def getRange(): ViewPortRange
  def setKeys(keys: ImmutableArray[String])
  def getKeys() : ImmutableArray[String]
  def getKeysInRange() : ImmutableArray[String]
  def outboundQ: PublishQueue[ViewPortUpdate]
  def highPriorityQ: PublishQueue[ViewPortUpdate]
  def getColumns: List[Column]
  def getSelection: Map[String, Int]
  def getRowKeyMappingSize_ForTest: Int
  def getGroupBy: GroupBy
  def combinedQueueLength = highPriorityQ.length + outboundQ.length
  def filterSpec: FilterSpec
  def changeStructure(newStructuralFields: ViewPortStructuralFields): Unit
  def getTreeNodeState: TreeNodeState
  def getStructure: ViewPortStructuralFields
  def ForTest_getSubcribedKeys: ConcurrentHashMap[String, String]
  def ForTest_getRowKeyToRowIndex: ConcurrentHashMap[String, Int]
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
                       )(implicit timeProvider: Clock) extends ViewPort with KeyObserver[RowKeyUpdate] with LazyLogging{

  private val rangeLock = new Object

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
      sendUpdatesOnChange(range.get())
  }

  override def setSelection(rowIndices: Array[Int]): Unit = {
    rangeLock.synchronized{
      val oldSelection = selection.map(kv => (kv._1, this.rowKeyToIndex.get(kv._1)) ).toMap[String, Int]
      selection = rowIndices.map( idx => (this.keys(idx), idx) ).toMap
      for( (key, idx ) <- selection ++ oldSelection ){
        publishUpdate(key, idx)
      }
    }
  }

  override def getSelection: Map[String, Int] = selection

  def setRange(newRange: ViewPortRange): Unit = {
    rangeLock.synchronized{
      val oldRange = range.get()
      range.set(newRange)
      val diffRange = oldRange.subtract(newRange)
      sendUpdatesOnChange(diffRange)
    }
  }

  //def setColumns(columns: List[Column])
  override def filterSpec: FilterSpec = structuralFields.get().filterSpec

  def sendUpdatesOnChange(currentRange: ViewPortRange) = {

    val currentKeys = keys.toArray

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
  @volatile
  private var selection : Map[String, Int] = Map()

  private val subscribedKeys = new ConcurrentHashMap[String, String]()
  private val rowKeyToIndex = new ConcurrentHashMap[String, Int]()

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

    val sendSizeUpdate = newKeys.length != keys.length

    //send ViewPort
    removeNoLongerSubscribedKeys(newKeys)

    keys = newKeys

    if(sendSizeUpdate){
      highPriorityQ.push(new ViewPortUpdate(this, null, new RowKeyUpdate("SIZE", null), -1, SizeUpdateType, newKeys.length, timeProvider.now()))
    }

    subscribeToNewKeys(newKeys)

  }

  override def onUpdate(update: RowKeyUpdate): Unit = {
    val index = rowKeyToIndex.get(update.key)

    if(index != null && isInRange(index)){
      outboundQ.push(new ViewPortUpdate(this, update.source, new RowKeyUpdate(update.key, update.source, update.isDelete), index, RowUpdateType, this.keys.length, timeProvider.now()))
    }

  }

  protected def isInRange(i: Int) = range.get().contains(i)

  protected def isObservedAlready(key: String): Boolean = subscribedKeys.put(key, "-") != null

  protected def hasChangedIndex(oldIndex: Int, newIndex: Int) = oldIndex != newIndex

  protected def subscribeToNewKeys(newKeys: ImmutableArray[String]) = {

    var index = 0

    var newlyAddedObs = 0

    var removedObs = 0

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
        removedObs += 1
      }

      index += 1
    }

    if(newlyAddedObs > 0 )
      logger.info(s"[VP] ${this.id} Added $newlyAddedObs Removed ${removedObs} Obs ${this.table}")

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
    logger.debug(s"publishing update ${key}")
    highPriorityQ.push(new ViewPortUpdate(this, table, new RowKeyUpdate(key, table), index, RowUpdateType, this.keys.length, timeProvider.now))
  }

  private def addObserver(key: String) = {
    table.addKeyObserver(key, this)
  }

  private def removeObserver(oldKey: String) = {
    if(table.isKeyObservedBy(oldKey, this))
      table.removeKeyObserver(oldKey, this)
  }

}
