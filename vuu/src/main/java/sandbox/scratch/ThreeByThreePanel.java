package sandbox.scratch;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ComponentAdapter;
import java.awt.event.ComponentEvent;
import java.util.LinkedList;
import java.util.List;

public class ThreeByThreePanel extends JPanel {

    private JPanel[][] panels = new JPanel[3][3];
    private List<JPanel> panelList = new LinkedList<JPanel>();

    public ThreeByThreePanel(){
        super(new GridLayout(3,3));

        this.setBackground(Color.BLUE);

        for(int x=0; x<3; x++){
            for(int y=0; y<3; y++){
                JPanel panel = createChildPanel(x, y);
                this.add(panel);
                panelList.add(panel);
                panels[x][y] = panel;
            }
        }
    }

    public boolean hitTest(JPanel panel, int x, int y){
        return x >= panel.getX() && x < panel.getX() + panel.getWidth() &&
               y >= panel.getY() && y < panel.getY() + panel.getHeight();
    }

    public JPanel getCenterCenter(){
        return panels[1][1];
    }

    public JPanel getCenterTop(){
        return panels[0][1];
    }

    public JPanel getCenterBottom(){
        return panels[2][1];
    }

    public JPanel getCenterLeft(){
        return panels[1][0];
    }

    public JPanel getCenterRight(){
        return panels[1][2];
    }

    public void colourTopRow(){
        for(int i=0;i<3;i++){
            panels[0][i].setBackground(Color.GREEN);
            panels[1][i].setBackground(Color.BLUE);
            panels[2][i].setBackground(Color.BLUE);
        }
    }

    public void colourMiddleRow(){
        for(int i=0;i<3;i++){
            panels[0][i].setBackground(Color.BLUE);
            panels[1][i].setBackground(Color.GREEN);
            panels[2][i].setBackground(Color.BLUE);
        }
    }

    public void colourBottomRow(){
        for(int i=0;i<3;i++){
            panels[0][i].setBackground(Color.BLUE);
            panels[1][i].setBackground(Color.BLUE);
            panels[2][i].setBackground(Color.GREEN);
        }
    }

    public void colourAllCells(){
        for(int i=0;i<3;i++){
            panels[0][i].setBackground(Color.GREEN);
            panels[1][i].setBackground(Color.GREEN);
            panels[2][i].setBackground(Color.GREEN);
        }
    }


    public void colourLeftColumn(){
        for(int i=0;i<3;i++){
            panels[i][0].setBackground(Color.GREEN);
            panels[i][1].setBackground(Color.BLUE);
            panels[i][2].setBackground(Color.BLUE);
        }
    }

    public void colourRightColumn(){
        for(int i=0;i<3;i++){
            panels[i][0].setBackground(Color.BLUE);
            panels[i][1].setBackground(Color.BLUE);
            panels[i][2].setBackground(Color.GREEN);
        }
    }

    public List<JPanel> getPanelList() {
        return panelList;
    }



    public static JPanel createChildPanel(int x, int y){
        JPanel panel = new JPanel();
        panel.setOpaque(true);
        panel.setBackground(new Color(0,0,0,64));
        panel.setName(x + "" + y);
        JLabel label = new JLabel(x + "" + y);
        label.setTransferHandler(new TestSplitPane.ValueImportTransferHandler());
        panel.setTransferHandler(new TestSplitPane.ValueImportTransferHandler());

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



}
