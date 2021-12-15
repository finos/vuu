/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 * <p>
 * Created by chris on 26/03/2016.
 */
package sandbox.scratch;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.JTableHeader;
import javax.swing.table.TableColumn;
import java.awt.*;
import java.awt.datatransfer.DataFlavor;
import java.awt.datatransfer.StringSelection;
import java.awt.datatransfer.Transferable;
import java.awt.datatransfer.UnsupportedFlavorException;
import java.awt.dnd.DnDConstants;
import java.awt.dnd.DragGestureEvent;
import java.awt.dnd.DragGestureListener;
import java.awt.dnd.DragSource;
import java.io.IOException;
import java.util.Enumeration;

public class ExtendedDnDDemo extends JPanel implements DragGestureListener, Transferable {

    public ExtendedDnDDemo() {
        super(new GridLayout(3, 1));
        add(createArea());
        add(createList());
        add(createTable());
    }

    private JPanel createList() {
        DefaultListModel listModel = new DefaultListModel();
        listModel.addElement("List 0");
        listModel.addElement("List 1");
        listModel.addElement("List 2");
        listModel.addElement("List 3");
        listModel.addElement("List 4");
        listModel.addElement("List 5");
        listModel.addElement("List 6");
        listModel.addElement("List 7");
        listModel.addElement("List 8");

        JList list = new JList(listModel);
        list.setSelectionMode(ListSelectionModel.SINGLE_INTERVAL_SELECTION);
        JScrollPane scrollPane = new JScrollPane(list);
        scrollPane.setPreferredSize(new Dimension(400, 100));

        list.setDragEnabled(true);
        list.setTransferHandler(new ListTransferHandler());

        JPanel panel = new JPanel(new BorderLayout());
        panel.add(scrollPane, BorderLayout.CENTER);
        panel.setBorder(BorderFactory.createTitledBorder("List"));
        return panel;
    }

    private JPanel createArea() {
        String text = "This is the text that I want to show.";

        JTextArea area = new JTextArea();
        area.setText(text);
        area.setDragEnabled(true);
        JScrollPane scrollPane = new JScrollPane(area);
        scrollPane.setPreferredSize(new Dimension(400, 100));
        JPanel panel = new JPanel(new BorderLayout());
        panel.add(scrollPane, BorderLayout.CENTER);
        panel.setBorder(BorderFactory.createTitledBorder("Text Area"));
        return panel;
    }

    private JPanel createTable() {
        DefaultTableModel model = new DefaultTableModel();

        model.addColumn("Column 0");
        model.addColumn("Column 1");
        model.addColumn("Column 2");
        model.addColumn("Column 3");

        model.addRow(new String[] { "Table 00", "Table 01", "Table 02",
                "Table 03" });
        model.addRow(new String[] { "Table 10", "Table 11", "Table 12",
                "Table 13" });
        model.addRow(new String[] { "Table 20", "Table 21", "Table 22",
                "Table 23" });
        model.addRow(new String[] { "Table 30", "Table 31", "Table 32",
                "Table 33" });

        JTable table = new JTable(model);
        table.getTableHeader().setReorderingAllowed(true);
        table.setSelectionMode(ListSelectionModel.SINGLE_INTERVAL_SELECTION);

        JScrollPane scrollPane = new JScrollPane(table);
        scrollPane.setPreferredSize(new Dimension(400, 100));

        table.setDragEnabled(true);
        table.setTransferHandler(new TableTransferHandler());

        //chris
        //table.getTableHeader().set
        //table.
        //table.getTableHeader().setTransferHandler(new TrableHeaderTransferHandler());

        DragSource ds = new DragSource();
        ds.createDefaultDragGestureRecognizer(table.getTableHeader(), DnDConstants.ACTION_COPY, this);

        JPanel panel = new JPanel(new BorderLayout());
        panel.add(scrollPane, BorderLayout.CENTER);
        panel.setBorder(BorderFactory.createTitledBorder("Table"));
        return panel;
    }


    public void dragGestureRecognized(DragGestureEvent dge) {

        Cursor cursor = null;

        JTableHeader th = (JTableHeader) dge.getComponent();
        Enumeration<?> e = th.getColumnModel().getColumns();

        while (e.hasMoreElements()) {
            TableColumn tc = (TableColumn) e.nextElement();
            System.out.println(tc.getHeaderValue());
        }
        TableColumn tb = th.getDraggedColumn();
        System.out.println("dragged column: "+tb.getHeaderValue());//---This is where the exception happens
        if (dge.getDragAction() == DnDConstants.ACTION_COPY) {
            cursor = DragSource.DefaultCopyDrop;
        }
        dge.startDrag(cursor, new TransferableTableColumn(tb));
    }

