package sandbox.dnd;

import javax.swing.*;
import java.awt.*;
import java.awt.dnd.DropTargetDragEvent;
import java.awt.event.ComponentAdapter;
import java.awt.event.ComponentEvent;
import java.awt.event.MouseEvent;
import java.awt.event.MouseMotionListener;
import java.util.Arrays;

public class BorderDropLayeredPanel extends JLayeredPane implements DroppablePanelListener {

    public static void hide(DroppablePanel... panels){
        Arrays.stream(panels).forEach(DroppablePanel::hideMe);
    }

    public static void show(DroppablePanel... panels){
        Arrays.stream(panels).forEach(DroppablePanel::showMe);
    }

    private final JFrame ultimateParent;
    private final JComponent parent;

    private BorderDropLayeredPanel selfRef = this;

    private final DroppablePanel leftPanel;
    private final DroppablePanel rightPanel;
    private final DroppablePanel topPanel;
    private final DroppablePanel bottomPanel;
    private final DroppablePanel centerPanel;
    private final JPanel backPanel;

    @Override
    public void onDrop(String dropInfo, DroppablePanel.PanelPosition position) {
        SwingUtilities.invokeLater(() -> {
            if(position == DroppablePanel.PanelPosition.Center){
                backPanel.add(new JButton(dropInfo), BorderLayout.CENTER);
            }else if(position == DroppablePanel.PanelPosition.Left){
                JSplitPane pane = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT);
                pane.add(new BorderDropLayeredPanel(ultimateParent, this), JSplitPane.RIGHT);
                pane.add(new JButton(dropInfo), JSplitPane.LEFT);
                backPanel.add(pane);
            }else if(position == DroppablePanel.PanelPosition.Right){
                JSplitPane pane = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT);
                pane.add(new BorderDropLayeredPanel(ultimateParent, this), JSplitPane.LEFT);
                pane.add(new JButton(dropInfo), JSplitPane.RIGHT);
                backPanel.add(pane);
            }else if(position == DroppablePanel.PanelPosition.Top){
                JSplitPane pane = new JSplitPane(JSplitPane.VERTICAL_SPLIT);
                pane.add(new BorderDropLayeredPanel(ultimateParent, this), JSplitPane.BOTTOM);
                pane.add(new JButton(dropInfo), JSplitPane.TOP);
                backPanel.add(pane);
            }else if(position == DroppablePanel.PanelPosition.Bottom){
                JSplitPane pane = new JSplitPane(JSplitPane.VERTICAL_SPLIT);
                pane.add(new BorderDropLayeredPanel(ultimateParent, this), JSplitPane.TOP);
                pane.add(new JButton(dropInfo), JSplitPane.BOTTOM);
                backPanel.add(pane);
            }

            //backPanel.add(new JButton(dropInfo), BorderLayout.CENTER);
            hide(leftPanel, rightPanel, topPanel, bottomPanel, centerPanel);
            parent.repaint();
        });
    }

    @Override
    public void onPanelOver(DropTargetDragEvent dtde) {
        //parent.repaint();
    }

    @Override
    public void onPanelEnter(DropTargetDragEvent dtde) {
        //parent.repaint();
    }

    public BorderDropLayeredPanel(JFrame ultimateParent, JComponent parent) {
        super();
        this.parent = parent;
        this.ultimateParent = ultimateParent;

        backPanel = new JPanel(new BorderLayout());
        //backPanel.setBounds(0, 0, 5000, 5000);

        leftPanel = new DroppablePanel(DroppablePanel.PanelPosition.Left, this);
        rightPanel = new DroppablePanel(DroppablePanel.PanelPosition.Right, this);
        topPanel = new DroppablePanel(DroppablePanel.PanelPosition.Top, this);
        bottomPanel = new DroppablePanel(DroppablePanel.PanelPosition.Bottom, this);
        centerPanel = new DroppablePanel(DroppablePanel.PanelPosition.Center, this);

        this.setPreferredSize(new Dimension(800, 800));

        this.add(backPanel, 1);
        this.add(leftPanel, 0);
        this.add(rightPanel, 0);
        this.add(topPanel, 0);
        this.add(bottomPanel, 0);
        this.add(centerPanel, 0);

        parent.addComponentListener(new ComponentAdapter() {
            @Override
            public void componentResized(ComponentEvent e) {
                super.componentResized(e);
                selfRef.setSize(parent.getWidth(), parent.getHeight());
                backPanel.setSize(parent.getWidth(), parent.getHeight());
                leftPanel.setBounds(parent.getBounds());
                rightPanel.setBounds(parent.getBounds());
                topPanel.setBounds(parent.getBounds());
                bottomPanel.setBounds(parent.getBounds());
                centerPanel.setBounds(parent.getBounds());
            }
        });

        this.addMouseMotionListener(new MouseMotionListener() {
            @Override
            public void mouseDragged(MouseEvent e) {

            }

            @Override
            public void mouseMoved(MouseEvent e) {

//                if(topPanel.hasPoint(e.getX(), e.getY())){
//                    show(topPanel);
//                    hide(leftPanel, rightPanel, bottomPanel,centerPanel);
//                }else if(bottomPanel.hasPoint(e.getX(), e.getY())){
//                    show(bottomPanel);
//                    hide(leftPanel, rightPanel, topPanel,centerPanel);
//                }else if(leftPanel.hasPoint(e.getX(), e.getY())){
//                    show(leftPanel);
//                    hide(bottomPanel, rightPanel, topPanel,centerPanel);
//                }else if(rightPanel.hasPoint(e.getX(), e.getY())){
//                    show(rightPanel);
//                    hide(bottomPanel, leftPanel, topPanel, centerPanel);
//                }else if(centerPanel.hasPoint(e.getX(), e.getY())){
//                    show(centerPanel);
//                    hide(bottomPanel, leftPanel, topPanel, rightPanel);
//                }
//                else{
//                    hide(rightPanel, bottomPanel, leftPanel, topPanel, centerPanel);
//                }
            }
        });

    }

    public void showAll(){
        show(topPanel, leftPanel, rightPanel, bottomPanel,centerPanel);
    }

    public void hideAll(){
        hide(topPanel, leftPanel, rightPanel, bottomPanel,centerPanel);
    }

}
