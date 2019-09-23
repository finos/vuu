package io.venuu.vuu.client.swing.gui.components

import javax.swing.JComboBox

import scala.swing.{Component, Swing, event}

/**
  * Very basic Mutable ComboBox for Scala.
  * <p>Sample usage:<p>
  * <pre>
  * val box = new MutableComboBox[String]
  * box.items = List("1", "11", "222")
  * listenTo(box)
  * reactions += {
  * case SelectionChanged(`box`) => println(box.item)
  * }
  * </pre>
  * <p>Note that there is no separate "selection" member. This combobox publishes event on its own</p>
  */
class MutableComboBox[T] extends Component {
  override lazy val peer = new JComboBox[T]() with SuperMixin

  peer.addActionListener(Swing.ActionListener { e =>
    publish(event.SelectionChanged(MutableComboBox.this))
  })

  def items_=(s: Seq[T]) {
    peer.removeAllItems
    s.map(peer.addItem)
  }
  def items = (0 until peer.getItemCount()).map(peer.getItemAt)

  def index: Int = peer.getSelectedIndex
  def index_=(n: Int) { peer.setSelectedIndex(n) }
  def item: T = peer.getSelectedItem.asInstanceOf[T]
  def item_=(a: T) { peer.setSelectedItem(a) }
}