    public DataFlavor[] getTransferDataFlavors() {

        System.out.println("getTransferDataFlavors");

        return new DataFlavor[0];
    }

    public boolean isDataFlavorSupported(DataFlavor flavor) {
        System.out.println("isDataFlavorSupported");
        return false;
    }

    public Object getTransferData(DataFlavor flavor) throws UnsupportedFlavorException, IOException {

        System.out.println("getTransferData");
        return null;
    }

    /**
     * Create the GUI and show it. For thread safety, this method should be
     * invoked from the event-dispatching thread.
     */
    private static void createAndShowGUI() {
        //Make sure we have nice window decorations.
        JFrame.setDefaultLookAndFeelDecorated(true);

        //Create and set up the window.
        JFrame frame = new JFrame("ExtendedDnDDemo");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

        //Create and set up the content pane.
        JComponent newContentPane = new ExtendedDnDDemo();
        newContentPane.setOpaque(true); //content panes must be opaque
        frame.setContentPane(newContentPane);

        //Display the window.
        frame.pack();
        frame.setVisible(true);
    }

    public static void main(String[] args) {
        //Schedule a job for the event-dispatching thread:
        //creating and showing this application's GUI.
        javax.swing.SwingUtilities.invokeLater(new Runnable() {
            public void run() {
                createAndShowGUI();
            }
        });
    }
}

/*
 * ListTransferHandler.java is used by the 1.4 ExtendedDnDDemo.java example.
 */

class ListTransferHandler extends StringTransferHandler {
    private int[] indices = null;

    private int addIndex = -1; //Location where items were added

    private int addCount = 0; //Number of items added.

    //Bundle up the selected items in the list
    //as a single string, for export.
    protected String exportString(JComponent c) {
        JList list = (JList) c;
        indices = list.getSelectedIndices();
        Object[] values = list.getSelectedValues();

        StringBuffer buff = new StringBuffer();

        for (int i = 0; i < values.length; i++) {
            Object val = values[i];
            buff.append(val == null ? "" : val.toString());
            if (i != values.length - 1) {
                buff.append("\n");
            }
        }

        return buff.toString();
    }

    //Take the incoming string and wherever there is a
    //newline, break it into a separate item in the list.
    protected void importString(JComponent c, String str) {
        JList target = (JList) c;
        DefaultListModel listModel = (DefaultListModel) target.getModel();
        int index = target.getSelectedIndex();

        //Prevent the user from dropping data back on itself.
        //For example, if the user is moving items #4,#5,#6 and #7 and
        //attempts to insert the items after item #5, this would
        //be problematic when removing the original items.
        //So this is not allowed.
        if (indices != null && index >= indices[0] - 1
                && index <= indices[indices.length - 1]) {
            indices = null;
            return;
        }

        int max = listModel.getSize();
        if (index < 0) {
            index = max;
        } else {
            index++;
            if (index > max) {
                index = max;
            }
        }
        addIndex = index;
        String[] values = str.split("\n");
        addCount = values.length;
        for (int i = 0; i < values.length; i++) {
            listModel.add(index++, values[i]);
        }
    }

    //If the remove argument is true, the drop has been
    //successful and it's time to remove the selected items
    //from the list. If the remove argument is false, it
    //was a Copy operation and the original list is left
    //intact.
    protected void cleanup(JComponent c, boolean remove) {
        if (remove && indices != null) {
            JList source = (JList) c;
            DefaultListModel model = (DefaultListModel) source.getModel();
            //If we are moving items around in the same list, we
            //need to adjust the indices accordingly, since those
            //after the insertion point have moved.
            if (addCount > 0) {
                for (int i = 0; i < indices.length; i++) {
                    if (indices[i] > addIndex) {
                        indices[i] += addCount;
                    }
                }
            }
            for (int i = indices.length - 1; i >= 0; i--) {
                model.remove(indices[i]);
            }
        }
        indices = null;
        addCount = 0;
        addIndex = -1;
    }
}

/*
 * StringTransferHandler.java is used by the 1.4 ExtendedDnDDemo.java example.
 */

abstract class StringTransferHandler extends TransferHandler {

    protected abstract String exportString(JComponent c);

    protected abstract void importString(JComponent c, String str);

    protected abstract void cleanup(JComponent c, boolean remove);

    protected Transferable createTransferable(JComponent c) {
        return new StringSelection(exportString(c));
    }

    public int getSourceActions(JComponent c) {
        return COPY_OR_MOVE;
    }

