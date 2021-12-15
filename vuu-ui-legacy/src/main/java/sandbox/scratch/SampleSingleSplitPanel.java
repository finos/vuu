package sandbox.scratch;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

public class SampleSingleSplitPanel {

    public SampleSingleSplitPanel() {

        EventQueue.invokeLater(new Runnable() {
            public void run() {

                JPanel panel = new JPanel(new GridLayout(1,1));
                JButton button = new JButton("Click Me");
                panel.add(button);

                JFrame frame = new JFrame("Testing");
                frame.add(panel);

                button.addActionListener(new ActionListener() {
                    @Override
                    public void actionPerformed(ActionEvent e) {
                        SwingUtilities.invokeLater(new Runnable() {
                            @Override
                            public void run() {
                                System.out.println("thread =>" + Thread.currentThread().getName());
                                frame.remove(panel);
                                JButton left = new JButton("Foo");
                                JButton right = new JButton("Foo");
                                frame.add(new JSplitPane(JSplitPane.HORIZONTAL_SPLIT, left, right));
                                frame.invalidate();
                                frame.getContentPane().repaint();
                            }
                        });
                    }
                });



                frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
                frame.add(panel);
//                frame.setGlassPane(createGlassPanel());
//                frame.getGlassPane().setVisible(true);
                frame.pack();
                frame.setLocationRelativeTo(null);
                frame.setVisible(true);
            }

        });
    }

    public static void main(String[] args) {
        new SampleSingleSplitPanel();
    }
}


