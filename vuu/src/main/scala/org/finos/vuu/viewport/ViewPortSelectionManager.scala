package org.finos.vuu.viewport

trait ViewPortSelectionManager {
  def selectRow(rowKey: String, preserveExistingSelection: Boolean): Unit
  def deselectRow(rowKey: String, preserveExistingSelection: Boolean): Unit
  def selectRowRange(fromRowKey: String, toRowKey: String, preserveExistingSelection: Boolean): Unit
  def selectAll(): Unit
  def deselectAll(): Unit
  def getSelection: Set[String]
}

trait SelectionManagerProvider {
  def createSelectionManager(viewPort: ViewPort): ViewPortSelectionManager
}

class DefaultViewPortSelectionManager(val viewPort: ViewPort) extends ViewPortSelectionManager {
  @volatile
  private var selection: Set[String] = Set.empty
  private val viewPortLock = new Object

  override def selectRow(rowKey: String, preserveExistingSelection: Boolean): Unit = {
    viewPortLock.synchronized {
      val vpImpl = viewPort.asInstanceOf[ViewPortImpl]
      if (!vpImpl.ForTest_getRowKeyToRowIndex.containsKey(rowKey)) {
        throw new Exception(s"Rowkey $rowKey not found in view port ${vpImpl.id}")
      }
      if (preserveExistingSelection) {
        selection = selection + rowKey
      } else {
        selection = Set(rowKey)
      }
      vpImpl.sendUpdatesOnChange(vpImpl.getRange)
    }
  }

  override def deselectRow(rowKey: String, preserveExistingSelection: Boolean): Unit = {
    viewPortLock.synchronized {
      val vpImpl = viewPort.asInstanceOf[ViewPortImpl]
      if (!this.selection.contains(rowKey)) {
        throw new Exception(s"Rowkey $rowKey not found in existing selection of view port ${vpImpl.id}")
      }

      if (preserveExistingSelection) {
        selection = selection - rowKey
      } else {
        // When preserveExistingSelection is false, deselect a row means clearing all selected rows
        selection = Set.empty
      }
      vpImpl.sendUpdatesOnChange(vpImpl.getRange)
    }
  }

  override def selectRowRange(fromRowKey: String, toRowKey: String, preserveExistingSelection: Boolean): Unit = {
    viewPortLock.synchronized {
      val vpImpl = viewPort.asInstanceOf[ViewPortImpl]
      val keys = vpImpl.getKeys
      val indexMap = keys.zipWithIndex.toMap
      if (!indexMap.contains(fromRowKey)) {
        throw new Exception(s"Rowkey $fromRowKey not found in view port ${vpImpl.id}")
      } else if (!indexMap.contains(toRowKey)) {
        throw new Exception(s"Rowkey $toRowKey not found in view port ${vpImpl.id}")
      }

      val index1 = indexMap.getOrElse(fromRowKey, -1)
      val index2 = indexMap.getOrElse(toRowKey, -1)
      val fromIndex = Math.min(index1, index2)
      val toIndex = Math.max(index1 + 1, index2 + 1)
      if (preserveExistingSelection) {
        selection = selection ++ keys.sliceToArray(fromIndex, toIndex)
      } else {
        selection = keys.sliceToArray(fromIndex, toIndex).toSet
      }
      vpImpl.sendUpdatesOnChange(vpImpl.getRange)
    }
  }

  override def selectAll(): Unit = {
    viewPortLock.synchronized {
      val vpImpl = viewPort.asInstanceOf[ViewPortImpl]
      selection = vpImpl.getKeys.toSet
      vpImpl.sendUpdatesOnChange(vpImpl.getRange)
    }
  }

  override def deselectAll(): Unit = {
    viewPortLock.synchronized {
      val vpImpl = viewPort.asInstanceOf[ViewPortImpl]
      selection = Set.empty
      vpImpl.sendUpdatesOnChange(vpImpl.getRange)
    }
  }

  override def getSelection: Set[String] = selection
}
