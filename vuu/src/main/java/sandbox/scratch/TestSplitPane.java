package sandbox.scratch;

import javax.swing.*;
import javax.swing.plaf.basic.BasicSplitPaneDivider;
import javax.swing.plaf.basic.BasicSplitPaneUI;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.JTableHeader;
import javax.swing.table.TableColumn;
import java.awt.*;
import java.awt.datatransfer.DataFlavor;
import java.awt.datatransfer.StringSelection;
import java.awt.datatransfer.Transferable;
import java.awt.dnd.*;
import java.awt.event.*;
import java.util.Enumeration;

public class TestSplitPane implements DragGestureListener{

    public static void main(String[] args) {
        new TestSplitPane();
    }

    public static JButton createDraggableButton(String name){

        JButton button = new JButton(name);

        button.setTransferHandler(new ValueExportTransferHandler(name));

        button.addMouseMotionListener(new MouseAdapter() {
            @Override
            public void mouseDragged(MouseEvent e) {
                JButton button = (JButton) e.getSource();
                TransferHandler handle = button.getTransferHandler();
                handle.exportAsDrag(button, e, TransferHandler.COPY);
                System.out.println("Dragged with button:" + e);
            }

            @Override
            public void mouseMoved(MouseEvent e) {
                super.mouseMoved(e);
                System.out.println("Moved with button:" + e);
            }

            @Override
            public void mousePressed(MouseEvent e) {
                super.mousePressed(e);
            }
        });

        button.addMouseMotionListener(new MouseMotionListener() {
            @Override
            public void mouseDragged(MouseEvent e) {
                System.out.println("Moused Dragged Button:" + e);
            }

            @Override
            public void mouseMoved(MouseEvent e) {
                System.out.println("Moused Moved Button:" + e);
            }
        });


        return button;
    }

    private GridBagConstraints setConstraints(GridBagConstraints c, int x, int y){
        c.gridx = x;
        c.gridy = y;
        c.fill = GridBagConstraints.HORIZONTAL;
        return c;
    }

    public JPanel createPanel(int x, int y){
        JPanel panel = new JPanel();
        panel.setOpaque(true);
        panel.setBackground(new Color(0,0,0,64));
        panel.setName(x + "" + y);
        JLabel label = new JLabel(x + "" + y);
        label.setTransferHandler(new ValueImportTransferHandler());
        panel.setTransferHandler(new ValueImportTransferHandler());

        panel.addComponentListener(new ComponentAdapter() {
            @Override
            public void componentResized(ComponentEvent e) {
                super.componentResized(e);
                System.out.println(panel.getName() + " resized:" + panel.getX() + " " + panel.getY() + " " + panel.getWidth() + " " + panel.getHeight());
            }
        });

        panel.add(label);
        //panel.setSize(1024, 1024);
        panel.setBorder(BorderFactory.createLineBorder(Color.RED, 1));
        return panel;
    }

    public ThreeByThreePanel create3By3Panel(){
//        JPanel panel = new JPanel(new GridLayout(3,3));
//        panel.setBackground(Color.BLUE);
//        for(int x=0; x<3; x++){
//            for(int y=0; y<3; y++){
//                panel.add(createPanel(x, y));
//            }
//        }
        return new ThreeByThreePanel();
    }
    public ThreeByThreeGridBag create3By3PanelGridBag(){
//        JPanel panel = new JPanel(new GridLayout(3,3));
//        panel.setBackground(Color.BLUE);
//        for(int x=0; x<3; x++){
//            for(int y=0; y<3; y++){
//                panel.add(createPanel(x, y));
//            }
//        }
        return new ThreeByThreeGridBag();
    }

