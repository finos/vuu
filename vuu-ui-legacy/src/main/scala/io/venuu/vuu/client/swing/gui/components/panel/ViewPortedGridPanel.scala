package io.venuu.vuu.client.swing.gui.components.panel

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.messages.{ClientCreateViewPort, ClientMessage, RequestId}
import io.venuu.vuu.client.swing.EventBus
import io.venuu.vuu.client.swing.gui.ViewServerGridPanel
import io.venuu.vuu.client.swing.model.ViewPortedModel
import io.venuu.vuu.net.SortSpec
import io.venuu.vuu.viewport.ViewPortTable

import java.awt.Dimension
import scala.swing.BorderPanel.Position.Center
import scala.swing.{BorderPanel, Frame}

class ViewPortedGridPanel(owner: Frame, tableName: ViewPortTable, columns: Array[String])(implicit eventBus: EventBus[ClientMessage], timeProvider: Clock) extends BorderPanel with StrictLogging {

  this.preferredSize = new Dimension(1024, 768)
  val requestId = RequestId.oneNew()

  val model = new ViewPortedModel(requestId, Array("RowIndex", "Selected") ++ columns)
  model.setRange(0, 100)
  val vsPanel = new ViewServerGridPanel(owner, requestId, tableName, columns, Array("RowIndex", "Selected") ++ columns, model)

  eventBus.publish(ClientCreateViewPort(requestId, tableName, columns, SortSpec(List()), Array(), 0, 100, ""))

  add(vsPanel, Center)
}
