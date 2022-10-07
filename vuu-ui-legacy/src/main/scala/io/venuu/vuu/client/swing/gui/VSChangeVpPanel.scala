package io.venuu.vuu.client.swing.gui

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.messages.{ClientChangeViewPortRequest, ClientMessage, RequestId}
import io.venuu.vuu.client.swing.EventBus
import io.venuu.vuu.client.swing.gui.components.{MutableModel, MutableMultiSelectComboBox}
import io.venuu.vuu.net.FilterSpec

import java.awt.Dimension
import scala.collection.mutable.ListBuffer
import scala.swing._
import scala.swing.event.ButtonClicked

class VSChangeVpPanel(context: ViewPortContext)(implicit eventBus: EventBus[ClientMessage], timeProvider: Clock) extends Frame with StrictLogging {

  this.preferredSize = new Dimension(700, 800)

  val currentColumns = context.columns.sorted
  val availableColumns = context.availableColumns.sorted

  val optionsAvailable = ListBuffer[String]()
  optionsAvailable ++= availableColumns

  val optionsCurrent = ListBuffer[String]()
  optionsCurrent ++= currentColumns

  val leftListView = new ListView(optionsAvailable){
    listData = optionsAvailable
  }

  leftListView.fixedCellWidth = 200

  val rightListView = new ListView(optionsAvailable){
    listData = optionsAvailable
  }

  rightListView.fixedCellWidth = 200

  val buttonLtoR = new Button(" >> ")
  buttonLtoR.preferredSize = new Dimension(50, 10)
  val buttonRtoL = new Button(" << ")
  buttonRtoL.preferredSize = new Dimension(50, 10)

  val okButton = new Button("OK")
  val cancelButton = new Button("Cancel")

  val filterTxt = new TextField()
  filterTxt.columns = 50


  listenTo(buttonLtoR, buttonRtoL, okButton, cancelButton)

  reactions += {

    case ButtonClicked(`buttonLtoR`) =>
      val selected = leftListView.selection.items
      rightListView.listData = (rightListView.listData ++ selected).sorted.distinct

    case ButtonClicked(`buttonRtoL`) =>

      val selected = rightListView.selection.items
      val alldata = rightListView.listData

      val lessColumns = alldata.filter( s => ! selected.contains(s) )

      rightListView.listData = lessColumns

    case ButtonClicked(`cancelButton`) =>
      close()

    case ButtonClicked(`okButton`) =>
      val requestId = RequestId.oneNew()
      val filterSpec = if(filterTxt.text != "") FilterSpec(filterTxt.text)
                       else null

      eventBus.publish(ClientChangeViewPortRequest(requestId, context.vpId, rightListView.listData.toArray, filterSpec = filterSpec))
      close()
  }

  val filter = new GridPanel(2,2){

    contents += new Label("Filter")
    contents += filterTxt
    contents += new Label("Sort")
    contents += new MutableMultiSelectComboBox[String](new MutableModel[String])
  }

  val OkCancelPanel = new GridPanel(1, 2){
    contents += cancelButton
    contents += okButton
  }

  val bottomPanel = new GridPanel(3, 1){
    contents += new Label("")
    contents += filter
    contents += OkCancelPanel

  }

  val middlePanel = new GridPanel(2, 1){
    contents += buttonLtoR
    contents += buttonRtoL
  }

  val surroundPanel = new BorderPanel{
    layout(leftListView) = BorderPanel.Position.West
    layout(rightListView) = BorderPanel.Position.East
    layout(middlePanel) = BorderPanel.Position.Center
    layout(bottomPanel) = BorderPanel.Position.South
  }

  this.contents = surroundPanel
}