    public JPanel createGlassPanel(){
        JPanel glassPanel = new JPanel(new GridLayout(3,3));
        glassPanel.setOpaque(false);
        glassPanel.setBackground(Color.CYAN);
        glassPanel.setBorder(BorderFactory.createLineBorder(Color.RED, 5));

//        for(int x=0; x<3; x++){
//            for(int y=0; y<3; y++){
//                glassPanel.add(createPanel(x, y));
//            }
//        }

//        GridBagConstraints c = new GridBagConstraints();
//
//        glassPanel.add(createPanel(0, 0), setConstraints(c, 0, 0));
//        glassPanel.add(createPanel(0, 1), setConstraints(c, 0, 1));
//        glassPanel.add(createPanel(0, 2), setConstraints(c, 0, 2));
//        glassPanel.add(createPanel(1, 0), setConstraints(c, 1, 0));
//        glassPanel.add(createPanel(1, 1), setConstraints(c, 1, 1));
//        glassPanel.add(createPanel(1, 2), setConstraints(c, 1, 2));
//        glassPanel.add(createPanel(2, 0), setConstraints(c, 2, 0));
//        glassPanel.add(createPanel(2, 1), setConstraints(c, 2, 1));
//        glassPanel.add(createPanel(2, 2), setConstraints(c, 2, 2));

        //glassPanel.setBorder(LineBorder.createBlackLineBorder());
        glassPanel.addMouseListener(new MouseAdapter() {
            @Override
            public void mouseReleased(MouseEvent e) {
                System.out.println("here1");
            }

            @Override
            public void mouseMoved(MouseEvent e) {
                System.out.println("here2");
            }

            @Override
            public void mouseEntered(MouseEvent e) {
                System.out.println("here3");
            }

            @Override
            public void mouseExited(MouseEvent e) {
                System.out.println("here4");
            }

            @Override
            public void mouseDragged(MouseEvent e) {
                System.out.println("here5");
            }
        });

        glassPanel.addMouseMotionListener(new MouseMotionListener() {
            @Override
            public void mouseDragged(MouseEvent e) {
                System.out.println("here6");
            }

            @Override
            public void mouseMoved(MouseEvent e) {

            }
        });


        return glassPanel;
    }

    private static boolean isWithin(int point, int v, int length){
        return point >= v && point <= v + length;
    }

    public JPanel createLeft(){
        final JPanel left = new JPanel();

        left.setBackground(Color.RED);
        left.setPreferredSize(new Dimension(500, 500));

        left.add(createDraggableButton("Table1"));
        left.add(createDraggableButton("Table2"));
        left.add(createDraggableButton("Table3"));

        return left;
    }

    public TestSplitPane() {
        EventQueue.invokeLater(new Runnable() {
            public void run() {
                try {
                    UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
                } catch (Exception ex) {
                    ex.printStackTrace();
                }


                ThreeByThreeGridBag right = create3By3PanelGridBag();
//                JPanel right = new JPanel();
//                right.setBackground(Color.BLUE);
//                right.setPreferredSize(new Dimension(500, 500));
//                right.add(createTable());

//                JPanel wrapperRight = new JPanel();
//                wrapperRight.setLayout(new BorderLayout(0,0));
//                wrapperRight.add(right, BorderLayout.CENTER);

                JPanel left = createLeft();

                final JSplitPane sp = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT, left, right);
                sp.setDividerLocation(0);

                BasicSplitPaneDivider divider = ((BasicSplitPaneUI) sp.getUI()).getDivider();

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

                        if(right.hitTest(right.getCenterCenter(), e.getX(), e.getY())){
                            right.colourAllCells();
                        }else if(right.hitTest(right.getCenterTop(), e.getX(), e.getY())){
                            right.colourTopRow();
                        }else if(right.hitTest(right.getCenterBottom(), e.getX(), e.getY())) {
                            right.colourBottomRow();
                        }else if(right.hitTest(right.getCenterLeft(), e.getX(), e.getY())) {
                            right.colourLeftColumn();
                        }else if(right.hitTest(right.getCenterRight(), e.getX(), e.getY())) {
                            right.colourRightColumn();
                        }else{
                            right.getPanelList().forEach( c -> {

                                JPanel panel = (JPanel) c;

                                int x = c.getX();
                                int y = c.getY();
                                int width = c.getWidth();
                                int height = c.getHeight();

                                if(isWithin(e.getX(), x, width) && isWithin(e.getY(), y, height)){
                                    System.out.println("Panel Green:" + panel.getName());
                                    panel.setBackground(Color.GREEN);
                                }else{
                                    System.out.println("Panel Blue:" + panel.getName());
                                    panel.setBackground(Color.BLUE);
                                }
                            }  );
                        }
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

//                        Arrays.stream(right.getComponents()).forEach( c -> {
//
//                            if( c instanceof JPanel){
//
//                                JPanel panel = (JPanel) c;
//
//                                int x = c.getX();
//                                int y = c.getY();
//                                int width = c.getWidth();
//                                int height = c.getHeight();
//
//                                if(isWithin(e.getX(), x, width) && isWithin(e.getY(), y, height)){
//                                    System.out.println("Green");
//                                    panel.setBackground(Color.GREEN);
//                                }else{
//                                    System.out.println("Blue");
//                                    panel.setBackground(Color.BLUE);
//                                }
//                            }
//                        }  );

                        super.mouseMoved(e);
                    }

                    @Override
                    public void mouseDragged(MouseEvent e) {
                        System.out.println("mouseDragged");
                        super.mouseDragged(e);
                    }

                    @Override
                    public void mouseReleased(MouseEvent e) {
                        System.out.println("mouseReleased");
                    }

                    @Override
                    public void mousePressed(MouseEvent e) {
                        System.out.println("mousePressed");
                    }
                });

