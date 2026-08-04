package org.finos.vuu.example.notifications

import org.finos.vuu.core.module.ViewServerModule
import org.finos.vuu.example.notifications.module.SimulatedNotificationsModule
import org.finos.vuu.net.{CreateViewPortRequest, CreateViewPortSuccess}
import org.finos.vuu.viewport.{ViewPortRange, ViewPortTable}
import org.finos.vuu.wsapi.WebSocketApiTestBase

class SimulatedNotificationsWSApiTest extends WebSocketApiTestBase {

  override protected def defineModuleWithTestTables(): ViewServerModule = {
    SimulatedNotificationsModule()
  }

  Feature("WebSocket API for Simulated Notifications") {
    Scenario("Create a viewport on notifications table and verify it generates notifications") {
      Given("A running Vuu server with SimulatedNotificationsModule")
      
      When("we create a viewport on the notifications table")
      val createViewPortRequest = CreateViewPortRequest(ViewPortTable("notifications", "NOTIFICATIONS"), ViewPortRange(0, 100), columns = Array("*"))
      vuuClient.send(sessionId, createViewPortRequest)
      val viewPortCreateResponse = vuuClient.awaitForMsgWithBody[CreateViewPortSuccess]
      
      Then("the response should contain a valid viewPortId")
      viewPortCreateResponse.isDefined shouldEqual true
      val viewPortId = viewPortCreateResponse.get.viewPortId
      viewPortId should not be empty
      
      And("the table should immediately contain 3 initial simulated notifications")
      waitForData(viewPortId, 3)
    }
  }
}
