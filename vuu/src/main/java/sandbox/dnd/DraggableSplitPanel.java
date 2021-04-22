package sandbox.dnd;

import sandbox.scratch.TestSplitPane;

import javax.swing.*;
import javax.swing.plaf.basic.BasicSplitPaneDivider;
import javax.swing.plaf.basic.BasicSplitPaneUI;
import java.awt.*;
import java.awt.event.*;

public class DraggableSplitPanel extends JSplitPane {

    private final DraggableSplitPanel selfRef = this;
    private final JFrame parent;
    private final JPanel left;
    private final BorderDropLayeredPanel right;

    public DraggableSplitPanel(JFrame parent){
        super();
        left = createLeft();
        right = new BorderDropLayeredPanel(parent);

        setLeftComponent(left);
        setRightComponent(right);
        this.parent = parent;

        this.setDividerLocation(0);

        BasicSplitPaneDivider divider = ((BasicSplitPaneUI) this.getUI()).getDivider();

        this.addMouseListener(new MouseAdapter() {

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
                selfRef.setDividerLocation(0);
            }

        });

        divider.addMouseListener(new MouseAdapter() {

            @Override
            public void mouseEntered(MouseEvent e) {
                //if (left.getWidth() == 0) {
                    selfRef.setDividerLocation(100);
                //}
            }
        });
    }


    public JButton createDraggableButton(String name){

        JButton button = new JButton(name);

        button.setTransferHandler(new TestSplitPane.ValueExportTransferHandler(name));

        button.addMouseMotionListener(new MouseAdapter() {
            @Override
            public void mouseDragged(MouseEvent e) {
                JButton button = (JButton) e.getSource();
                TransferHandler handler = button.getTransferHandler();
                handler.exportAsDrag(button, e, TransferHandler.COPY);

                ((BorderDropLayeredPanel)selfRef.getRightComponent()).showAll();

                System.out.println("Dragged with button:" + e);
            }

            @Override
            public void mouseMoved(MouseEvent e) {
                super.mouseMoved(e);
                //System.out.println("Moved with button:" + e);
            }

            @Override
            public void mousePressed(MouseEvent e) {
                super.mousePressed(e);
            }

            @Override
            public void mouseReleased(MouseEvent e) {
                ((BorderDropLayeredPanel)selfRef.getRightComponent()).hideAll();
            }
        });

        button.addMouseMotionListener(new MouseMotionListener() {
            @Override
            public void mouseDragged(MouseEvent e) {
                System.out.println("Moused Dragged Button:" + e);
            }

            @Override
            public void mouseMoved(MouseEvent e) {
                //System.out.println("Moused Moved Button:" + e);
            }
        });


        return button;
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






}
