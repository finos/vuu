/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 22/01/2016.

  */
package io.venuu.vuu.client.swing.gui.components

import java.awt.Color

import com.typesafe.scalalogging.StrictLogging
import javax.swing.{DefaultCellEditor, InputVerifier, JComponent, JTextField}

import scala.util.{Failure, Success, Try}

trait CellValidator extends InputVerifier with StrictLogging{

  override def verify(input: JComponent): Boolean = {
    val textField = input.asInstanceOf[JTextField]
    val text = textField.getText

    Try(validate(text)) match {
      case Success(res) =>
        if(!res){
          input.setBackground(Color.RED)
          false
        }
        else
          true
      case Failure(e) =>
        input.setBackground(Color.RED)
        logger.error(s"when validating ${input} value = ${text}", e)
        false
    }
  }

  def validate(text: String): Boolean
}


class ValidatingCellEditor(validator: CellValidator) extends DefaultCellEditor(new JTextField()){

  override def stopCellEditing(): Boolean = {
    validator.verify(editorComponent) && super.stopCellEditing()
  }
}

class DoubleValidator extends CellValidator{
  override def validate(text: String): Boolean = {
    java.lang.Double.parseDouble(text)
    true
  }
}


