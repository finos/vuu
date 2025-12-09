package org.finos.vuu.api

enum TableVisibility {
  case Public
  case Private
}

object TableVisibility {

  val PUBLIC: TableVisibility = TableVisibility.Public
  val PRIVATE: TableVisibility = TableVisibility.Private

}