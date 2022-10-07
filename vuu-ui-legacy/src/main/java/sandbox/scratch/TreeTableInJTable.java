package sandbox.scratch;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.TableCellRenderer;
import java.awt.*;

public class TreeTableInJTable {

    public static void main(String[] args) {
        new TreeTableInJTable();

    }

    public TreeTableInJTable() {

        EventQueue.invokeLater(new Runnable() {
            public void run() {
                try {
                    UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
                } catch (Exception ex) {
                    ex.printStackTrace();
                }

                final JPanel sp = createTable();

                JFrame frame = new JFrame("Testing");
                frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
                frame.add(sp);
                frame.pack();
                frame.setLocationRelativeTo(null);
                frame.setVisible(true);

            }
        });
    }

     private JPanel createTable() {
                DefaultTableModel model = new DefaultTableModel();

                model.addColumn("Column 0");
                model.addColumn("Column 1");
                model.addColumn("Column 2");
                model.addColumn("Column 3");

                model.addRow(new String[]{"Branch1", "", "", ""});
                model.addRow(new String[]{"Branch2", "", "", ""});
                model.addRow(new String[]{"Leaf", "Table 21", "Table 22", "Table 23"});
                model.addRow(new String[]{"Leaf", "Table 31", "Table 32", "Table 33"});
                model.addRow(new String[]{"Branch3", "", "", ""});
                model.addRow(new String[]{"Branch2", "", "", ""});
                model.addRow(new String[]{"Branch1", "", "", ""});

                JTable table = new JTable(model);
                table.getTableHeader().setReorderingAllowed(true);
                table.setSelectionMode(ListSelectionModel.SINGLE_INTERVAL_SELECTION);

                JScrollPane scrollPane = new JScrollPane(table);
                scrollPane.setPreferredSize(new Dimension(500, 500));
                //scrollPane

                table.setDefaultRenderer(Object.class, new BoardTableCellRenderer());

                table.setDragEnabled(true);

                table.addMouseListener(new java.awt.event.MouseAdapter() {
                     @Override
                     public void mouseClicked(java.awt.event.MouseEvent evt) {
                         int row = table.rowAtPoint(evt.getPoint());
                         int col = table.columnAtPoint(evt.getPoint());
                         if (row >= 0 && col >= 0) {
                             Object valueAt = table.getModel().getValueAt(row, col);
                             DefaultTableModel model = (DefaultTableModel)table.getModel();
                             model.insertRow(row + 1, new String[]{"Leaf", "Table Foo", "Table Foo", "Table Foo"});

                             final Component comp = evt.getComponent();

//                             javax.swing.Timer timer = new javax.swing.Timer(50, new ActionListener() {
//                                 int alpha = 255;
//
//                                 public void actionPerformed(ActionEvent evt) {
//                                     alpha += 5;
//                                     if (alpha >= 255) {
//                                         alpha = 255;
//                                         ((javax.swing.Timer)evt.getSource()).stop();
//                                     }
//
//                                     comp.setForeground(new Color(255, 255, 255, alpha));
//                                 }
//                             });
//
//                             timer.start();

                             System.out.println("valueAt" + valueAt);
                         }
                     }
                 });


                table.setTransferHandler(new TableTransferHandler());
//                table.addMouseListener(new MouseListener() {
//                    @Override
//                    public void mouseClicked(MouseEvent e) {
//                        System.out.println("table:mouseClicked" + e);
//                    }
//
//                    @Override
//                    public void mousePressed(MouseEvent e) {
//                        System.out.println("table:mousePressed" + e);
//                    }
//
//                    @Override
//                    public void mouseReleased(MouseEvent e) {
//                        System.out.println("table:mouseReleased" + e);
//                    }
//
//                    @Override
//                    public void mouseEntered(MouseEvent e) {
//                        System.out.println("table:mouseReleased" + e);
//                    }
//
//                    @Override
//                    public void mouseExited(MouseEvent e) {
//                        System.out.println("table:mouseReleased" + e);
//                    }
//                });

                JPanel panel = new JPanel(new BorderLayout());
                panel.add(scrollPane, BorderLayout.CENTER);
                panel.setBorder(BorderFactory.createTitledBorder("Table"));
                return panel;
            }


        }

class BoardTableCellRenderer extends JLabel implements TableCellRenderer {

    private final ImageIcon folder = new ImageIcon("./src/main/resources/right.png");

    private static final long serialVersionUID = 1L;

    public Component getTableCellRendererComponent(JTable table, Object value,
                                                   boolean isSelected, boolean hasFocus, int row, int col) {


        //table.getModel().

        String column0Value = (String)table.getModel().getValueAt(row, 0);

        Object valueAt = table.getModel().getValueAt(row, col);

        String s = "";

        if (valueAt != null) {
            s = valueAt.toString();
        }

        setOpaque(true);

        if(row % 2 == 0)
            setBackground(new Color(102,230,255,50));
        else
            setBackground(Color.white);

        if (column0Value.contains("Branch")) {
            Integer depth = Character.getNumericValue(column0Value.charAt(6));

            setText(s);
            if (s.contains("Branch")) {
                setIcon(folder);
                int indent = depth * 10;
                setBorder(new EmptyBorder(0, indent, 0, 0));
            }
            else {
                setIcon(null);
                //setBorder(BorderFactory.createLineBorder(Color.lightGray));
            }
//            setForeground(Color.YELLOW);
//            setBackground(Color.gray);

            //setBorder(new EmptyBorder(0, indent, 0, 0));
        }
        else if(col == 0){
            setBorder(new EmptyBorder(0, 0, 0, 0));
            setText("");
        }
        else {
            setIcon(null);
            //setForeground(Color.black);
            //setBackground(Color.WHITE);
            //setBorder(BorderFactory.createLineBorder(Color.lightGray));
            setText(s);
        }

        return this;
    }
}