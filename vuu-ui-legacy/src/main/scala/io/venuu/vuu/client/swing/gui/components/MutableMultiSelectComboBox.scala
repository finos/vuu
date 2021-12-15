/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 19/01/2016.

  */
package io.venuu.vuu.client.swing.gui.components

import javax.swing.{AbstractListModel, ComboBoxModel, JComboBox}
import scala.jdk.CollectionConverters.SetHasAsScala

class MutableModel[T] extends AbstractListModel[T] with ComboBoxModel[T] {

  def getItems[T] = {
    SetHasAsScala(selected).asScala.toSet
  }

  def setItems(items: Array[T]) = {
    values = items.toList
  }

  private val selected = new java.util.HashSet[T]
  @volatile private var values = List[T]()

  override def getSelectedItem: AnyRef = {
    SetHasAsScala(selected).asScala.mkString(",")
  }

  override def setSelectedItem(anItem: scala.Any): Unit = {
    if(anItem != null){
      if(!selected.contains(anItem.asInstanceOf[T]))
        selected.add(anItem.asInstanceOf[T])
      else
        selected.remove(anItem.asInstanceOf[T])
    }
    fireContentsChanged(this, -1, 1)
  }

  override def getElementAt(index: Int): T = {
    if(index == -1) values(0)
    else values(index)
  }
  override def getSize: Int = values.length
}

class MutableMultiSelectComboBox[T](model: MutableModel[T]) extends MutableComboBox[T] {
  override lazy val peer = new JComboBox[T](model) with SuperMixin
  def setItems(items: Array[T]) = model.setItems(items)
  def selected: Set[T] = model.getItems
}