                JFrame frame = new JFrame("Testing");
                frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
                frame.add(sp);
//                frame.setGlassPane(createGlassPanel());
//                frame.getGlassPane().setVisible(true);
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
        //scrollPane.setPreferredSize(new Dimension(500, 500));
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

    public static class ValueExportTransferHandler extends TransferHandler {

        public static final DataFlavor SUPPORTED_DATE_FLAVOR = DataFlavor.stringFlavor;
        private String value;

        public ValueExportTransferHandler(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        @Override
        public int getSourceActions(JComponent c) {
            return DnDConstants.ACTION_COPY_OR_MOVE;
        }

        @Override
        protected Transferable createTransferable(JComponent c) {
            Transferable t = new StringSelection(getValue());
            return t;
        }

        @Override
        protected void exportDone(JComponent source, Transferable data, int action) {
            super.exportDone(source, data, action);
            // Decide what to do after the drop has been accepted
        }

    }

    public static class ValueImportTransferHandler extends TransferHandler {

        public static final DataFlavor SUPPORTED_DATE_FLAVOR = DataFlavor.stringFlavor;

        public ValueImportTransferHandler() {
        }

        @Override
        public boolean canImport(TransferHandler.TransferSupport support) {
            return support.isDataFlavorSupported(SUPPORTED_DATE_FLAVOR);
        }

        @Override
        public boolean importData(TransferHandler.TransferSupport support) {
            boolean accept = false;
            if (canImport(support)) {
                try {
                    Transferable t = support.getTransferable();
                    Object value = t.getTransferData(SUPPORTED_DATE_FLAVOR);
                    if (value instanceof String) {
                        Component component = support.getComponent();
//                        if (component instanceof JLabel) {
//                            ((JLabel) component).setText(value.toString());
//                            accept = true;
//                        }else if( component instanceof JPanel){
                        if( component instanceof JPanel){
                            SwingUtilities.invokeLater(new Runnable() {
                                @Override
                                public void run() {
                                    GridBagConstraints c = new GridBagConstraints();
                                    c.fill = GridBagConstraints.BOTH;

                                    c.gridx = 3;
                                    c.gridy = 3;
                                    c.weightx = 1.0;
                                    c.weighty = 1.0;

                                    JButton button = new JButton(">>>>" + value.toString() + "<<<<<");
                                    ((JPanel)component).add(button, c);
                                    ((JPanel)component).invalidate();
                                    ((JPanel)component).repaint();

                                }
                            });
                            accept = true;
                        }
                    }
                } catch (Exception exp) {
                    exp.printStackTrace();
                }
            }
            return accept;
        }
    }

};