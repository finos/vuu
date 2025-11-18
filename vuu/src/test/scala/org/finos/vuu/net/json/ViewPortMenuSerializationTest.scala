package org.finos.vuu.net.json

import com.typesafe.scalalogging.StrictLogging
import org.finos.toolbox.json.JsonUtil
import org.finos.vuu.net.ClientSessionId
import org.finos.vuu.net.json.JsonVsSerializer
import org.finos.vuu.net.rpc.RpcHandler
import org.finos.vuu.viewport.*
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class TestRpcServer extends RpcHandler with StrictLogging {

  def duplicate(selection: ViewPortSelection,sessionId: ClientSessionId) : ViewPortAction = {
    NoAction()
  }

  def deleteRows(selection: ViewPortSelection,sessionId: ClientSessionId) : ViewPortAction = {
    NoAction()
  }

  def deleteAll(sessionId: ClientSessionId) : ViewPortAction = {
    NoAction()
  }

  def editCell(rowKey: String, field:String, value: Object, sessionId: ClientSessionId) : ViewPortAction = {
    NoAction()
  }

  def editRow(rowKey: String, fields:Map[String, AnyRef], sessionId: ClientSessionId) : ViewPortAction = {
    NoAction()
  }

  def showDetails(selection: ViewPortSelection,sessionId: ClientSessionId) : ViewPortAction = {
    NoAction()
  }

  override def menuItems(): ViewPortMenu = {
    ViewPortMenu(
      ViewPortMenu("Insert",
        new SelectionViewPortMenuItem("Duplicate Row(s)", "", this.duplicate, "DUPLICATE")
      ),
      ViewPortMenu("Edit",
        new CellViewPortMenuItem("Edit Cell", "", this.editCell, "EDIT_CELL"),
        new RowViewPortMenuItem("Edit Row", "", this.editRow, "EDIT_ROW")
      ),
      ViewPortMenu("Delete",
        new SelectionViewPortMenuItem("Delete Row(s)", "", this.deleteRows, "DELETE_ROWS"),
        new TableViewPortMenuItem("Delete All Contents", "", this.deleteAll, "DELETE_ALL")
      ),
      new SelectionViewPortMenuItem("Show Details", filter = "", this.showDetails, "SHOW_DETAILS")
    )
  }
}


class ViewPortMenuTest extends AnyFeatureSpec with Matchers with GivenWhenThen{

  Feature("Check we can serialize a menu to JSON"){

    Scenario("Serialize menu to JSON"){

      val rpcServer = new TestRpcServer

      val mapper = JsonUtil.createMapper()

      val menu = rpcServer.menuItems()

      val json = mapper.writeValueAsString(menu)

      val menuBack = mapper.readValue(json, classOf[ViewPortMenu]).asInstanceOf[ViewPortMenuFolder]

      menuBack.menus.size shouldEqual(4)
    }
  }
}
