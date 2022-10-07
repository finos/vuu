package io.venuu.vuu.client.swing.gui.components.renderer

import io.venuu.vuu.client.swing.model.ViewPortedModel

import java.awt.Component
import javax.swing.table.{DefaultTableCellRenderer, TableCellRenderer}
import javax.swing.{ImageIcon, JLabel, JTable}

class SortedColumnRenderer(model: ViewPortedModel) extends JLabel with TableCellRenderer{

  val defaultTableCellRenderer = new DefaultTableCellRenderer()

//  private final val SortAscending = new JLabel(new ImageIcon("sort-arrow-down.gif"))
//  private final val SortDescending = new JLabel(new ImageIcon("sort-arrow-up.gif"))

  //override def getPreferredSize: Dimension = new Dimension(1, 50)

  override def getTableCellRendererComponent(table: JTable, value: scala.Any, isSelected: Boolean,
                                             hasFocus: Boolean, row: Int, column: Int): Component = {


    setText(value.toString)

    val icon = model.hasSort(column) match {
      case Some(sortDef) =>
        if(sortDef.sortType == 'A')
          setIcon(new ImageIcon("./src/main/resources/sort-arrow-up.gif"))
        else
          setIcon(new ImageIcon("./src/main/resources/sort-arrow-down.gif"))
      case None =>
        setIcon(new ImageIcon())
    }

//    // Extract the original header renderer for this column.
//
//    val tcr = table.getTableHeader ()
//      .getDefaultRenderer ();
//
//    // Extract the component used to render the column header.
//
//    val c = tcr.getTableCellRendererComponent (table, value,
//      isSelected,
//      hasFocus,
//      row, column);
//
//    table.getModel
//
//    // Establish the font, foreground color, and border for the
//    // JLabel so that the rendered header will look the same as the
//    // other rendered headers.
//
//    l.setFont (c.getFont ());
//    l.setForeground (c.getForeground ());
//    l.setBorder (((JComponent) c).getBorder ());
//
//    // Establish the column name.
//
//    l.setText ((String) value);
//
//    // Return the cached JLabel a the renderer for this column
//    // header.
//
//    return l;
//
//
    this
  }
}
