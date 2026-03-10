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

  def scaledDecimal2(): String = {
    str + ":ScaledDecimal2"
  }

  def scaledDecimal4(): String = {
    str + ":ScaledDecimal4"
  }

  def scaledDecimal6(): String = {
    str + ":ScaledDecimal6"
  }

  def scaledDecimal8(): String = {
    str + ":ScaledDecimal8"
  }

}

abstract class DefaultModule {
  //advanced string impl for field definition
  implicit def stringToFieldDef(s: String): FieldDefString = new FieldDefString(s)
}
