package org.finos.vuu.net.rest

trait RestContext {
  def pathParams: Map[String, String]
  def queryParams: Map[String, String]
  def body: Option[String]
  def respond(status: Int, body: String, headers: Map[String, String] = Map.empty): Unit
}
