package io.venuu.vuu.client.swing.gui.components.popup

import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.swing.EventBus
import io.venuu.vuu.client.swing.gui.components.popup.ViewServerPopupMenus.mutateViewPort
import io.venuu.vuu.client.swing.gui.{SwingThread, ViewPortContextProvider, components}
import io.venuu.vuu.client.swing.messages.{ClientChangeViewPortRequest, ClientDisableViewPort, ClientEnableViewPort, ClientGetViewPortMenusResponse, ClientMessage, RequestId}
import io.venuu.vuu.net.{AggType, Aggregations, FilterSpec, SortDef, SortSpec}
import io.venuu.vuu.viewport.{EmptyViewPortMenu, ViewPortMenu, ViewPortMenuFolder, ViewPortMenuItem}

import scala.swing.{Action, Menu, MenuItem, PopupMenu}

object ViewServerPopupMenus {

  def parseViewPortMenu(menu : Option[ClientGetViewPortMenusResponse]): components.PopupMenu  = {

    val menuObject = new components.PopupMenu()

    def recursiveAdd(root: components.PopupMenu, parent: Menu, menu: ViewPortMenu) :components.PopupMenu = {

      menu match {
        case EmptyViewPortMenu =>
          println("empty: ->" + menu)
          root
        case folder: ViewPortMenuFolder =>
          println("folder: ->" + folder)
          val folderMenuItem: Menu = new Menu(folder.name)
          folder.menus.foreach( item => recursiveAdd(root, folderMenuItem, item))
          root.contents += folderMenuItem
          root
        case item: ViewPortMenuItem =>
          println("item: ->" + item.name + "[" + item.rpcName + "]")
          val menuItem = new MenuItem(Action(item.name) {
            println("Do Action -> " + item.name)
            //eventBus.publish(ClientDisableViewPort(RequestId.oneNew(), ctxProvider.context().vpId))
          })
          parent.contents += menuItem
          root
        case _ =>
          root
      }
    }

    menu match {
      case Some(resp) => recursiveAdd(menuObject, null, resp.menu)
      case None =>
        menuObject.contents += new MenuItem("Empty"){
            println("Empty")
        }
        menuObject
    }
  }

  def mutateViewPort(ctxtProvider: ViewPortContextProvider)(implicit eventBus: EventBus[ClientMessage], clock: Clock): Unit = {
    //}, filterText: String, sort: Option[List[SortDef]]): Unit = {

    val ctxt = ctxtProvider.context()

    val filterSpec = if (ctxtProvider.context().filter != "")
      FilterSpec(ctxtProvider.context().filter)
    else
      null

    //    val sortSpec = sort match {
    //      case Some(fields) => SortSpec(fields)
    //      case None => SortSpec(List())
    //    }

    val reqId = RequestId.oneNew()

    SwingThread.swing(() => {
      ctxtProvider.toggleRenderer()
    })

    eventBus.publish(ClientChangeViewPortRequest(reqId,
      ctxt.vpId,
      ctxt.columns,
      filterSpec = filterSpec,
      sortBy = ctxt.sortBy,
      groupBy = ctxt.groupBy,
      aggregations = ctxt.aggregations)
    )
  }

  def defaultPopup(ctxProvider: ViewPortContextProvider)(implicit eventBus: EventBus[ClientMessage], clock: Clock): Menu = {
    new Menu("Actions") {
      val disableViewPort = new MenuItem(Action("Disable ViewPort") {
        eventBus.publish(ClientDisableViewPort(RequestId.oneNew(), ctxProvider.context().vpId))
      })

      val enableViewPort = new MenuItem(Action("Enable ViewPort") {
        eventBus.publish(ClientEnableViewPort(RequestId.oneNew(), ctxProvider.context().vpId))
      })

      contents += disableViewPort
      contents += enableViewPort
    }
  }

  def aggregateMenu(ctxProvider: ViewPortContextProvider)(implicit eventBus: EventBus[ClientMessage], clock: Clock): Menu = {
    val menu: Menu = new Menu("Add to Aggregates") {
      val addWithSum = new MenuItem(Action("Sum") {
        val ctx = ctxProvider.context()
        ctx.currentColumn match {
          case Some(column) =>
            val name = column.getIdentifier.asInstanceOf[String]
            ctxProvider.setContext(ctx.copy(aggregations = ctx.aggregations ++ Array(Aggregations(name, AggType.Sum))))
            mutateViewPort(ctxProvider)
          case None =>
            throw new Exception("Column Not Found")
        }
      })

      val addWithCount = new MenuItem(Action("Count") {
        val ctx = ctxProvider.context()
        ctx.currentColumn match {
          case Some(column) =>
            val name = column.getIdentifier.asInstanceOf[String]
            ctxProvider.setContext(ctx.copy(aggregations = ctx.aggregations ++ Array(Aggregations(name, AggType.Count))))
            mutateViewPort(ctxProvider)
          case None =>
            throw new Exception("Column Not Found")
        }
      })
      contents += addWithSum
      contents += addWithCount
    }
    menu
  }

  def groupByPopup(ctxProvider: ViewPortContextProvider)(implicit eventBus: EventBus[ClientMessage], clock: Clock): components.PopupMenu = {
    new components.PopupMenu {
      val addToGroupByMenu: Menu = new Menu("Add to GroupBy") {
        val addNoAgg = new MenuItem(Action("No Aggregate") {
          val ctx = ctxProvider.context()
          ctx.currentColumn match {
            case Some(column) =>
              val name = column.getIdentifier.asInstanceOf[String]
              ctxProvider.setContext(ctx.copy(groupBy = ctx.groupBy ++ Array(name)))
              mutateViewPort(ctxProvider)
            case None => println("bad")
          }
        })

        val addWithSum = new MenuItem(Action("Sum Aggregate") {
          val ctx = ctxProvider.context()
          ctx.currentColumn match {
            case Some(column) =>
              val name = column.getIdentifier.asInstanceOf[String]
              ctxProvider.setContext(ctx.copy(groupBy = ctx.groupBy ++ Array(name),
                aggregations = ctx.aggregations ++ Array(Aggregations(name, AggType.Sum)),
                filter = ctx.filter))
              mutateViewPort(ctxProvider)
            case None => println("bad")
          }
        })

        val addWithCount = new MenuItem(Action("Count Aggregate") {
          val ctx = ctxProvider.context()
          ctx.currentColumn match {
            case Some(column) =>
              val name = column.getIdentifier.asInstanceOf[String]
              ctxProvider.setContext(ctx.copy(groupBy = ctx.groupBy ++ Array(name),
                aggregations = ctx.aggregations ++ Array(Aggregations(name, AggType.Count)),
                filter = ctx.filter))
              mutateViewPort(ctxProvider)
            case None => println("bad")
          }
        })


        contents += addNoAgg
        contents += addWithCount
        contents += addWithSum
      }

      val removeFromGroupBy = new MenuItem(Action("Remove From GroupBy") {
        println("was here")
      })

      val enableViewPort = new MenuItem(Action("Enable ViewPort"){
        eventBus.publish(ClientEnableViewPort(RequestId.oneNew(), ctxProvider.context().vpId))
      })


      contents += addToGroupByMenu
      contents += aggregateMenu(ctxProvider)
      contents += removeFromGroupBy
      contents += enableViewPort
    }

  }
}
