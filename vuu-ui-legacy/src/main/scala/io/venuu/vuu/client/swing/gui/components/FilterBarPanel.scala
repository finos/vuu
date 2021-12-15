package io.venuu.vuu.client.swing.gui.components

import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.messages.ClientMessage
import io.venuu.vuu.client.swing.EventBus
import io.venuu.vuu.client.swing.gui.ViewPortContextProvider
import io.venuu.vuu.client.swing.gui.components.popup.ViewServerPopupMenus

import scala.swing.GridBagPanel.Fill
import scala.swing.event.ButtonClicked
import scala.swing.{Button, GridBagPanel, Label, TextArea}

/**
  * Created by chris on 20/03/2016.
  */
class FilterBarPanel(ctxtProvider: ViewPortContextProvider)(implicit eventBus: EventBus[ClientMessage], clock: Clock) extends GridBagPanel {

  private val c = new Constraints
  private val shouldFill = true

  def getFilterText = filterText.text

  if (shouldFill) {
    c.fill = Fill.Horizontal
  }

  private val filterLabel = new Label("Filter:")

  c.weightx = 0

  //c.fill = Fill.Horizontal
  c.gridwidth = 1
  c.gridx = 0;
  c.gridy = 0;
  layout(filterLabel) = c

  private val filterText = new TextArea()
  c.fill = Fill.Horizontal
  c.weightx = 1;
  c.gridx = 1;
  c.gridwidth = 3
  c.gridy = 0;
  layout(filterText) = c

  private val goButton = new Button("Go")
  c.fill = Fill.Horizontal
  c.weightx = 0;
  c.gridwidth = 1
  c.gridx = 5;
  c.gridy = 0;
  layout(goButton) = c

  listenTo(`goButton`)

  reactions += {
    case ButtonClicked(`goButton`) => {
      ctxtProvider.setContext(ctxtProvider.context().copy(filter = filterText.text))
      ViewServerPopupMenus.mutateViewPort(ctxtProvider)
    }
  }

}
