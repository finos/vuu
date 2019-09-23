/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 06/01/2016.

  */
package io.venuu.vuu.client.swing.gui

import com.typesafe.scalalogging.StrictLogging
import javax.swing.SwingUtilities

object SwingThread extends StrictLogging {

  def swing(fn: () => Unit): Unit = {
    SwingUtilities.invokeLater(new Runnable(){
      def run() {
        //logger.info("Calling swing thread")
        fn()
      }
    })
  }

}
