/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 22/01/2016.

  */
package io.venuu.vuu.client.swing.gui

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.swing.EventBus
import io.venuu.vuu.client.swing.gui.components.MutableComboBox
import io.venuu.vuu.client.swing.messages._
import io.venuu.vuu.client.swing.model.{RpcModel, VSHackedTable}

import scala.swing.BorderPanel.Position._
import scala.swing._
import scala.swing.event.{ButtonClicked, SelectionChanged}

class RpcDataEntry(name: String)(implicit val eventBus: EventBus[ClientMessage], timeProvider: Clock) extends Dialog with StrictLogging{

  val tablesCombo = new MutableComboBox[String]()
  //val columnsCombo = new MutableComboBox[String]()
  val update = new Button("Update")
  val emptylabel = new Label("")

  @volatile var lastRequestId = ""

  eventBus.register( msg => {
    msg match {
      case msg: ClientGetTableListResponse =>
        tablesCombo.items = msg.tables.toSeq
      //case ru: ClientServerRowUpdate if ru.vpId == vpId => handleRowUpdate(ru)
      case msg: ClientGetTableMetaResponse if msg.requestId == lastRequestId =>
        theModel.setColumns(msg.columns, msg.dataTypes, msg.key)
        println(s"got table meta = ${msg.table} ${msg.columns} ${msg.dataTypes}")
      case _ =>
    }
  })

  val theModel = new RpcModel()

  def getTable(): Table = {

    new VSHackedTable {
      model = theModel//new ViewPortedModel(vpId, columns)
    }
  }

  val table = getTable()
  val scrollPane = new ScrollPane(table)


  eventBus.publish(ClientGetTableList(RequestId.oneNew()))

  val buttonPanel = new BorderPanel{
    layout(new Label("Table:")) = West
    layout(tablesCombo) = Center
    //contents += update
  }

  val updateButtonPanel = new BorderPanel{
    layout(new Label("")) = West
    layout(new Label("~")) = Center
    layout(update) = East
  }


  listenTo(`tablesCombo`)
  listenTo(`update`)

  reactions += {
    case SelectionChanged(`tablesCombo`) =>
      println("on change")
      lastRequestId = RequestId.oneNew()
      eventBus.publish(ClientGetTableMeta(lastRequestId, tablesCombo.item))
    case ButtonClicked(`update`) =>
      theModel.getData().foreach({case (key,row) => {
        logger.info(s"sending key $key row ${row}")
        eventBus.publish(ClientRpcTableUpdate(RequestId.oneNew(), tablesCombo.item, key, row))
      }
      })
  }

  //val buttonPanel = new FlowPanel(connect, tablesCombo, columnsCombo, createViewPort, testCombo, sessionLabel)

  contents = new BorderPanel {

    import scala.swing.BorderPanel.Position._

    add(scrollPane, Center)
    add(buttonPanel, North)
    add(updateButtonPanel, South)
  }

  pack()

}
