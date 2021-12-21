package io.venuu.vuu.client.swing.gui.components.renderer

import com.typesafe.scalalogging.StrictLogging

import java.awt.{Color, Component}
import javax.swing.border.EmptyBorder
import javax.swing.table.TableCellRenderer
import javax.swing.{ImageIcon, JLabel, JTable}

@SerialVersionUID(1L)
class TreeGridCellRenderer extends JLabel with TableCellRenderer with StrictLogging {

  import io.venuu.vuu.client.swing.gui.TreeColumns._

  final private val DefaultEmptyBorder = new EmptyBorder(0, 0, 0, 0)

  final private val rightIcon: ImageIcon = new ImageIcon("./vuu/src/main/resources/right.png")
  final private val downIcon: ImageIcon = new ImageIcon("./vuu/src/main/resources/down.gif")

  def rowIsLoading(table: JTable, row: Int): Boolean = {
    table.getModel.getValueAt(row, 0).toString == "-"
  }

  def getTableCellRendererComponent(table: JTable, value: Any, isSelected: Boolean, hasFocus: Boolean, row: Int, col: Int): Component = {
    val column0Value: String = table.getModel.getValueAt(row, 0).asInstanceOf[String]
    val valueAt: Any = table.getModel.getValueAt(row, if (col < 8) col else col - 1)
    var s: String = ""
    if (valueAt != null) {
      s = valueAt.toString
    }
    setOpaque(true)

    if (row % 2 == 0)
      setBackground(new Color(102, 230, 255, 50))
    else
      setBackground(Color.white)

    if (table.getModel.getValueAt(row, Depth.index) == "-" || table.getModel.getValueAt(row, Depth.index) == null) {
      setIcon(null)
      setText(s)
    }
    else {

      val depthAsString = table.getModel.getValueAt(row, Depth.index).toString
      val isLeafAsString = table.getModel.getValueAt(row, IsLeaf.index).toString
      val isOpenAsString = table.getModel.getValueAt(row, IsOpen.index).toString

      if (depthAsString == "" || isLeafAsString == "" || isOpenAsString == "") {
        setBorder(new EmptyBorder(0, 0, 0, 0))
        setText("")
        setIcon(null)
      } else {

        val depth = try{
          table.getModel.getValueAt(row, Depth.index).toString.toInt
        }catch {
          case ex: Exception =>
          logger.info(s"Exception with model, row $row: ")
           -1
        }

        if(depth == -1){
          return this
        }

        val isLeaf = table.getModel.getValueAt(row, IsLeaf.index).toString.toBoolean
        val isOpen = table.getModel.getValueAt(row, IsOpen.index).toString.toBoolean
        val caption = table.getModel.getValueAt(row, Caption.index).toString
        val childCount = table.getModel.getValueAt(row, ChildCount.index).toString.toInt

        if (!isLeaf) {

          if (col == 0) {
            //val depth: Integer = Character.getNumericValue(column0Value.charAt(6))
            setText(caption + s" ($childCount)")

            if (isOpen) {
              setIcon(downIcon)
            } else
              setIcon(rightIcon)

            val indent: Int = depth * 10
            setBorder(new EmptyBorder(0, indent, 0, 0))
          }
          else {
            setBorder(DefaultEmptyBorder)
            setText(valueAt.toString)
            setIcon(null)
          }

        }
        else if (col == 0) {
          setBorder(new EmptyBorder(0, 0, 0, 0))
          setText("")
          setIcon(null)
        }
        else {
          setBorder(null)
          setIcon(null)
          setText(s)
        }
      }
    }
    return this
  }

}
