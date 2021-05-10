package sandbox.dnd;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ComponentAdapter;
import java.awt.event.ComponentEvent;
import java.awt.event.MouseEvent;
import java.awt.event.MouseMotionListener;
import java.util.Arrays;

public class BorderDropLayeredPanel extends JLayeredPane {

    public static void hide(DroppablePanel... panels){
        Arrays.stream(panels).forEach(DroppablePanel::hideMe);
    }

    public static void show(DroppablePanel... panels){
        Arrays.stream(panels).forEach(DroppablePanel::showMe);
    }

    private final JFrame parent;
    private BorderDropLayeredPanel selfRef = this;

    private final DroppablePanel leftPanel;
    private final DroppablePanel rightPanel;
    private final DroppablePanel topPanel;
    private final DroppablePanel bottomPanel;
    private final DroppablePanel centerPanel;


    public BorderDropLayeredPanel(JFrame parent) {
        super();
        this.parent = parent;

        JPanel panel1 = new JPanel(new BorderLayout());
        panel1.setBounds(0, 0, 5000, 5000);

        panel1.setBackground(Color.WHITE);

        leftPanel = new DroppablePanel(DroppablePanel.PanelPosition.Left);
        rightPanel = new DroppablePanel(DroppablePanel.PanelPosition.Right);
        topPanel = new DroppablePanel(DroppablePanel.PanelPosition.Top);
        bottomPanel = new DroppablePanel(DroppablePanel.PanelPosition.Bottom);
        centerPanel = new DroppablePanel(DroppablePanel.PanelPosition.Center);

        this.setPreferredSize(new Dimension(800, 800));

        this.add(panel1, 1);
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
                panel1.setSize(parent.getWidth(), parent.getHeight());
                leftPanel.setBounds(parent);
                rightPanel.setBounds(parent);
                topPanel.setBounds(parent);
                bottomPanel.setBounds(parent);
                centerPanel.setBounds(parent);
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
