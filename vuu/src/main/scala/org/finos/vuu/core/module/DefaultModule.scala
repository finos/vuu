package org.finos.vuu.core.module

import scala.language.implicitConversions

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

  def epochTimestamp(): String = {
    str + ":EpochTimestamp"
  }

  def decimal(): String = {
    str + ":Decimal"
  }

}

abstract class DefaultModule {
  //advanced string impl for field definition
  implicit def stringToFieldDef(s: String): FieldDefString = new FieldDefString(s)
}
