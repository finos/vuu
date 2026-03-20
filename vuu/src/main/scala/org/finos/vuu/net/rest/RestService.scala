package org.finos.vuu.net.rest

trait RestService {

  def getServiceName: String

  def getUriGetAll: String

  def getUriGet: String

  def getUriPost: String

  def getUriDelete: String

  def getUriPut: String

  def onGetAll(context: RestContext): Unit

  def onPost(context: RestContext): Unit

  def onGet(context: RestContext): Unit

  def onPut(context: RestContext): Unit

  def onDelete(context: RestContext): Unit

}
