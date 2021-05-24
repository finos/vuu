package sandbox.dnd;

import javax.swing.*;
import java.awt.*;

public class MainFrame {

    public MainFrame() {

        EventQueue.invokeLater(new Runnable() {
            public void run() {
                try {
                    UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
                JFrame frame = new JFrame("Testing");
                frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
                DraggableSplitPanel splitPanel = new DraggableSplitPanel(frame);
                frame.add(splitPanel);
                frame.pack();
                frame.setLocationRelativeTo(null);
                frame.setVisible(true);
            }
        });
    }

    public static void main(String[] args) {
        new MainFrame();
    }

}
