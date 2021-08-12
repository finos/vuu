package sandbox.scratch;

import sandbox.dnd.DroppablePanel;
import sandbox.dnd.DroppablePanelListener;

import javax.swing.*;
import java.awt.*;
import java.awt.dnd.DropTargetDragEvent;
import java.awt.event.ComponentAdapter;
import java.awt.event.ComponentEvent;
import java.awt.event.MouseEvent;
import java.awt.event.MouseMotionListener;
import java.util.Arrays;

public class LayerPaneExample implements DroppablePanelListener {

    public static void hide(DroppablePanel... panels){
        Arrays.stream(panels).forEach(DroppablePanel::hideMe);
    }

    public static void show(DroppablePanel... panels){
        Arrays.stream(panels).forEach(DroppablePanel::showMe);
    }

    @Override
    public void onDrop(String dropInfo, DroppablePanel.PanelPosition position) {

    }

    @Override
    public void onPanelOver(DropTargetDragEvent dtde) {

    }

    @Override
    public void onPanelEnter(DropTargetDragEvent dtde) {

    }

    public LayerPaneExample() {

        LayerPaneExample example = this;

        EventQueue.invokeLater(new Runnable() {
            public void run() {

                JLayeredPane pane = new JLayeredPane();

                JPanel panel1 = new JPanel(new BorderLayout());
                panel1.setBounds(0, 0, 800, 800);

                panel1.setBackground(Color.WHITE);

                DroppablePanel leftPanel = new DroppablePanel(DroppablePanel.PanelPosition.Left, example);
                DroppablePanel rightPanel = new DroppablePanel(DroppablePanel.PanelPosition.Right, example);
                DroppablePanel topPanel = new DroppablePanel(DroppablePanel.PanelPosition.Top, example);
                DroppablePanel bottomPanel = new DroppablePanel(DroppablePanel.PanelPosition.Bottom, example);
                DroppablePanel centerPanel = new DroppablePanel(DroppablePanel.PanelPosition.Center, example);

                centerPanel.showMe();

                JFrame frame = new JFrame("Test");
                pane.setPreferredSize(new Dimension(800, 800));

                pane.add(panel1, 1);
                pane.add(leftPanel, 0);
                pane.add(rightPanel, 0);
                pane.add(topPanel, 0);
                pane.add(bottomPanel, 0);
                pane.add(centerPanel, 0);

                pane.addMouseMotionListener(new MouseMotionListener() {
                    @Override
                    public void mouseDragged(MouseEvent e) {

                    }

                    @Override
                    public void mouseMoved(MouseEvent e) {
                        //System.out.println("mouse moved button" + e.getX() + " " + e.getY());

                        if(topPanel.hasPoint(e.getX(), e.getY())){
                            show(topPanel);
                            hide(leftPanel, rightPanel, bottomPanel,centerPanel);
                        }else if(bottomPanel.hasPoint(e.getX(), e.getY())){
                            show(bottomPanel);
                            hide(leftPanel, rightPanel, topPanel,centerPanel);
                        }else if(leftPanel.hasPoint(e.getX(), e.getY())){
                            show(leftPanel);
                            hide(bottomPanel, rightPanel, topPanel,centerPanel);
                        }else if(rightPanel.hasPoint(e.getX(), e.getY())){
                            show(rightPanel);
                            hide(bottomPanel, leftPanel, topPanel, centerPanel);
                        }else if(centerPanel.hasPoint(e.getX(), e.getY())){
                            show(centerPanel);
                            hide(bottomPanel, leftPanel, topPanel, rightPanel);
                        }

                        else{
                            hide(rightPanel, bottomPanel, leftPanel, topPanel);
                        }

                        if(e.getX() <= 150){
                            leftPanel.setVisible(true);
                        }else{
                            leftPanel.setVisible(false);
                        }
                    }
                });

                frame.add(pane);
                frame.addComponentListener(new ComponentAdapter() {
                    @Override
                    public void componentResized(ComponentEvent e) {
                        super.componentResized(e);
                        pane.setMinimumSize(new Dimension(frame.getWidth(), frame.getHeight()));
                        panel1.setSize(frame.getWidth(), frame.getHeight());
                        leftPanel.setBounds(frame);
                        rightPanel.setBounds(frame);
                        topPanel.setBounds(frame);
                        bottomPanel.setBounds(frame);
                        centerPanel.setBounds(frame);
                    }
                });

                frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
                frame.setPreferredSize(new Dimension(800, 800));
//                frame.setGlassPane(createGlassPanel());
//                frame.getGlassPane().setVisible(true);
                frame.setSize(1000, 1000);
                frame.pack();
                frame.setLocationRelativeTo(null);
                frame.setVisible(true);
            }

        });
    }

    public static void main(String[] args) {
        new LayerPaneExample();
    }


}
