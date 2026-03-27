package org.finos.vuu.net.rest

trait RestService {

  def getServiceName: String

  def getUriGetAll: String

  def getUriGet: String

  def getUriPost: String

  def getUriDelete: String

  def getUriPut: String

  def onGetAll(context: RestContext): Unit = {
    context.respond(404)
  }

  def onPost(context: RestContext): Unit = {
    context.respond(404)
  }

  def onGet(context: RestContext): Unit = {
    context.respond(404)
  }

  def onPut(context: RestContext): Unit = {
    context.respond(404)
  }

  def onDelete(context: RestContext): Unit = {
    context.respond(404)
  }

}
