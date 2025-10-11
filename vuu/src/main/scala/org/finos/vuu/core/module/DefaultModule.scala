package org.finos.vuu.core.module

class FieldDefString(str: String) {
  def double(): String = {
    str + ":Double"
  }

  def long(): String = {
    str + ":Long"
  }

  def boolean(): String = {
    str + ":Boolean"
  }

  def char(): String = {
    str + ":Char"
  }


  def int(): String = {
    str + ":Int"
  }

  def string(): String = {
    str + ":String"
  }
}

abstract class DefaultModule {
  //pimped string impl for field definition
  implicit def stringToFieldDef(s: String): FieldDefString = new FieldDefString(s)
}
