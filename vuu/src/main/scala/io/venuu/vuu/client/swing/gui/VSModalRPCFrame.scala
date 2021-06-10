package io.venuu.vuu.client.swing.gui

import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.swing.EventBus
import io.venuu.vuu.client.swing.messages.{ClientCreateViewPort, ClientMessage, RequestId}
import io.venuu.vuu.client.swing.model.ViewPortedModel
import io.venuu.vuu.net.SortSpec
import io.venuu.vuu.viewport.ViewPortTable

import java.awt.Dimension
import scala.swing.{BorderPanel, Dialog, Frame, Window}

class VSModalRPCFrame(owner: Frame, tableName: ViewPortTable, columns: Array[String])(implicit eventBus: EventBus[ClientMessage], timeProvider: Clock) extends Dialog(owner) {

  this.preferredSize = new Dimension(1024, 768)
  val requestId = RequestId.oneNew()

  val model = new ViewPortedModel(requestId, Array("RowIndex") ++ columns)
  model.setRange(0, 100)
  val vsPanel = new ViewServerGridPanel(owner, requestId, tableName, columns, Array("RowIndex") ++ columns, model)

  eventBus.publish(ClientCreateViewPort(requestId, tableName, columns, SortSpec(List()), Array(), 0, 100, ""))

  contents = new BorderPanel {
    import scala.swing.BorderPanel.Position._
    add(vsPanel, Center)

  }

  pack()

}
