package sandbox;

import javax.swing.*;
import javax.swing.plaf.basic.BasicSplitPaneDivider;
import javax.swing.plaf.basic.BasicSplitPaneUI;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.JTableHeader;
import javax.swing.table.TableColumn;
import java.awt.*;
import java.awt.dnd.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.event.MouseMotionListener;
import java.util.Enumeration;

public class TestSplitPane implements DragGestureListener{

    public static void main(String[] args) {
        new TestSplitPane();
    }

    public TestSplitPane() {
        EventQueue.invokeLater(new Runnable() {
            public void run() {
                try {
                    UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
                } catch (Exception ex) {
                    ex.printStackTrace();
                }

                final JPanel left = new JPanel();



                left.setBackground(Color.RED);
                left.setPreferredSize(new Dimension(500, 500));
                JPanel right = new JPanel();
                right.setBackground(Color.BLUE);
                right.setPreferredSize(new Dimension(500, 500));
                right.add(createTable());
                final JSplitPane sp = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT, left, right);
                sp.setDividerLocation(0);

                BasicSplitPaneDivider divider = ((BasicSplitPaneUI) sp.getUI()).getDivider();

                divider.addMouseListener(new MouseAdapter() {

                    @Override
                    public void mouseEntered(MouseEvent e) {
                        if (left.getWidth() == 0) {
                            sp.setDividerLocation(100);
                        }
                    }

                });

                right.addMouseMotionListener(new MouseMotionListener() {
                    @Override
                    public void mouseDragged(MouseEvent e) {
                        System.out.println("mouseDragged");
                    }

                    @Override
                    public void mouseMoved(MouseEvent e) {
                        System.out.println("mouseMoved x=" + e.getX() + " y=" + e.getY());
                    }
                });

                right.addMouseListener(new MouseAdapter() {
                    @Override
                    public void mouseEntered(MouseEvent e) {
                        System.out.println("mouseEntered");
                        super.mouseEntered(e);
                    }

                    @Override
                    public void mouseExited(MouseEvent e) {
                        System.out.println("mouseExited");
                        super.mouseExited(e);
                    }

                    @Override
                    public void mouseMoved(MouseEvent e) {
                        System.out.println("mouseMoved");
                        super.mouseMoved(e);
                    }

                    @Override
                    public void mouseDragged(MouseEvent e) {
                        System.out.println("mouseDragged");
                        super.mouseDragged(e);
                    }



                });

                left.addMouseListener(new MouseAdapter() {

                    @Override
                    public void mouseEntered(MouseEvent e) {
                        System.out.println("mouseEntered" + e);
                        super.mouseEntered(e);
                    }

                    @Override
                    public void mouseMoved(MouseEvent e) {
                        System.out.println("mouseMoved" + e);
                        super.mouseMoved(e);
                    }

                    @Override
                    public void mouseExited(MouseEvent e) {
                        sp.setDividerLocation(0);
                    }

                });

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
        scrollPane.setPreferredSize(new Dimension(500, 500));
        //scrollPane

        table.setDragEnabled(true);

        table.setTransferHandler(new TableTransferHandler());
        table.addMouseListener(new MouseListener() {
            @Override
            public void mouseClicked(MouseEvent e) {
                System.out.println("table:mouseClicked" + e);
            }

            @Override
            public void mousePressed(MouseEvent e) {
                System.out.println("table:mousePressed" + e);
            }

            @Override
            public void mouseReleased(MouseEvent e) {
                System.out.println("table:mouseReleased" + e);
            }

            @Override
            public void mouseEntered(MouseEvent e) {
                System.out.println("table:mouseReleased" + e);
            }

            @Override
            public void mouseExited(MouseEvent e) {
                System.out.println("table:mouseReleased" + e);
            }
        });


        //chris
        //table.getTableHeader().set
        //table.
        //table.getTableHeader().setTransferHandler(new TrableHeaderTransferHandler());

        DragSource ds = new DragSource();
        ds.createDefaultDragGestureRecognizer(table.getTableHeader(), DnDConstants.ACTION_COPY, this);
        ds.addDragSourceMotionListener(new DragSourceMotionListener() {
            @Override
            public void dragMouseMoved(DragSourceDragEvent dsde) {
                debug(dsde);
            }
        });

        JPanel panel = new JPanel(new BorderLayout());
        panel.add(scrollPane, BorderLayout.CENTER);
        panel.setBorder(BorderFactory.createTitledBorder("Table"));
        return panel;
    }

    // just some logging
    protected void debug(DragSourceEvent dsde) {
        DragSourceContext context = dsde.getDragSourceContext();
        Component source = context.getComponent();
        String text = source != null ? source.getName() : "none";
        System.out.println(text + " x/y " + dsde.getX() + "/" + dsde.getY());
    }

    @Override
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
};