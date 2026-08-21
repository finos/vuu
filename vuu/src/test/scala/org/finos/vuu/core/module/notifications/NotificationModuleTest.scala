package org.finos.vuu.core.module.notifications

import org.finos.toolbox.lifecycle.LifecycleContainer
import org.finos.toolbox.time.{Clock, DefaultClock}
import org.finos.vuu.core.module.TableDefContainer
import org.finos.vuu.core.table.{Columns, DefaultColumn}
import org.finos.vuu.provider.MockProvider
import org.scalatest.GivenWhenThen
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

class NotificationModuleTest extends AnyFeatureSpec with Matchers with GivenWhenThen {

  Feature("Check NotificationModule and NotificationsSchema syntax and structure") {

    Scenario("Create generic Notifications schema columns") {
      Given("The generic NotificationsSchema")
      val cols = NotificationsSchema.allFrom()

      Then("It should contain the 7 generic notification columns")
      cols.map(_.name) should contain theSameElementsAs Array("id", "type", "expiryTime", "title", "message", "level", "audience")
    }

    Scenario("Create generic Notifications schema columns with additional columns") {
      Given("The generic NotificationsSchema with additional columns")
      val cols = NotificationsSchema.allFrom("source:String", "priority:Int")

      Then("It should contain the generic columns plus additional columns")
      cols.map(_.name) should contain theSameElementsAs Array("id", "type", "expiryTime", "title", "message", "level", "audience", "source", "priority")
    }

    Scenario("Create the NotificationModule with a MockProvider") {
      Given("A tableDefContainer and lifecycle container")
      implicit val clock: Clock = new DefaultClock()
      implicit val lifecycle: LifecycleContainer = new LifecycleContainer()
      implicit val tableDefContainer: TableDefContainer = new TableDefContainer(Map())

      When("The NotificationModule is instantiated with additional columns and a permission function")
      import org.finos.vuu.core.filter.`type`.AllowAllPermissionFilter
      import org.finos.vuu.api.ViewPortDef
      val module = NotificationModule(
        (table, _) => new MockProvider(table),
        (_, _) => AllowAllPermissionFilter,
        (table, _, _, _) => ViewPortDef.default(table.getTableDef.getColumns),
        "source:String", "priority:Int"
      )

      Then("The module should be named NOTIFICATIONS and contain the notifications table")
      module.name should equal("NOTIFICATIONS")
      module.tableDefs.size should be(1)

      val notifTable = module.tableDefs.head
      notifTable.name should equal("notifications")
      notifTable.keyField should equal("id")
      notifTable.options.joinFields should equal(Seq("id"))

      notifTable.getColumns should equal(
        Columns.fromNames(
          "id:String",
          "type:String",
          "expiryTime:EpochTimestamp",
          "title:String",
          "message:String",
          "level:String",
          "audience:String",
          "source:String",
          "priority:Int",
          DefaultColumn.CreatedTime.name + ":EpochTimestamp",
          DefaultColumn.LastUpdatedTime.name + ":EpochTimestamp",
          DefaultColumn.MSG.name + ":String"
        )
      )
    }
  }
}