    public boolean importData(JComponent c, Transferable t) {
        if (canImport(c, t.getTransferDataFlavors())) {
            try {
                String str = (String) t
                        .getTransferData(DataFlavor.stringFlavor);
                importString(c, str);
                return true;
            } catch (UnsupportedFlavorException ufe) {
            } catch (IOException ioe) {
            }
        }

        return false;
    }

    protected void exportDone(JComponent c, Transferable data, int action) {
        cleanup(c, action == MOVE);
    }

    public boolean canImport(JComponent c, DataFlavor[] flavors) {
        for (int i = 0; i < flavors.length; i++) {
            if (DataFlavor.stringFlavor.equals(flavors[i])) {
                return true;
            }
        }
        return false;
    }
}

class TrableHeaderTransferHandler extends StringTransferHandler {

    protected String exportString(JComponent c) {

        JTableHeader header = (JTableHeader) c;
        String name = (String) header.getDraggedColumn().getHeaderValue();
        return name;
    }

    protected void importString(JComponent c, String str) {

    }

    protected void cleanup(JComponent c, boolean remove) {
        System.out.println("Got component:" + c + " remove = " + remove);
    }
}

/*
 * TableTransferHandler.java is used by the 1.4 ExtendedDnDDemo.java example.
 */

class TableTransferHandler extends StringTransferHandler {
    private int[] rows = null;

    private int addIndex = -1; //Location where items were added

    private int addCount = 0; //Number of items added.

    protected String exportString(JComponent c) {
        JTable table = (JTable) c;
        rows = table.getSelectedRows();
        int colCount = table.getColumnCount();

        StringBuffer buff = new StringBuffer();

        for (int i = 0; i < rows.length; i++) {
            for (int j = 0; j < colCount; j++) {
                Object val = table.getValueAt(rows[i], j);
                buff.append(val == null ? "" : val.toString());
                if (j != colCount - 1) {
                    buff.append(",");
                }
            }
            if (i != rows.length - 1) {
                buff.append("\n");
            }
        }

        return buff.toString();
    }

    protected void importString(JComponent c, String str) {
        JTable target = (JTable) c;
        DefaultTableModel model = (DefaultTableModel) target.getModel();
        int index = target.getSelectedRow();

        //Prevent the user from dropping data back on itself.
        //For example, if the user is moving rows #4,#5,#6 and #7 and
        //attempts to insert the rows after row #5, this would
        //be problematic when removing the original rows.
        //So this is not allowed.
        if (rows != null && index >= rows[0] - 1
                && index <= rows[rows.length - 1]) {
            rows = null;
            return;
        }

        int max = model.getRowCount();
        if (index < 0) {
            index = max;
        } else {
            index++;
            if (index > max) {
                index = max;
            }
        }
        addIndex = index;
        String[] values = str.split("\n");
        addCount = values.length;
        int colCount = target.getColumnCount();
        for (int i = 0; i < values.length && i < colCount; i++) {
            model.insertRow(index++, values[i].split(","));
        }
    }

    protected void cleanup(JComponent c, boolean remove) {
        JTable source = (JTable) c;
        if (remove && rows != null) {
            DefaultTableModel model = (DefaultTableModel) source.getModel();

            //If we are moving items around in the same table, we
            //need to adjust the rows accordingly, since those
            //after the insertion point have moved.
            if (addCount > 0) {
                for (int i = 0; i < rows.length; i++) {
                    if (rows[i] > addIndex) {
                        rows[i] += addCount;
                    }
                }
            }
            for (int i = rows.length - 1; i >= 0; i--) {
                model.removeRow(rows[i]);
            }
        }
        rows = null;
        addCount = 0;
        addIndex = -1;
    }
}

class TransferableTableColumn implements Transferable {

    protected static DataFlavor tableColumnFlavor = new DataFlavor(TableColumn.class, "A TableColumn Object");

    protected static DataFlavor[] supportedFlavors = {
//            tableColumnFlavor,
            DataFlavor.stringFlavor
    };

    TableColumn tabColumn;

    public TransferableTableColumn(TableColumn tabColumn) { this.tabColumn = tabColumn; }

    public DataFlavor[] getTransferDataFlavors() { return supportedFlavors; }

    public boolean isDataFlavorSupported(DataFlavor flavor) {

//        if (flavor.equals(tableColumnFlavor) ||
        return flavor.equals(DataFlavor.stringFlavor);
    }


    public Object getTransferData(DataFlavor flavor)  throws UnsupportedFlavorException{
        System.out.println("getTransferData");
//        if (flavor.equals(tableColumnFlavor))
//            return tabColumn;
        if (flavor.equals(DataFlavor.stringFlavor))
            return tabColumn.getHeaderValue();
        else
            throw new UnsupportedFlavorException(flavor);
    }
}
